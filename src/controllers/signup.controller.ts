import type { Request, Response, RequestHandler } from "express";
import bcrypt from "bcrypt";
import fs from "fs";
import User from '../models/user.models.js';
import uploadFile from '../cloudinary/cloudConfig.js';
import { validationResult } from "express-validator";
import { fileURLToPath } from "url";
import path from "path";
import safeUnlink from '../utils/safeUnlink.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const signupController: RequestHandler = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: "VALIDATION-ERROR" , message: errors.array() });
    }

    const { userName, email, password } = req.body;

    // Check for existing user
    const userExists = await User.exists({
      $or: [{ email }, { userName }]
    });

    if (userExists) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(409).json({ error: "USER-ALREADY-EXISTS", message: "user already exists with this username or email" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Upload profile image if present
    let profileImgUrl
    const defaultImgPath = path.resolve(__dirname, "../assets/default-profile.jpg");

    const profileImgPath = req.file
      ? req.file.path
      : path.join("src", "assets", "default-profile.jpg");

    try {
      const result = await uploadFile(profileImgPath, {
        resource_type: "image",
        folder: "profileImages",
      });
      profileImgUrl = result.secure_url;
      if(req.file){
        safeUnlink(req.file.path)
        // fs.unlinkSync(req.file.path);
      }
    } catch (uploadError) {
      console.error("Cloudinary upload error:", uploadError);
      if(req.file){
        safeUnlink(req.file.path)
        // fs.unlinkSync(req.file.path);
      }
      return res.status(500).json({ error: "SERVER-ERROR" ,message: "Error uploading profile image." });
    }

    // Create user
    const newUser = new User({
      userName,
      email,
      password: hashedPassword,
      profileImg: profileImgUrl,
    });
    await newUser.save();

    res.status(201).json({ message: "User created successfully! Please log in." });
  } catch (error) {
    console.error("Signup server error:", error);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: "SERVER-ERROR" ,message: "internal server error" });
  }
};

export default signupController;
