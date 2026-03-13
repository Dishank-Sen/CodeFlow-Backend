import type { Request, Response, RequestHandler } from "express";
import User from '../models/user.models.js';
import { ApiError } from '../utils/apiError.js';
import { errorResponse, successResponse } from '../utils/errorResponse.js';

interface UpdateSettingsBody {
  bio?: string;
  profileVisibility?: "public" | "private";
  showBio?: boolean;
  showActivity?: boolean;
}

const updateSettingsController: RequestHandler = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.userId) {
      throw new ApiError(401, "No user info found", "NO-USER-INFO");
    }

    const { bio, profileVisibility, showBio, showActivity } = req.body as UpdateSettingsBody;

    // Validate input - at least one field required
    if (bio === undefined && profileVisibility === undefined && showBio === undefined && showActivity === undefined) {
      throw new ApiError(400, "At least one field to update is required", "NO-FIELDS");
    }

    // Validate bio length if provided
    if (bio !== undefined && typeof bio !== "string") {
      throw new ApiError(400, "Bio must be a string", "INVALID-BIO");
    }

    if (bio && bio.length > 500) {
      throw new ApiError(400, "Bio cannot exceed 500 characters", "BIO-TOO-LONG");
    }

    // Validate visibility
    if (profileVisibility !== undefined && !["public", "private"].includes(profileVisibility)) {
      throw new ApiError(400, "Profile visibility must be 'public' or 'private'", "INVALID-VISIBILITY");
    }

    // Build update object
    const updateData: any = {};

    if (bio !== undefined) {
      updateData.bio = bio;
    }

    if (profileVisibility !== undefined) {
      updateData.profileVisibility = profileVisibility;
    }

    if (showBio !== undefined) {
      updateData.showBio = showBio;
    }

    if (showActivity !== undefined) {
      updateData.showActivity = showActivity;
    }

    // Update user settings
    const updatedUser = await User.findByIdAndUpdate(user.userId, updateData, { new: true }).select(
      "userName email bio profileVisibility showBio showActivity"
    );

    if (!updatedUser) {
      throw new ApiError(404, "User not found", "USER-NOT-FOUND");
    }

    return successResponse(res, 200, "Settings updated successfully", {
      userName: updatedUser.userName,
      email: updatedUser.email,
      bio: updatedUser.bio,
      profileVisibility: (updatedUser as any).profileVisibility || "public",
      showBio: (updatedUser as any).showBio !== false,
      showActivity: (updatedUser as any).showActivity !== false,
    });
  } catch (error: any) {
    if (error instanceof ApiError) {
      return errorResponse(res, error.statusCode, error.message, error.errorCode);
    }

    console.error("Error updating settings:", error);
    return errorResponse(res, 500, "Internal server error", "SERVER_ERROR");
  }
};

export default updateSettingsController;
