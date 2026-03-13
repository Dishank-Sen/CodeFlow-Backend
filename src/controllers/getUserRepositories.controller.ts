import type { Request, Response, RequestHandler } from "express";
import Repo from '../models/repo.models.js';
import { ApiError } from '../utils/apiError.js';
import { errorResponse, successResponse } from '../utils/errorResponse.js';

const getUserRepositoriesController: RequestHandler = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.userId) {
      throw new ApiError(401, "No user info found", "NO-USER-INFO");
    }

    // Get all repositories for the user
    const repositories = await Repo.find({ ownerId: user.userId })
      .select("_id repoName description visibility pinned updatedAt")
      .sort({ pinned: -1, updatedAt: -1 });

    return successResponse(res, 200, "Repositories retrieved successfully", {
      repositories: repositories || [],
      count: repositories?.length || 0,
    });
  } catch (error: any) {
    if (error instanceof ApiError) {
      return errorResponse(res, error.statusCode, error.message, error.errorCode);
    }

    console.error("Error fetching repositories:", error);
    return errorResponse(res, 500, "Internal server error", "SERVER_ERROR");
  }
};

export default getUserRepositoriesController;
