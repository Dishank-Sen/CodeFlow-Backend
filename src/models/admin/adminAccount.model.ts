import mongoose from "mongoose";

const adminAccountSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["SUPER_ADMIN", "ADMIN", "SUPPORT", "AUDITOR"],
      default: "AUDITOR",
    },
    status: {
      type: String,
      enum: ["active", "suspended", "deleted"],
      default: "active",
    },
    mfaEnabled: {
      type: Boolean,
      default: true,
    },
    mfaSecret: {
      type: String, // encrypted
    },
    mfaBackupCodes: [
      {
        type: String, // encrypted backup codes
      },
    ],
    lastLogin: {
      type: Date,
    },
    lastLoginIp: {
      type: String,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockedUntil: {
      type: Date, // Account locked after N failed attempts
    },
  },
  { timestamps: true }
);

// Indexes for fast lookups (username and email already have unique indexes)
adminAccountSchema.index({ role: 1 });
adminAccountSchema.index({ status: 1 });

export default mongoose.model("AdminAccount", adminAccountSchema);
