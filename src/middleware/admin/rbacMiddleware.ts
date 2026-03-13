import { Response, NextFunction } from "express";
import { PermissionChecker } from "@codeflow/auth-utils";
import { AdminPermission } from "@codeflow/types";
import { AdminRequest } from './adminAuthMiddleware.js';

/**
 * RBAC Middleware: Checks if admin has required permission
 */
export function requirePermission(...permissions: AdminPermission[]) {
  return (req: AdminRequest, res: Response, next: NextFunction) => {
    if (!req.admin) {
      return res.status(401).json({
        error: "UNAUTHORIZED",
        message: "Admin authentication required",
      });
    }

    const adminRole = req.admin.role as any;
    const hasPermission = permissions.some((perm) =>
      PermissionChecker.hasPermission(adminRole, perm)
    );

    if (!hasPermission) {
      return res.status(403).json({
        error: "FORBIDDEN",
        message: "Insufficient permissions",
        required: permissions,
        granted: PermissionChecker.getPermissions(adminRole),
      });
    }

    next();
  };
}

/**
 * RBAC Middleware: Requires ALL permissions
 */
export function requireAllPermissions(...permissions: AdminPermission[]) {
  return (req: AdminRequest, res: Response, next: NextFunction) => {
    if (!req.admin) {
      return res.status(401).json({
        error: "UNAUTHORIZED",
        message: "Admin authentication required",
      });
    }

    const adminRole = req.admin.role as any;
    const hasAllPermissions = PermissionChecker.hasAllPermissions(
      adminRole,
      permissions
    );

    if (!hasAllPermissions) {
      return res.status(403).json({
        error: "FORBIDDEN",
        message: "Insufficient permissions",
        required: permissions,
        granted: PermissionChecker.getPermissions(adminRole),
      });
    }

    next();
  };
}

/**
 * Privilege escalation prevention: Can't assign higher role
 */
export function requireRoleGrant(req: AdminRequest, res: Response, next: NextFunction) {
  if (!req.admin) {
    return res.status(401).json({
      error: "UNAUTHORIZED",
      message: "Admin authentication required",
    });
  }

  // Only SUPER_ADMIN can grant roles
  if (req.admin.role !== "SUPER_ADMIN") {
    return res.status(403).json({
      error: "FORBIDDEN",
      message: "Only SUPER_ADMIN can grant roles",
    });
  }

  next();
}
