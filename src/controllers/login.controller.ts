import type { Request, Response, RequestHandler } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from '../models/user.models.js';
import { validationResult } from "express-validator";

const loginController: RequestHandler = async (req: Request, res: Response) => {
  try {
    
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: "VALIDATION-ERROR" , message: errors.array() });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user){
      return res.status(401).json({ error: "INVALID-CREDENTIALS" ,message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch){
      return res.status(401).json({ error: "INVALID-CREDENTIALS" ,message: "Invalid email or password." });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT_SECRET not set");
      return res.status(500).json({ error: "SERVER_ERROR", message: "Config error" });
    }

    // Generate JWT
    const token = jwt.sign({ userId: user._id, userName: user.userName, email: user.email, profileImg: user.profileImg }, secret, {
      expiresIn: "30d",
    });
    
    // Set JWT in HTTP-only cookie
    res.cookie("jwt", token, {
      httpOnly: true,                     // Not accessible from JS
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,  // 30 days
    });

    // Send user info to frontend; it can be stored in localStorage there
    res.status(200).json({
      message: "Login successful",
      data: {
        userId: user._id,
        userName: user.userName,
        email: user.email,
        profileImg: user.profileImg,
      },
    });
  } catch (error) {
    console.error("Login server error:", error);
    res.status(500).json({ error: "SERVER-ERROR" ,message: "Server error during login." });
  }
};

export default loginController;
