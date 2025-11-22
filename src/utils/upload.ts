import multer, { type FileFilterCallback } from "multer";
import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage.ts";

export const signupUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/jpg", "image/svg+xml"];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type") as any, false);
    }
  },
});

