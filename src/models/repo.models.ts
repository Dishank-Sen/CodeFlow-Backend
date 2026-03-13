import mongoose from "mongoose";

const repoSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  repoName: { type: String, required: true },
  userName: { type: String, required: true, lowercase: true, index: true },
  repoName_normalized: { type: String, required: true },
  description: { type: String, default: "" },
  remoteUrl: { type: String, required: true },
  visibility: { type: String, enum: ["public", "private"], default: "public" },
  pinned: { type: Boolean, default: false },
  stars: { type: Number, default: 0 },
  starredBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  forks: { type: Number, default: 0 },
}, { timestamps: true });

// indexes
repoSchema.index({ ownerId: 1, repoName_normalized: 1 }, { unique: true }); // uniqueness per owner
repoSchema.index({ ownerId: 1, updatedAt: -1 }); // listing by recent
repoSchema.index({ ownerId: 1, pinned: 1 }, { partialFilterExpression: { pinned: true }});
repoSchema.index({ repoName: "text", description: "text" });
repoSchema.index({ userName: 1, visibility: 1, updatedAt: -1 }); // fast visitor query + sort
repoSchema.index({ userName: 1, updatedAt: -1 }); // owner listing, fallback
repoSchema.index({ userName: 1, repoName_normalized: 1 }, { unique: true });
repoSchema.index({ starredBy: 1 }); // for querying starred repos


export default mongoose.model("Repo", repoSchema);