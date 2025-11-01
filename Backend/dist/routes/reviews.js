"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const reviewController_1 = require("../controllers/reviewController");
const router = (0, express_1.Router)();
// all routes require authentication
router.use(auth_1.authenticateToken);
// GET /api/reviews/stats - Dashboard statistics
router.get("/stats", reviewController_1.getDashboardStats);
// GET /api/reviews/project/:projectId - get all reviews for a project
router.get("/project/:projectId", reviewController_1.getProjectReviews);
// GET /api/reviews/:id - get a specific review
router.get("/:id", reviewController_1.getReviewById);
// POST /api/reviews/:reviewId/comments - add a comment
router.post("/:reviewId/comments", reviewController_1.addComment);
// DELETE /api/reviews/:id - delete a review
router.delete("/:id", reviewController_1.deleteReview);
exports.default = router;
