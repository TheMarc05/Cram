import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const createProject = async (req: Request, res: Response) => {
  try {
    const { name, description, repoUrl } = req.body;
    const userId = req.user!.id; // from auth middleware

    if (!name) {
      return res.status(400).json({ error: "Project name is required" });
    }

    const project = await prisma.project.create({
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
  } catch (error: any) {
    console.error("Create project error:", error);
    res.status(500).json({ error: "Failed to create project" });
  }
};

export const getUserProjects = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const projects = await prisma.project.findMany({
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
  } catch (error: any) {
    console.error("Get projects error:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
};

export const getProjectById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const project = await prisma.project.findFirst({
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
  } catch (error: any) {
    console.error("Get project error:", error);
    res.status(500).json({ error: "Failed to fetch project" });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, repoUrl } = req.body;
    const userId = req.user!.id;

    // Verifică ownership
    const existingProject = await prisma.project.findFirst({
      where: {
        id: parseInt(id),
        userId,
      },
    });

    if (!existingProject) {
      return res.status(404).json({ error: "Project not found" });
    }

    const project = await prisma.project.update({
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
  } catch (error: any) {
    console.error("Update project error:", error);
    res.status(500).json({ error: "Failed to update project" });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Verifică ownership
    const existingProject = await prisma.project.findFirst({
      where: {
        id: parseInt(id),
        userId,
      },
    });

    if (!existingProject) {
      return res.status(404).json({ error: "Project not found" });
    }

    await prisma.project.delete({
      where: { id: parseInt(id) },
    });

    res.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete project error:", error);
    res.status(500).json({ error: "Failed to delete project" });
  }
};
