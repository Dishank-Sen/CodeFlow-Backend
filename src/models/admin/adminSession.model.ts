import mongoose from "mongoose";

const adminSessionSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminAccount",
      required: true,
      index: true,
    },
    sessionToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // TTL index
    },
    mfaVerified: {
      type: Boolean,
      default: false,
    },
    mfaVerifiedAt: {
      type: Date,
    },
    mfaTempSecret: {
      type: String,
    },
    mfaTempBackupCodes: [
      {
        type: String,
      },
    ],
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

export default mongoose.model("AdminSession", adminSessionSchema);
