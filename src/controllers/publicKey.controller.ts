import { Request, Response } from "express";
import User from "../models/user.models.ts";

const savePublicKey = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user?.userId) {
      return res.status(401).json({
        error: "NO-USER-INFO",
        message: "No authenticated user found"
      });
    }

    const { publicKey: devicePublicKey } = req.body;

    if (!devicePublicKey || typeof devicePublicKey !== "string") {
      return res.status(400).json({
        message: "Valid publicKey is required"
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      user.userId,
      { $set: { publicKey: devicePublicKey } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    return res.status(200).json({
      message: "Public key saved successfully"
    });

  } catch (error) {
    console.error("publicKey save error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

export default savePublicKey