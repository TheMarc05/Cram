"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const projectController_1 = require("../controllers/projectController");
const router = (0, express_1.Router)();
// all routes require authentication
router.use(auth_1.authenticateToken);
// POST /api/projects - create new project
router.post("/", projectController_1.createProject);
// GET /api/projects - get all projects for the user
router.get("/", projectController_1.getUserProjects);
// GET /api/projects/:id - get a specific project
router.get("/:id", projectController_1.getProjectById);
// PUT /api/projects/:id - update a project
router.put("/:id", projectController_1.updateProject);
// DELETE /api/projects/:id - delete a project
router.delete("/:id", projectController_1.deleteProject);
exports.default = router;
