import type { Request, Response, RequestHandler } from "express";
import mongoose from "mongoose";
import Repo from '../models/repo.models.js';
import { ApiError } from '../utils/apiError.js';
import { errorResponse, successResponse } from '../utils/errorResponse.js';

const starredReposController: RequestHandler = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.userId) {
      throw new ApiError(401, "No user info found", "NO-USER-INFO");
    }

    console.log("User ID:", user.userId);

    // Find all repositories where the current user has starred
    const repos = await Repo.find({
      starredBy: new mongoose.Types.ObjectId(user.userId),
    })
      .select("_id userName repoName description language stars visibility createdAt updatedAt")
      .sort({ updatedAt: -1 })
      .lean();

    console.log("Found repos:", repos?.length || 0);

    if (!repos || repos.length === 0) {
      return successResponse(res, 200, "No starred repositories found", []);
    }

    // Format response to match StarredRepo interface
    const formattedRepos = repos.map((repo: any) => ({
      userName: repo.userName,
      repoName: repo.repoName,
      description: repo.description || "",
      language: repo.language || "",
      stars: repo.stars || 0,
      visibility: repo.visibility || "public",
    }));

    return successResponse(res, 200, "Starred repositories fetched successfully", formattedRepos);
  } catch (error: any) {
    if (error instanceof ApiError) {
      return errorResponse(res, error.statusCode, error.message, error.errorCode);
    }

    console.error("Error fetching starred repos:", error);
    return errorResponse(res, 500, "Internal server error", "SERVER_ERROR");
  }
};

export default starredReposController;
