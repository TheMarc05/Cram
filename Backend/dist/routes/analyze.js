"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const analyzeController_1 = require("../controllers/analyzeController");
const router = (0, express_1.Router)();
// all routes require authentication
router.use(auth_1.authenticateToken);
// POST /api/analyze - analyze a single file
router.post("/", analyzeController_1.analyzeFile);
// POST /api/analyze/batch - analyze multiple files
router.post("/batch", analyzeController_1.analyzeBatch);
// GET /api/analyze/health - health check AI service
router.get("/health", analyzeController_1.aiHealthCheck);
exports.default = router;
