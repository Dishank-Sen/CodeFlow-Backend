import { Response } from "express";
import { AuditLog } from '../../models/admin/index.js';
import { AdminRequest } from '../../middleware/admin/adminAuthMiddleware.js';

export async function adminGetAuditLogsController(
  req: AdminRequest,
  res: Response
) {
  try {
    const page = parseInt((req.query.page as string) || "1");
    const limit = parseInt((req.query.limit as string) || "50");
    const action = (req.query.action as string) || "";
    const adminId = (req.query.adminId as string) || "";
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (action) {
      filter.action = action;
    }
    if (adminId) {
      filter.adminId = adminId;
    }

    const logs = await AuditLog.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ timestamp: -1 });

    const total = await AuditLog.countDocuments(filter);

    res.json({
      message: "Audit logs retrieved successfully",
      data: logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get audit logs error:", error);
    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Failed to fetch audit logs",
    });
  }
}
