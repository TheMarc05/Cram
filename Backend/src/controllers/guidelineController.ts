import { Request, Response } from "express";
import { GuidelineService } from "../services/guidelineService";

export const getAllGuidelines = async (req: Request, res: Response) => {
  try {
    const { language } = req.query;

    let guidelines = GuidelineService.getAll();

    if (language && typeof language === "string") {
      guidelines = GuidelineService.getByLanguage(language);
    }

    res.json({
      success: true,
      data: guidelines,
    });
  } catch (error: any) {
    console.error("Get guidelines error:", error);
    res.status(500).json({ error: "Failed to fetch guidelines" });
  }
};

export const getGuidelineById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const guideline = GuidelineService.getById(id);

    if (!guideline) {
      return res.status(404).json({ error: "Guideline not found" });
    }

    res.json({
      success: true,
      data: guideline,
    });
  } catch (error: any) {
    console.error("Get guideline error:", error);
    res.status(500).json({ error: "Failed to fetch guideline" });
  }
};

export const getGuidelinesByLanguage = async (req: Request, res: Response) => {
  try {
    const { language } = req.params;

    const guidelines = GuidelineService.getByLanguage(language);

    res.json({
      success: true,
      data: guidelines,
    });
  } catch (error: any) {
    console.error("Get guidelines by language error:", error);
    res.status(500).json({ error: "Failed to fetch guidelines" });
  }
};

export const validateGuidelineIds = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids)) {
      return res.status(400).json({ error: "ids must be an array" });
    }

    const { valid, invalid } = GuidelineService.validateGuidelineIds(ids);

    res.json({
      success: true,
      data: {
        valid,
        invalid,
        validCount: valid.length,
        invalidCount: invalid.length,
      },
    });
  } catch (error: any) {
    console.error("Validate guideline IDs error:", error);
    res.status(500).json({ error: "Failed to validate guideline IDs" });
  }
};

