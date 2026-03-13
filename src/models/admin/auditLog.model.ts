import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminAccount",
      required: true,
    },
    adminUsername: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      enum: [
        "LOGIN",
        "LOGOUT",
        "MFA_SETUP",
        "USER_MODIFY",
        "ROLE_CHANGE",
        "USER_DELETE",
        "USER_BAN",
        "USER_SUSPEND",
        "SESSION_REVOKE",
        "EXPORT_CREATE",
        "SECURITY_CHANGE",
      ],
      required: true,
    },
    resourceType: {
      type: String, // "User", "AdminAccount", "Session", etc.
    },
    resourceId: {
      type: String,
    },
    before: {
      type: mongoose.Schema.Types.Mixed, // state before change
    },
    after: {
      type: mongoose.Schema.Types.Mixed, // state after change
    },
    status: {
      type: String,
      enum: ["success", "failure"],
      default: "success",
    },
    errorMessage: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: false }
);

// Indexes for querying audit logs
auditLogSchema.index({ adminId: 1, timestamp: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ status: 1 });

// Append-only: prevent updates after creation
auditLogSchema.pre("findByIdAndUpdate" as any, function (this: any, next: any) {
  const error = new Error("Audit logs are immutable");
  next(error);
});

export default mongoose.model("AuditLog", auditLogSchema);
