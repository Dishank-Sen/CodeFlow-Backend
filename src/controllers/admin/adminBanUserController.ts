import { Response } from "express";
import User from '../../models/user.models.js';
import { AuditLog } from '../../models/admin/index.js';
import { AdminRequest } from '../../middleware/admin/adminAuthMiddleware.js';

export async function adminBanUserController(
  req: AdminRequest,
  res: Response
) {
  try {
    const { id } = req.params;
    const { status } = req.body; // "active", "suspended", "banned"

    if (!id) {
      return res.status(400).json({
        error: "MISSING_FIELD",
        message: "User ID required",
      });
    }

    if (!["active", "suspended", "banned"].includes(status)) {
      return res.status(400).json({
        error: "INVALID_STATUS",
        message: "Invalid status. Must be active, suspended, or banned",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        error: "NOT_FOUND",
        message: "User not found",
      });
    }

    const oldStatus = user.accountStatus || "active";
    user.accountStatus = status;
    await user.save();

    // Log to audit trail
    await AuditLog.create({
      adminId: req.admin?.id,
      adminUsername: req.admin?.username,
      action: "USER_STATUS_CHANGE",
      resourceType: "User",
      resourceId: user._id.toString(),
      before: { status: oldStatus },
      after: { status: user.accountStatus },
      status: "success",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      timestamp: new Date(),
    });

    res.json({
      message: `User ${status} successfully`,
      data: {
        userId: user._id,
        oldStatus,
        newStatus: user.accountStatus,
      },
    });
  } catch (error) {
    console.error("Ban user error:", error);
    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Failed to update user status",
    });
  }
}
