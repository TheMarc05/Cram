"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProject = exports.updateProject = exports.getProjectById = exports.getUserProjects = exports.createProject = void 0;
const prisma_1 = require("../lib/prisma");
const createProject = async (req, res) => {
    try {
        const { name, description, repoUrl } = req.body;
        const userId = req.user.id; // from auth middleware
        if (!name) {
            return res.status(400).json({ error: "Project name is required" });
        }
        const project = await prisma_1.prisma.project.create({
            data: {
                userId,
                name,
                description,
                repoUrl,
            },
        });
        res.status(201).json({
            success: true,
            data: project,
        });
    }
    catch (error) {
        console.error("Create project error:", error);
        res.status(500).json({ error: "Failed to create project" });
    }
};
exports.createProject = createProject;
const getUserProjects = async (req, res) => {
    try {
        const userId = req.user.id;
        const projects = await prisma_1.prisma.project.findMany({
            where: { userId },
            include: {
                _count: {
                    select: {
                        files: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json({
            success: true,
            data: projects,
        });
    }
    catch (error) {
        console.error("Get projects error:", error);
        res.status(500).json({ error: "Failed to fetch projects" });
    }
};
exports.getUserProjects = getUserProjects;
const getProjectById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const project = await prisma_1.prisma.project.findFirst({
            where: {
                id: parseInt(id),
                userId,
            },
            include: {
                files: {
                    include: {
                        reviews: {
                            orderBy: { createdAt: "desc" },
                            take: 1, // Ultimul review
                        },
                    },
                    orderBy: { createdAt: "desc" },
                },
            },
        });
        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }
        res.json({
            success: true,
            data: project,
        });
    }
    catch (error) {
        console.error("Get project error:", error);
        res.status(500).json({ error: "Failed to fetch project" });
    }
};
exports.getProjectById = getProjectById;
const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, repoUrl } = req.body;
        const userId = req.user.id;
        // Verifică ownership
        const existingProject = await prisma_1.prisma.project.findFirst({
            where: {
                id: parseInt(id),
                userId,
            },
        });
        if (!existingProject) {
            return res.status(404).json({ error: "Project not found" });
        }
        const project = await prisma_1.prisma.project.update({
            where: { id: parseInt(id) },
            data: {
                name,
                description,
                repoUrl,
            },
        });
        res.json({
            success: true,
            data: project,
        });
    }
    catch (error) {
        console.error("Update project error:", error);
        res.status(500).json({ error: "Failed to update project" });
    }
};
exports.updateProject = updateProject;
const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        // Verifică ownership
        const existingProject = await prisma_1.prisma.project.findFirst({
            where: {
                id: parseInt(id),
                userId,
            },
        });
        if (!existingProject) {
            return res.status(404).json({ error: "Project not found" });
        }
        await prisma_1.prisma.project.delete({
            where: { id: parseInt(id) },
        });
        res.json({
            success: true,
            message: "Project deleted successfully",
        });
    }
    catch (error) {
        console.error("Delete project error:", error);
        res.status(500).json({ error: "Failed to delete project" });
    }
};
exports.deleteProject = deleteProject;
