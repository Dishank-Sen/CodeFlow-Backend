import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  userName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profileImg: { type: String, default: "" },
  repository: [{
    repoName: { type: String, required: true},
    description: { type: String, default: ""},
    visibility: {type: String, required: true},
    pinned: {type: Boolean, default: false}
  }]
}, { timestamps: true });

export default mongoose.model("User", userSchema);