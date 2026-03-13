import { Request, Response } from "express";
import Feedback from "../models/feedback.models.js";

export const submitFeedback = async (req: Request, res: Response) => {
  try {
    const { userName, title, message, category } = req.body;

    if (!userName || !title || !message) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Validate category
    const validCategories = ["general", "bug", "feature", "documentation"];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category",
      });
    }

    // Create new feedback
    const feedback = new Feedback({
      userName,
      title: title.trim(),
      message: message.trim(),
      category,
    });

    await feedback.save();

    return res.status(201).json({
      success: true,
      message: "Feedback submitted successfully",
      data: feedback,
    });
  } catch (error) {
    console.error("Feedback submission error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit feedback",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getAllFeedback = async (req: Request, res: Response) => {
  try {
    const feedback = await Feedback.find()
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    console.error("Fetch feedback error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch feedback",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getFeedbackByCategory = async (req: Request, res: Response) => {
  try {
    const { reqParam } = req.params;
    let category: string
    if (typeof(reqParam) === 'string'){
      category = reqParam
    }else if(Array.isArray(reqParam)){
      category = reqParam[0]
    }else{
      category = "unknown"
    }

    const validCategories = ["general", "bug", "feature", "documentation"];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category",
      });
    }

    const feedback = await Feedback.find({ category })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    console.error("Fetch feedback by category error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch feedback",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
