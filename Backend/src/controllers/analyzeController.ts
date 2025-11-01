import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { aiService } from "../services/aiService";
import { detectLanguage } from "../utils/languageDetector";
import { DiffService } from "../services/diffService";
import { GuidelineService } from "../services/guidelineService";

export const analyzeFile = async (req: Request, res: Response) => {
  try {
    const { projectId, filename, content, path } = req.body;
    const userId = req.user!.id;

    if (!projectId || !filename || !content) {
      return res.status(400).json({
        error: "projectId, filename, and content are required",
      });
    }

    const project = await prisma.project.findFirst({
      where: {
        id: parseInt(projectId),
        userId,
      },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const language = detectLanguage(filename);
    const newHash = DiffService.calculateHash(content);
    const filePath = path || "/";

    console.log(`📝 Analyzing ${filename} (${language} - ${filename.substring(filename.lastIndexOf('.'))})...`);
    
    // Validate language detection
    const fileExtension = filename.substring(filename.lastIndexOf('.')).toLowerCase();
    const expectedLanguage = language.toLowerCase();
    
    // Log language context for AI
    console.log(`🔍 Language context: ${expectedLanguage} code from ${fileExtension} file`);

    const guidelineIds = (project as any).guidelineIds as string[] | null | undefined;
    const guidelineRules = guidelineIds && guidelineIds.length > 0
      ? GuidelineService.combineGuidelines(guidelineIds.filter((id) => {
          const guideline = GuidelineService.getById(id);
          return guideline && guideline.language.includes(language);
        }))
      : undefined;

    if (guidelineRules) {
      console.log(`📋 Applying ${guidelineIds?.filter(id => {
        const g = GuidelineService.getById(id);
        return g && g.language.includes(language);
      }).length || 0} coding guidelines for ${language}...`);
    }

    const existingFile = await prisma.file.findFirst({
      where: {
        projectId: parseInt(projectId),
        path: filePath,
        filename: filename,
      },
      orderBy: {
        version: "desc",
      },
    });

    let isIncremental = false;
    let diffResult = null;
    let diffSnippet = "";
    let changedLines: number[] = [];

    if (existingFile && existingFile.contentHash) {
      const oldHash = existingFile.contentHash;

      if (oldHash !== newHash) {
        console.log(
          `🔄 File changed! Calculating diff... (v${existingFile.version} → v${existingFile.version + 1})`
        );

        diffResult = DiffService.calculateDiff(
          existingFile.content,
          content,
          3
        );

        if (diffResult.hasChanges) {
          isIncremental = true;
          changedLines = [
            ...diffResult.addedLines,
            ...diffResult.modifiedLines,
          ];
          diffSnippet = DiffService.buildIncrementalSnippet(
            content,
            diffResult,
            5
          );

          console.log(
            `✅ Diff calculated: ${diffResult.totalChanges} changes (${diffResult.addedLines.length} added, ${diffResult.modifiedLines.length} modified, ${diffResult.deletedLines.length} deleted)`
          );
        }
      } else {
        console.log(`⏭️  File unchanged (same hash), skipping re-analysis`);
        return res.status(200).json({
          success: true,
          message: "File unchanged, no re-analysis needed",
          data: {
            fileId: existingFile.id,
            filename: existingFile.filename,
            unchanged: true,
          },
        });
      }
    }

    const file = await prisma.file.create({
      data: {
        projectId: parseInt(projectId),
        filename,
        path: filePath,
        content,
        contentHash: newHash,
        version: existingFile ? existingFile.version + 1 : 1,
        language,
        size: Buffer.byteLength(content, "utf8"),
        lastModified: new Date(),
      },
    });

    const review = await prisma.review.create({
      data: {
        fileId: file.id,
        modelUsed: "codellama:7b-instruct",
        status: "PROCESSING",
        isIncremental,
        report: {},
      },
    });

    try {
      let analysisResult;

      if (isIncremental && diffResult) {
        console.log(
          `🔄 Running INCREMENTAL analysis on ${changedLines.length} changed lines...`
        );

        analysisResult = await aiService.analyzeCodeIncremental(
          content,
          language,
          filename,
          changedLines,
          diffSnippet,
          (project as any).customRules || undefined,
          guidelineRules
        );
      } else {
        console.log(`📝 Running FULL analysis...`);

        analysisResult = await aiService.analyzeCode(
          content,
          language,
          filename,
          (project as any).customRules || undefined,
          guidelineRules
        );
      }

      await prisma.review.update({
        where: { id: review.id },
        data: {
          status: "COMPLETED",
          isIncremental,
          changedLines: isIncremental
            ? ({ added: diffResult!.addedLines, modified: diffResult!.modifiedLines, deleted: diffResult!.deletedLines } as any)
            : undefined,
          report: {
            issues: analysisResult.issues,
          } as any,
          summary: analysisResult.summary as any,
          metadata: analysisResult.metadata as any,
        } as any,
      });

      console.log(
        `✅ ${isIncremental ? "Incremental" : "Full"} analysis completed: ${analysisResult.summary.totalIssues} issues found`
      );

      res.status(201).json({
        success: true,
        data: {
          reviewId: review.id,
          fileId: file.id,
          filename: file.filename,
          language: file.language,
          version: file.version,
          isIncremental,
          changedLines: isIncremental ? changedLines.length : 0,
          summary: analysisResult.summary,
          issues: analysisResult.issues,
          metadata: analysisResult.metadata,
        },
      });
    } catch (aiError: any) {
      // Marchează review ca FAILED
      await prisma.review.update({
        where: { id: review.id },
        data: {
          status: "FAILED",
          metadata: {
            error: aiError.message,
          },
        },
      });

      throw aiError;
    }
  } catch (error: any) {
    console.error("Analysis error:", error);
    res.status(500).json({
      error: "Analysis failed",
      message: error.message,
    });
  }
};

export const analyzeBatch = async (req: Request, res: Response) => {
  try {
    const { projectId, files } = req.body; // files = [{filename, content, path}]
    const userId = req.user!.id;

    if (!projectId || !files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({
        error: "projectId and files array are required",
      });
    }

    // Verifică proiectul
    const project = await prisma.project.findFirst({
      where: {
        id: parseInt(projectId),
        userId,
      },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const results = [];

    // Procesează fiecare fișier
    for (const fileData of files) {
      const { filename, content, path } = fileData;

      if (!filename || !content) {
        results.push({
          filename: filename || "unknown",
          success: false,
          error: "Missing filename or content",
        });
        continue;
      }

      try {
        const language = detectLanguage(filename);

        const file = await prisma.file.create({
          data: {
            projectId: parseInt(projectId),
            filename,
            path: path || "/",
            content,
            language,
            size: Buffer.byteLength(content, "utf8"),
            lastModified: new Date(),
          },
        });

        const analysisResult = await aiService.analyzeCode(
          content,
          language,
          filename,
          (project as any).customRules || undefined
        );

        const review = await prisma.review.create({
          data: {
            fileId: file.id,
            modelUsed: "codellama:7b-instruct",
            status: "COMPLETED",
            report: { issues: analysisResult.issues } as any,
            summary: analysisResult.summary as any,
            metadata: analysisResult.metadata as any,
          },
        });

        results.push({
          filename,
          success: true,
          reviewId: review.id,
          fileId: file.id,
          summary: analysisResult.summary,
        });
      } catch (error: any) {
        results.push({
          filename,
          success: false,
          error: error.message,
        });
      }
    }

    res.status(201).json({
      success: true,
      data: {
        processed: results.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results,
      },
    });
  } catch (error: any) {
    console.error("Batch analysis error:", error);
    res.status(500).json({ error: "Batch analysis failed" });
  }
};

//health check for AI service
export const aiHealthCheck = async (req: Request, res: Response) => {
  try {
    const isHealthy = await aiService.healthCheck();
    const models = await aiService.listModels();

    res.json({
      success: true,
      data: {
        status: isHealthy ? "healthy" : "unhealthy",
        models,
      },
    });
  } catch (error: any) {
    res.status(503).json({
      success: false,
      error: "AI service unavailable",
      message: error.message,
    });
  }
};
