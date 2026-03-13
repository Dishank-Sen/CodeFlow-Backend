import type { Request, Response } from "express";
import { AdminAccount, AdminSession } from '../../models/admin/index.js';
import { EncryptionService } from '../../../../../packages/auth-utils/src/crypto.js';
import crypto from "crypto";

const encryptor = new EncryptionService(
  process.env.ENCRYPTION_KEY || "default-key"
);

export async function adminLoginController(req: Request, res: Response) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: "MISSING_FIELDS",
        message: "Username and password required",
      });
    }

    const admin = await AdminAccount.findOne({
      username: username.toLowerCase(),
    });

    if (!admin) {
      return res.status(401).json({
        error: "INVALID_CREDENTIALS",
        message: "Invalid username or password",
      });
    }

    // Check if account is locked
    if (admin.lockedUntil && admin.lockedUntil > new Date()) {
      const remainingTime = Math.ceil(
        (admin.lockedUntil.getTime() - Date.now()) / 60000
      );
      return res.status(403).json({
        error: "ACCOUNT_LOCKED",
        message: `Account is temporarily locked. Try again in ${remainingTime} minutes.`,
      });
    }

    // Verify password
    const isPasswordValid = encryptor.verifyPassword(
      password,
      admin.passwordHash
    );

    if (!isPasswordValid) {
      admin.loginAttempts = (admin.loginAttempts || 0) + 1;

      // Lock account after 5 failed attempts
      if (admin.loginAttempts >= 5) {
        admin.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minute lockout
      }

      await admin.save();

      return res.status(401).json({
        error: "INVALID_CREDENTIALS",
        message: "Invalid username or password",
      });
    }

    // Reset login attempts on successful login
    admin.loginAttempts = 0;
    admin.lockedUntil = undefined;
    admin.lastLogin = new Date();
    admin.lastLoginIp = req.ip || "unknown";
    await admin.save();

    // Create temporary session (MFA not yet verified)
    const sessionToken = crypto.randomBytes(32).toString("hex");
    await AdminSession.create({
      adminId: admin._id,
      sessionToken,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min for MFA
      mfaVerified: false,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    // Set temporary cookie
    res.cookie("admin_session_temp", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.json({
      message: "Login successful. MFA verification required.",
      sessionToken,
      mfaRequired: true,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Login failed",
    });
  }
}
