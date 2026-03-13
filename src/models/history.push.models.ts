// models/history.model.ts
import mongoose from "mongoose";

const historySchema = new mongoose.Schema({
  ownerName: {
    type: String,
    required: true,
  },

  repoName: {
    type: String,
    required: true,
  },

  path: {
    type: String,
    required: true,
  },

  type: {
    type: String,
    enum: ["snapshot", "delta"],
    required: true,
  },

  content: {
    type: String,
    required: true,
  },

  timestamp: {
    type: Date,
    required: true,
  },

  currentSize: {
    type: Number,
  },
});

// 🔑 Indexes driven by query patterns
historySchema.index({ ownerName: 1, repoName: 1, timestamp: -1 });
historySchema.index({ ownerName: 1, repoName: 1, path: 1 });

export default mongoose.model("History", historySchema);
