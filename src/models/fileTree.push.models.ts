// models/filetree.model.ts
import mongoose from "mongoose";

const fileTreeSchema = new mongoose.Schema(
  {
    ownerName: {
      type: String,
      required: true,
    },

    repoName: {
      type: String,
      required: true,
    },

    // Full tree snapshot
    files: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    // Snapshot time
    timestamp: {
      type: Date,
      required: true,
    },
  },
  {
    minimize: false, // keep empty objects if any
  }
);

// 🔑 Indexes
fileTreeSchema.index({ ownerName: 1, repoName: 1, timestamp: -1 });
fileTreeSchema.index({ ownerName: 1, repoName: 1 }, { unique: true });


export default mongoose.model("FileTree", fileTreeSchema);
