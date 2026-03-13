import type { Request, Response } from "express";
import crypto from "crypto"
import User from "../models/user.models.ts"

const challengeController = async (req: Request, res: Response) => {
    try {
        const { userName } = req.body
        if (!userName){
            return res.status(401).json({ error: "UNAUTHORIZED", message: "No username provided" })
        }

        const username = userName.trim();

        if (username === "") {
            return res.status(400).json({
                error: "INVALID_USERNAME",
                message: "username cannot be empty",
            });
        }

        const challenge = crypto.randomBytes(32).toString("hex")
        console.log("challenge text: ", challenge)
        const updatedUser = await User.findOneAndUpdate(
            {userName: username},
            { $set: { challenge: challenge } },
            { new: true }
        );
    
        if (!updatedUser) {
            return res.status(404).json({
            message: "User not found"
            });
        }
    
        return res.status(200).json({
            message: "send back the encrypted challenge",
            challenge: challenge
        });
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

export default challengeController