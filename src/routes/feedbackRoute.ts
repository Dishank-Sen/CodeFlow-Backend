import express from "express";
import {
  submitFeedback,
  getAllFeedback,
  getFeedbackByCategory,
} from "../controllers/feedback.controller.js";

const router = express.Router();

// Submit feedback (requires authentication)
router.post("/", submitFeedback);

// Get all feedback
router.get("/", getAllFeedback);

// Get feedback by category
router.get("/category/:category", getFeedbackByCategory);

export default router;
