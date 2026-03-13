import type { Request, Response } from "express";
import { TOTPService, EncryptionService } from "@codeflow/auth-utils";
import { AdminSession, AdminAccount } from '../../models/admin/index.js';

const totpService = new TOTPService({
  issuer: "Codeflow",
  appName: "Codeflow Admin",
  window: 2,
});

const encryptor = new EncryptionService(
  process.env.ENCRYPTION_KEY || "default-key"
);

export async function adminSetupMFAController(req: Request, res: Response) {
  try {
    const { username, sessionToken } = req.body;

    if (!sessionToken || !username) {
      return res.status(401).json({
        error: "NO_SESSION",
        message: "Valid session required",
      });
    }

    // Validate session
    const session = await AdminSession.findOne({ sessionToken });
    if (!session) {
      return res.status(401).json({
        error: "SESSION_NOT_FOUND",
        message: "Session not found or expired",
      });
    }

    // Get admin account
    const admin = await AdminAccount.findById(session.adminId);
    if (!admin) {
      return res.status(401).json({
        error: "ADMIN_NOT_FOUND",
        message: "Admin not found",
      });
    }

    // Check if MFA already enabled - return verify mode
    if (admin.mfaEnabled && admin.mfaSecret) {
      return res.json({
        message: "MFA already configured",
        isSetup: false,
        mfaRequired: true,
      });
    }

    // Generate secret for new MFA setup
    const secretData = totpService.generateSecret(username);
    const qrCode = await totpService.generateQRCode(secretData.otpauthUrl);
    const backupCodes = totpService.generateBackupCodes(10);

    // Store temporarily in session using findByIdAndUpdate
    const updatedSession = await AdminSession.findByIdAndUpdate(
      session._id,
      {
        mfaTempSecret: secretData.secret,
        mfaTempBackupCodes: backupCodes,
      },
      { new: true }
    );

    if (!updatedSession) {
      return res.status(500).json({
        error: "SESSION_UPDATE_FAILED",
        message: "Failed to update session",
      });
    }

    res.json({
      message: "MFA setup initiated",
      isSetup: true,
      qrCode,
      secret: secretData.secret,
      backupCodes,
      instructions:
        "Scan QR code with authenticator app or enter secret manually",
    });
  } catch (error) {
    console.error("MFA setup error:", error);
    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Failed to setup MFA",
    });
  }
}
