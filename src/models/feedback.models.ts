import mongoose, { Schema, Document } from "mongoose";

export interface IFeedback extends Document {
  userId: string;
  userName: string;
  title: string;
  message: string;
  category: "general" | "bug" | "feature" | "documentation";
  createdAt: Date;
  updatedAt: Date;
}

const feedbackSchema = new Schema<IFeedback>(
  {
    userName: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 100,
    },
    message: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    category: {
      type: String,
      enum: ["general", "bug", "feature", "documentation"],
      default: "general",
    },
  },
  {
    timestamps: true,
  }
);

const Feedback = mongoose.model<IFeedback>("Feedback", feedbackSchema);

export default Feedback;
