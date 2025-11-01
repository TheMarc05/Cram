import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import {
  analyzeFile,
  analyzeBatch,
  aiHealthCheck,
} from "../controllers/analyzeController";

const router = Router();

// all routes require authentication
router.use(authenticateToken);

// POST /api/analyze - analyze a single file
router.post("/", analyzeFile);

// POST /api/analyze/batch - analyze multiple files
router.post("/batch", analyzeBatch);

// GET /api/analyze/health - health check AI service
router.get("/health", aiHealthCheck);

export default router;
