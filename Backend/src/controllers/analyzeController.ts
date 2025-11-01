import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { aiService } from "../services/aiService";
import { detectLanguage } from "../utils/languageDetector";

export const analyzeFile = async (req: Request, res: Response) => {
  try {
    const { projectId, filename, content, path } = req.body;
    const userId = req.user!.id;

    // Validare input
    if (!projectId || !filename || !content) {
      return res.status(400).json({
        error: "projectId, filename, and content are required",
      });
    }

    // Verifică că proiectul aparține userului
    const project = await prisma.project.findFirst({
      where: {
        id: parseInt(projectId),
        userId,
      },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Detectează limbajul
    const language = detectLanguage(filename);

    console.log(`📝 Analyzing ${filename} (${language})...`);

    // Salvează fișierul în baza de date
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

    // Creează review cu status PROCESSING
    const review = await prisma.review.create({
      data: {
        fileId: file.id,
        modelUsed: "codellama:7b-instruct",
        status: "PROCESSING",
        report: {},
      },
    });

    // Analizează cu AI (async)
    try {
      const analysisResult = await aiService.analyzeCode(
        content,
        language,
        filename
      );

      // Actualizează review cu rezultatele
      await prisma.review.update({
        where: { id: review.id },
        data: {
          status: "COMPLETED",
          report: {
            issues: analysisResult.issues,
          } as any,
          summary: analysisResult.summary as any,
          metadata: analysisResult.metadata as any,
        },
      });

      console.log(
        `Analysis completed: ${analysisResult.summary.totalIssues} issues found`
      );

      res.status(201).json({
        success: true,
        data: {
          reviewId: review.id,
          fileId: file.id,
          filename: file.filename,
          language: file.language,
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
          filename
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
