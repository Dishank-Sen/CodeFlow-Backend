import { Response } from "express";
import { AuditLog } from '../../models/admin/index.js';
import { AdminRequest } from '../../middleware/admin/adminAuthMiddleware.js';

export async function adminExportAuditLogsController(
  req: AdminRequest,
  res: Response
) {
  try {
    const { startDate, endDate, format } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: "MISSING_FIELDS",
        message: "startDate and endDate required",
      });
    }

    const logs = await AuditLog.find({
      timestamp: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    }).sort({ timestamp: -1 });

    if (format === "csv") {
      const csv = convertToCSV(logs);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=audit-logs.csv"
      );
      res.send(csv);
    } else {
      res.json({
        message: "Audit logs exported successfully",
        count: logs.length,
        data: logs,
      });
    }
  } catch (error) {
    console.error("Export audit logs error:", error);
    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Failed to export audit logs",
    });
  }
}

function convertToCSV(logs: any[]): string {
  const headers = [
    "Timestamp",
    "Admin",
    "Action",
    "Resource Type",
    "Resource ID",
    "Status",
    "IP Address",
  ];
  const rows = logs.map((log) => [
    new Date(log.timestamp).toISOString(),
    log.adminUsername,
    log.action,
    log.resourceType || "-",
    log.resourceId || "-",
    log.status,
    log.ipAddress,
  ]);

  return [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
}
