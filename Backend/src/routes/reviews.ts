import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import {
  getReviewById,
  getProjectReviews,
  getDashboardStats,
  addComment,
  deleteReview,
} from "../controllers/reviewController";

const router = Router();

// all routes require authentication
router.use(authenticateToken);

// GET /api/reviews/stats - Dashboard statistics
router.get("/stats", getDashboardStats);

// GET /api/reviews/project/:projectId - get all reviews for a project
router.get("/project/:projectId", getProjectReviews);

// GET /api/reviews/:id - get a specific review
router.get("/:id", getReviewById);

// POST /api/reviews/:reviewId/comments - add a comment
router.post("/:reviewId/comments", addComment);

// DELETE /api/reviews/:id - delete a review
router.delete("/:id", deleteReview);

export default router;
