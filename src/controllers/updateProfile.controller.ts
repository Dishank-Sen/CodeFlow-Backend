import type { Request, Response, RequestHandler } from "express";
import User from '../models/user.models.js';
import { ApiError } from '../utils/apiError.js';
import { errorResponse, successResponse } from '../utils/errorResponse.js';
import uploadFile from '../cloudinary/cloudConfig.js';
import fs from "fs";

interface UpdateProfileBody {
  bio?: string;
}

const updateProfileController: RequestHandler = async (req: Request, res: Response) => {
  let uploadedFilePath: string | null = null;

  try {
    const user = (req as any).user;
    if (!user?.userId) {
      throw new ApiError(401, "No user info found", "NO-USER-INFO");
    }

    const { bio } = req.body as UpdateProfileBody;
    const profileImageFile = (req as any).file;

    // Validate input
    if (!bio && !profileImageFile) {
      throw new ApiError(400, "At least one field (bio or profile image) is required", "MISSING-FIELDS");
    }

    // Validate bio length if provided
    if (bio !== undefined && typeof bio !== "string") {
      throw new ApiError(400, "Bio must be a string", "INVALID-BIO");
    }

    if (bio && bio.length > 500) {
      throw new ApiError(400, "Bio cannot exceed 500 characters", "BIO-TOO-LONG");
    }

    // Build update object
    const updateData: any = {};
    
    if (bio !== undefined) {
      updateData.bio = bio;
    }

    // Handle image upload if file exists
    if (profileImageFile) {
      uploadedFilePath = profileImageFile.path;

      // Validate file type
      const allowedMimeTypes = ["image/jpeg", "image/png", "image/jpg", "image/svg+xml"];
      if (!allowedMimeTypes.includes(profileImageFile.mimetype)) {
        throw new ApiError(400, "Invalid file type. Only JPEG, PNG, and SVG are allowed", "INVALID-FILE-TYPE");
      }

      // Validate file size (10 MB max)
      if (profileImageFile.size > 10 * 1024 * 1024) {
        throw new ApiError(400, "File size exceeds 10 MB limit", "FILE-TOO-LARGE");
      }

      try {
        // Upload to Cloudinary
        if (!uploadedFilePath) {
          throw new Error("File path is missing");
        }

        const cloudinaryResult = await uploadFile(uploadedFilePath, {
          folder: "codeflow/profiles",
          resource_type: "auto",
        });

        if (!cloudinaryResult.secure_url) {
          throw new Error("Cloudinary upload failed - no URL returned");
        }

        updateData.profileImg = cloudinaryResult.secure_url;
      } catch (uploadError: any) {
        console.error("Cloudinary upload error:", uploadError);
        throw new ApiError(500, "Failed to upload image to cloud storage", "UPLOAD-FAILED");
      }
    }

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(user.userId, updateData, { new: true }).select(
      "userName email profileImg bio"
    );

    if (!updatedUser) {
      throw new ApiError(404, "User not found", "USER-NOT-FOUND");
    }

    return successResponse(res, 200, "Profile updated successfully", {
      userName: updatedUser.userName,
      email: updatedUser.email,
      profileImg: updatedUser.profileImg,
      bio: updatedUser.bio,
    });
  } catch (error: any) {
    if (error instanceof ApiError) {
      return errorResponse(res, error.statusCode, error.message, error.errorCode);
    }

    console.error("Error updating profile:", error);
    return errorResponse(res, 500, "Internal server error", "SERVER_ERROR");
  } finally {
    // Clean up uploaded file from disk
    if (uploadedFilePath) {
      try {
        fs.unlinkSync(uploadedFilePath);
      } catch (err) {
        console.warn("Failed to delete temporary file:", uploadedFilePath);
      }
    }
  }
};

export default updateProfileController;
