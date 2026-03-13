import type { Request, Response, RequestHandler } from "express";
import User from '../models/user.models.js';
import { ApiError } from '../utils/apiError.js';
import { errorResponse, successResponse } from '../utils/errorResponse.js';

const getSettingsController: RequestHandler = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.userId) {
      throw new ApiError(401, "No user info found", "NO-USER-INFO");
    }

    const userData = await User.findById(user.userId).select(
      "userName email bio profileVisibility showBio showActivity"
    );

    if (!userData) {
      throw new ApiError(404, "User not found", "USER-NOT-FOUND");
    }

    return successResponse(res, 200, "Settings retrieved successfully", {
      userName: userData.userName,
      email: userData.email,
      bio: userData.bio || "",
      profileVisibility: (userData as any).profileVisibility || "public",
      showBio: (userData as any).showBio !== false,
      showActivity: (userData as any).showActivity !== false,
    });
  } catch (error: any) {
    if (error instanceof ApiError) {
      return errorResponse(res, error.statusCode, error.message, error.errorCode);
    }

    console.error("Error fetching settings:", error);
    return errorResponse(res, 500, "Internal server error", "SERVER_ERROR");
  }
};

export default getSettingsController;
