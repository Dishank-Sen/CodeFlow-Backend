import { Response } from "express";
import User from '../../models/user.models.js';
import { AuditLog } from '../../models/admin/index.js';
import { AdminRequest } from '../../middleware/admin/adminAuthMiddleware.js';
import { PermissionChecker } from "@codeflow/auth-utils";

const permissionChecker = new PermissionChecker();

export async function adminUpdateUserRoleController(
  req: AdminRequest,
  res: Response
) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!id) {
      return res.status(400).json({
        error: "MISSING_FIELD",
        message: "User ID required",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        error: "NOT_FOUND",
        message: "User not found",
      });
    }

    const oldRole = user.adminRole;

    // Validate role if provided
    if (role && !["SUPER_ADMIN", "ADMIN", "SUPPORT", "AUDITOR"].includes(role)) {
      return res.status(400).json({
        error: "INVALID_ROLE",
        message: "Invalid role",
      });
    }

    user.adminRole = role || null;
    await user.save();

    // Log to audit trail
    await AuditLog.create({
      adminId: req.admin?.id,
      adminUsername: req.admin?.username,
      action: "ROLE_ASSIGNMENT",
      resourceType: "User",
      resourceId: user._id.toString(),
      before: { role: oldRole },
      after: { role: user.adminRole },
      status: "success",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      timestamp: new Date(),
    });

    res.json({
      message: "User role updated successfully",
      data: {
        userId: user._id,
        oldRole,
        newRole: user.adminRole,
      },
    });
  } catch (error) {
    console.error("Update role error:", error);
    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Failed to update user role",
    });
  }
}
