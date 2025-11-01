"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiHealthCheck = exports.analyzeBatch = exports.analyzeFile = void 0;
const prisma_1 = require("../lib/prisma");
const aiService_1 = require("../services/aiService");
const languageDetector_1 = require("../utils/languageDetector");
const analyzeFile = async (req, res) => {
    try {
        const { projectId, filename, content, path } = req.body;
        const userId = req.user.id;
        // Validare input
        if (!projectId || !filename || !content) {
            return res.status(400).json({
                error: "projectId, filename, and content are required",
            });
        }
        // Verifică că proiectul aparține userului
        const project = await prisma_1.prisma.project.findFirst({
            where: {
                id: parseInt(projectId),
                userId,
            },
        });
        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }
        // Detectează limbajul
        const language = (0, languageDetector_1.detectLanguage)(filename);
        console.log(`📝 Analyzing ${filename} (${language})...`);
        // Salvează fișierul în baza de date
        const file = await prisma_1.prisma.file.create({
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
        const review = await prisma_1.prisma.review.create({
            data: {
                fileId: file.id,
                modelUsed: "codellama:7b-instruct",
                status: "PROCESSING",
                report: {},
            },
        });
        // Analizează cu AI (async)
        try {
            const analysisResult = await aiService_1.aiService.analyzeCode(content, language, filename);
            // Actualizează review cu rezultatele
            await prisma_1.prisma.review.update({
                where: { id: review.id },
                data: {
                    status: "COMPLETED",
                    report: {
                        issues: analysisResult.issues,
                    },
                    summary: analysisResult.summary,
                    metadata: analysisResult.metadata,
                },
            });
            console.log(`Analysis completed: ${analysisResult.summary.totalIssues} issues found`);
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
        }
        catch (aiError) {
            // Marchează review ca FAILED
            await prisma_1.prisma.review.update({
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
    }
    catch (error) {
        console.error("Analysis error:", error);
        res.status(500).json({
            error: "Analysis failed",
            message: error.message,
        });
    }
};
exports.analyzeFile = analyzeFile;
const analyzeBatch = async (req, res) => {
    try {
        const { projectId, files } = req.body; // files = [{filename, content, path}]
        const userId = req.user.id;
        if (!projectId || !files || !Array.isArray(files) || files.length === 0) {
            return res.status(400).json({
                error: "projectId and files array are required",
            });
        }
        // Verifică proiectul
        const project = await prisma_1.prisma.project.findFirst({
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
                const language = (0, languageDetector_1.detectLanguage)(filename);
                const file = await prisma_1.prisma.file.create({
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
                const analysisResult = await aiService_1.aiService.analyzeCode(content, language, filename);
                const review = await prisma_1.prisma.review.create({
                    data: {
                        fileId: file.id,
                        modelUsed: "codellama:7b-instruct",
                        status: "COMPLETED",
                        report: { issues: analysisResult.issues },
                        summary: analysisResult.summary,
                        metadata: analysisResult.metadata,
                    },
                });
                results.push({
                    filename,
                    success: true,
                    reviewId: review.id,
                    fileId: file.id,
                    summary: analysisResult.summary,
                });
            }
            catch (error) {
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
    }
    catch (error) {
        console.error("Batch analysis error:", error);
        res.status(500).json({ error: "Batch analysis failed" });
    }
};
exports.analyzeBatch = analyzeBatch;
//health check for AI service
const aiHealthCheck = async (req, res) => {
    try {
        const isHealthy = await aiService_1.aiService.healthCheck();
        const models = await aiService_1.aiService.listModels();
        res.json({
            success: true,
            data: {
                status: isHealthy ? "healthy" : "unhealthy",
                models,
            },
        });
    }
    catch (error) {
        res.status(503).json({
            success: false,
            error: "AI service unavailable",
            message: error.message,
        });
    }
};
exports.aiHealthCheck = aiHealthCheck;
