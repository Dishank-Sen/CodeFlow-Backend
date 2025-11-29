// models/user.model.ts
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  userName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profileImg: { type: String, default: "" },
  repository: [{ type: mongoose.Schema.Types.ObjectId, ref: "Repo" }],
  repoCount: { type: Number, default: 0 },
  bio: { type: String, default: "" },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  schemaVersion: { type: Number, default: 2 }
}, { timestamps: true });

export default mongoose.model("User", userSchema);