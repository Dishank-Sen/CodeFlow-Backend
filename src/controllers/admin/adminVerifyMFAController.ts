import type { Request, Response } from "express";
import { AdminSession, AdminAccount } from '../../models/admin/index.js';
import { TOTPService, EncryptionService } from "@codeflow/auth-utils";

const totpService = new TOTPService({
  issuer: "Codeflow",
  appName: "Codeflow Admin",
  window: 2,
});

const encryptor = new EncryptionService(
  process.env.ENCRYPTION_KEY || "default-key"
);

export async function adminVerifyMFAController(req: Request, res: Response) {
  try {
    const { code } = req.body;
    const sessionToken =
      req.cookies.admin_session_temp ||
      (req as any).adminSession?.sessionToken ||
      req.body.sessionToken;

    if (!code || !sessionToken) {
      return res.status(400).json({
        error: "MISSING_FIELDS",
        message: "Code and session token required",
      });
    }

    // Get session
    const session = await AdminSession.findOne({ sessionToken });
    if (!session) {
      return res.status(401).json({
        error: "SESSION_NOT_FOUND",
        message: "Session not found or expired",
      });
    }

    // Get admin
    const admin = await AdminAccount.findById(session.adminId);
    if (!admin) {
      return res.status(401).json({
        error: "ADMIN_NOT_FOUND",
        message: "Admin not found",
      });
    }

    // Verify TOTP code
    const tempSecret = session.mfaTempSecret;
    const mfaSecret = admin.mfaSecret
      ? encryptor.decrypt(admin.mfaSecret)
      : tempSecret;

    if (!mfaSecret) {
      return res.status(401).json({
        error: "MFA_NOT_CONFIGURED",
        message: "MFA not configured",
      });
    }

    if (!totpService.verify(code, mfaSecret)) {
      return res.status(401).json({
        error: "INVALID_CODE",
        message: "Invalid MFA code",
      });
    }

    // If first time setup, save MFA secret
    if (!admin.mfaSecret && tempSecret) {
      admin.mfaSecret = encryptor.encrypt(tempSecret);
      const backupCodes = session.mfaTempBackupCodes || [];
      (admin as any).mfaBackupCodes = backupCodes.map((code: string) =>
        encryptor.encrypt(code)
      );
      await admin.save();
    }

    // Update session as MFA verified using findByIdAndUpdate
    await AdminSession.findByIdAndUpdate(
      session._id,
      {
        mfaVerified: true,
        mfaVerifiedAt: new Date(),
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000), // Extend to 8 hours
      },
      { new: true }
    );

    // Set secure HTTP-only cookie for authenticated session
    res.cookie("codeflow_admin_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 8 * 60 * 60 * 1000,
    });

    // Clear temporary cookie
    res.clearCookie("admin_session_temp");

    res.json({
      message: "MFA verification successful",
      authenticated: true,
      sessionToken,
    });
  } catch (error) {
    console.error("MFA verify error:", error);
    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "MFA verification failed",
    });
  }
}
