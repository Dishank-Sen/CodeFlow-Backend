import type { Request, Response, RequestHandler } from "express";
import mongoose from "mongoose";
import Repo from '../models/repo.models.js';
import User from '../models/user.models.js';
import { ApiError } from '../utils/apiError.js';
import { errorResponse, successResponse } from '../utils/errorResponse.js';

const deleteRepoController: RequestHandler = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.userId) {
      throw new ApiError(401, "No user info found", "NO-USER-INFO");
    }

    const { userName, repoName } = req.params;
    const userNameStr = typeof userName === 'string' ? userName : userName[0];
    const repoNameStr = typeof repoName === 'string' ? repoName : repoName[0];

    if (!userNameStr || !repoNameStr) {
      throw new ApiError(400, "userName and repoName are required", "MISSING-PARAMS");
    }

    // Find repo and verify ownership
    const repo = await Repo.findOne({
      userName: userNameStr.toLowerCase(),
      repoName_normalized: repoNameStr.toLowerCase(),
    });

    if (!repo) {
      throw new ApiError(404, "Repository not found", "REPO-NOT-FOUND");
    }

    // Verify ownership
    if (repo.ownerId.toString() !== user.userId) {
      throw new ApiError(403, "Unauthorized to delete this repository", "UNAUTHORIZED");
    }

    // Start transaction
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        // Delete repo
        await Repo.deleteOne({ _id: repo._id }).session(session);

        // Remove from user's repository array
        await User.updateOne(
          { _id: user.userId },
          {
            $pull: { repository: repo._id },
            $inc: { repoCount: -1 },
          },
          { session }
        );
      });
    } finally {
      session.endSession();
    }

    return successResponse(res, 200, "Repository deleted successfully");
  } catch (error: any) {
    if (error instanceof ApiError) {
      return errorResponse(res, error.statusCode, error.message, error.errorCode);
    }

    console.error("Error deleting repo:", error);
    return errorResponse(res, 500, "Internal server error", "SERVER_ERROR");
  }
};

export default deleteRepoController;
