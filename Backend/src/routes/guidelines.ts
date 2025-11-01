import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import {
  getAllGuidelines,
  getGuidelineById,
  getGuidelinesByLanguage,
  validateGuidelineIds,
} from "../controllers/guidelineController";

const router = Router();

router.use(authenticateToken);

router.get("/", getAllGuidelines);

router.post("/validate", validateGuidelineIds);

router.get("/language/:language", getGuidelinesByLanguage);

router.get("/:id", getGuidelineById);

export default router;

