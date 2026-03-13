import express, { Router } from "express";
import {
  adminLoginController,
  adminSetupMFAController,
  adminVerifyMFAController,
  adminLogoutController,
  adminGetUsersController,
  adminUpdateUserRoleController,
  adminBanUserController,
  adminGetAuditLogsController,
  adminExportAuditLogsController,
} from '../controllers/admin/index.js';
import {
  adminAuthMiddleware,
  requirePermission,
  auditLog,
  adminLoginLimiter,
  adminSensitiveOpLimiter,
} from '../middleware/admin/index.js';

const router: Router = express.Router();

// Public endpoints (no auth required)
router.post("/auth/login", adminLoginLimiter, adminLoginController);
router.post("/auth/setup-mfa", adminSetupMFAController);
router.post("/auth/verify-mfa", adminVerifyMFAController);

// Protected endpoints (require auth + permission)
router.use(adminAuthMiddleware);

router.post("/auth/logout", adminLogoutController);

router.get(
  "/users",
  requirePermission("user.read"),
  adminGetUsersController
);

router.patch(
  "/users/:id/role",
  adminSensitiveOpLimiter,
  requirePermission("role.grant"),
  auditLog({ action: "ROLE_ASSIGNMENT", resourceType: "User" }),
  adminUpdateUserRoleController
);

router.patch(
  "/users/:id/status",
  requirePermission("user.write"),
  auditLog({ action: "USER_STATUS_CHANGE", resourceType: "User" }),
  adminBanUserController
);

router.get(
  "/audit-logs",
  requirePermission("audit.read"),
  adminGetAuditLogsController
);

router.post(
  "/audit-logs/export",
  adminSensitiveOpLimiter,
  requirePermission("export.create"),
  auditLog({ action: "AUDIT_LOG_EXPORT" }),
  adminExportAuditLogsController
);

export default router;
