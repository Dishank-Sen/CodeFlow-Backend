import { Response, NextFunction } from "express";
import { AuditLog } from '../../models/admin/index.js';
import { AdminRequest } from './adminAuthMiddleware.js';

export interface AuditOptions {
  action: string;
  resourceType?: string;
  resourceId?: string;
  includeBody?: boolean;
  includeResponse?: boolean;
}

/**
 * Capture request/response for audit logging
 */
export function captureAuditData(
  req: AdminRequest,
  _res: Response,
  next: NextFunction
) {
  // Store original body
  let bodyData = null;

  if (req.method !== "GET" && req.method !== "HEAD") {
    bodyData = {
      ...req.body,
    };
    // Don't log sensitive fields
    delete bodyData.password;
    delete bodyData.passwordHash;
    delete bodyData.mfaSecret;
  }

  req.auditData = {
    method: req.method,
    path: req.path,
    body: bodyData,
    ip: req.ip || req.socket.remoteAddress || "unknown",
    userAgent: req.get("user-agent") || "unknown",
    timestamp: new Date(),
  };

  next();
}

/**
 * Log admin action to audit trail
 */
export async function logAuditAction(
  action: string,
  req: AdminRequest,
  resourceType?: string,
  resourceId?: string,
  before?: any,
  after?: any,
  status: "success" | "failure" = "success",
  errorMessage?: string
) {
  if (!req.admin) {
    return;
  }

  try {
    await AuditLog.create({
      adminId: req.admin.id,
      adminUsername: req.admin.username,
      action,
      resourceType,
      resourceId,
      before,
      after,
      status,
      errorMessage,
      ipAddress: req.auditData?.ip,
      userAgent: req.auditData?.userAgent,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Failed to log audit action:", error);
    // Don't fail the request if audit logging fails
  }
}

/**
 * Middleware factory to create audit logging for specific endpoints
 */
export function auditLog(options: AuditOptions) {
  return async (
    req: AdminRequest,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.admin) {
      return next();
    }

    // Store audit options in request for use after response
    req.auditOptions = options;

    // Intercept response to capture status
    const originalJson = res.json;
    const originalSend = res.send;

    res.json = function (data) {
      if (res.statusCode >= 400) {
        // Log failure
        logAuditAction(
          options.action,
          req,
          options.resourceType,
          options.resourceId,
          undefined,
          undefined,
          "failure",
          data?.message || "Unknown error"
        ).catch((err) => console.error("Audit log error:", err));
      } else {
        // Log success
        logAuditAction(
          options.action,
          req,
          options.resourceType,
          options.resourceId,
          undefined,
          options.includeResponse ? data : undefined,
          "success"
        ).catch((err) => console.error("Audit log error:", err));
      }

      return originalJson.call(this, data);
    };

    res.send = function (data) {
      return originalSend.call(this, data);
    };

    next();
  };
}

declare global {
  namespace Express {
    interface Request {
      auditData?: {
        method: string;
        path: string;
        body: any;
        ip: string;
        userAgent: string;
        timestamp: Date;
      };
      auditOptions?: AuditOptions;
    }
  }
}
