import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import {
  createProject,
  getUserProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from "../controllers/projectController";

const router = Router();

// all routes require authentication
router.use(authenticateToken);

// POST /api/projects - create new project
router.post("/", createProject);

// GET /api/projects - get all projects for the user
router.get("/", getUserProjects);

// GET /api/projects/:id - get a specific project
router.get("/:id", getProjectById);

// PUT /api/projects/:id - update a project
router.put("/:id", updateProject);

// DELETE /api/projects/:id - delete a project
router.delete("/:id", deleteProject);

export default router;
