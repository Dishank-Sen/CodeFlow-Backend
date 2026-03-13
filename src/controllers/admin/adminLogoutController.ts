import { Response } from "express";
import { AdminSession } from '../../models/admin/index.js';
import { AdminRequest } from '../../middleware/admin/adminAuthMiddleware.js';

export async function adminLogoutController(
  req: AdminRequest,
  res: Response
) {
  try {
    if (req.adminSession?.token) {
      await AdminSession.deleteOne({ sessionToken: req.adminSession.token });
    }

    res.clearCookie("codeflow_admin_session");
    res.clearCookie("admin_session_temp");

    res.json({
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Logout failed",
    });
  }
}
