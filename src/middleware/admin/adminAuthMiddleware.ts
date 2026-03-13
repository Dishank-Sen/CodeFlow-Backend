import type { Request, Response, NextFunction } from "express";
import { AdminSession, AdminAccount } from '../../models/admin/index.js';

export interface AdminRequest extends Request {
  admin?: {
    id: string;
    username: string;
    email: string;
    role: string;
    mfaVerified: boolean;
  };
  adminSession?: {
    id: string;
    token: string;
  };
}

export async function adminAuthMiddleware(
  req: AdminRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // Get session token from HTTP-only cookie or Authorization header
    const token =
      req.cookies.codeflow_admin_session ||
      req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        error: "UNAUTHORIZED",
        message: "Admin session required",
      });
    }

    // Find valid session
    const session = await AdminSession.findOne({
      sessionToken: token,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      return res.status(401).json({
        error: "INVALID_SESSION",
        message: "Session expired or invalid",
      });
    }

    // Check if MFA is verified
    if (!session.mfaVerified) {
      return res.status(403).json({
        error: "MFA_REQUIRED",
        message: "MFA verification required",
      });
    }

    // Get admin account
    const admin = await AdminAccount.findById(session.adminId);

    if (!admin || admin.status !== "active") {
      return res.status(403).json({
        error: "ADMIN_INACTIVE",
        message: "Admin account is not active",
      });
    }

    // Update last activity
    session.lastActivityAt = new Date();
    await session.save();

    // Attach to request
    req.admin = {
      id: admin._id!.toString(),
      username: admin.username,
      email: admin.email,
      role: admin.role,
      mfaVerified: session.mfaVerified,
    };

    req.adminSession = {
      id: session._id!.toString(),
      token,
    };

    next();
  } catch (error) {
    console.error("Admin auth middleware error:", error);
    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Failed to authenticate admin",
    });
  }
}

/**
 * Middleware to check if admin session exists (optional auth)
 */
export async function optionalAdminAuth(
  req: AdminRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const token =
      req.cookies.codeflow_admin_session ||
      req.headers.authorization?.replace("Bearer ", "");

    if (token) {
      const session = await AdminSession.findOne({
        sessionToken: token,
        expiresAt: { $gt: new Date() },
      });

      if (session) {
        const admin = await AdminAccount.findById(session.adminId);
        if (admin && admin.status === "active") {
          req.admin = {
            id: admin._id!.toString(),
            username: admin.username,
            email: admin.email,
            role: admin.role,
            mfaVerified: session.mfaVerified,
          };
          req.adminSession = {
            id: session._id!.toString(),
            token,
          };
        }
      }
    }

    next();
  } catch (error) {
    // Continue without auth
    next();
  }
}
