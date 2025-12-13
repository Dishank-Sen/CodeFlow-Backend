// models/rootTimeline.model.ts
import mongoose from "mongoose";

const rootTimelineSchema = new mongoose.Schema({
  ownerName: {
    type: String,
    required: true,
  },

  repoName: {
    type: String,
    required: true,
  },

  // action type: create | remove | rename
  action: {
    type: String,
    enum: ["create", "remove", "rename"],
    required: true,
  },

  // common target info
  path: {
    type: String,
    required: true,
  },

  name: {
    type: String,
  },

  isDir: {
    type: Boolean,
  },

  size: {
    type: Number,
  },

  // rename-specific fields
  newPath: {
    type: String,
  },

  newName: {
    type: String,
  },

  // event timestamp (authoritative)
  timestamp: {
    type: Date,
    required: true,
  },

  // raw payload (optional, future-proof)
  payload: {
    type: mongoose.Schema.Types.Mixed,
  },
});

rootTimelineSchema.index(
  { ownerName: 1, repoName: 1, timestamp: -1 }
);

rootTimelineSchema.index(
  { ownerName: 1, repoName: 1, path: 1 }
);

export default mongoose.model("RootTimeline", rootTimelineSchema)