import type { Request, Response } from "express";
import nacl from "tweetnacl";
import User from "../models/user.models.ts";

const verifyChallengeController = async (req: Request, res: Response) => {
  try {
    const { userName, cypher } = req.body;

    if (!userName || !cypher) {
      return res.status(400).json({
        error: "INVALID_REQUEST",
        message: "username and cypher are required",
      });
    }

    const username = userName.trim();

    const user = await User.findOne(
      { userName: new RegExp(`^${username}$`, "i") },
      { challenge: 1, publicKey: 1 }
    );

    if (!user || !user.challenge || !user.publicKey) {
      return res.status(404).json({
        message: "User or authentication data not found",
      });
    }

    // publicKey = "ssh-ed25519 AAAA..."
    const keyParts = user.publicKey.split(" ");
    const publicKeyBase64 = keyParts[1];

    const publicKey = Buffer.from(publicKeyBase64, "base64").slice(-32);

    const signature = Buffer.from(cypher, "base64");

    const message = Buffer.from(user.challenge);

    const isValid = nacl.sign.detached.verify(
      message,
      signature,
      publicKey
    );

    if (!isValid) {
      return res.status(401).json({
        message: "Signature verification failed",
      });
    }

    return res.status(200).json({
      message: "User verified successfully",
    });

  } catch (err) {
    console.error("verifyChallengeController error:", err);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export default verifyChallengeController;