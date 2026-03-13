import type { Request, Response, RequestHandler } from "express";
import mongoose from "mongoose";
import Repo from '../models/repo.models.js';
import User from '../models/user.models.js';
import { ApiError } from '../utils/apiError.js';
import { errorResponse, successResponse } from '../utils/errorResponse.js';

interface CollaborationAction {
  action: "star" | "unstar" | "watch" | "unwatch" | "fork";
}

const collaborationController: RequestHandler = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.userId) {
      throw new ApiError(401, "No user info found", "NO-USER-INFO");
    }

    const { action } = req.body as CollaborationAction;
    const { userName, repoName } = req.params;
    const userNameStr = typeof userName === 'string' ? userName : userName[0];
    const repoNameStr = typeof repoName === 'string' ? repoName : repoName[0];

    if (!userNameStr || !repoNameStr) {
      throw new ApiError(400, "userName and repoName are required", "MISSING-PARAMS");
    }

    if (!action || !["star", "unstar", "watch", "unwatch", "fork"].includes(action)) {
      throw new ApiError(400, "Invalid action. Must be star, unstar, watch, unwatch, or fork", "INVALID-ACTION");
    }

    // Find repo
    const repo = await Repo.findOne({
      userName: userNameStr.toLowerCase(),
      repoName_normalized: repoNameStr.toLowerCase(),
    });

    if (!repo) {
      throw new ApiError(404, "Repository not found", "REPO-NOT-FOUND");
    }

    // Prevent user from starring/watching/forking their own repo
    if (repo.ownerId.toString() === user.userId) {
      throw new ApiError(400, "Cannot star or watch your own repository", "CANNOT-STAR-OWN-REPO");
    }

    // For star action, check if already starred
    if (action === "star") {
      const alreadyStarred = repo.starredBy?.some(
        (userId) => userId.toString() === user.userId
      );
      if (alreadyStarred) {
        throw new ApiError(400, "You have already starred this repository", "ALREADY-STARRED");
      }
    }

    // For unstar action, check if has starred
    if (action === "unstar") {
      const hasStarred = repo.starredBy?.some(
        (userId) => userId.toString() === user.userId
      );
      if (!hasStarred) {
        throw new ApiError(400, "You have not starred this repository", "NOT-STARRED");
      }
    }

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        if (action === "star") {
          // Add user to starredBy array (prevents duplicates) and increment star count
          await Repo.updateOne(
            { _id: repo._id },
            { 
              $addToSet: { starredBy: new mongoose.Types.ObjectId(user.userId) },
              $inc: { stars: 1 }
            },
            { session }
          );
        } else if (action === "unstar") {
          // Remove user from starredBy array and decrement star count
          await Repo.updateOne(
            { _id: repo._id },
            { 
              $pull: { starredBy: new mongoose.Types.ObjectId(user.userId) },
              $inc: { stars: -1 }
            },
            { session }
          );
        } else if (action === "watch") {
          // Add to user's watched repos
          await User.updateOne(
            { _id: new mongoose.Types.ObjectId(user.userId) },
            { $addToSet: { watchedRepos: repo._id } },
            { session }
          );
        } else if (action === "unwatch") {
          // Remove from user's watched repos
          await User.updateOne(
            { _id: new mongoose.Types.ObjectId(user.userId) },
            { $pull: { watchedRepos: repo._id } },
            { session }
          );
        } else if (action === "fork") {
          // Increment forks count
          await Repo.updateOne(
            { _id: repo._id },
            { $inc: { forks: 1 } },
            { session }
          );
        }
      });
    } finally {
      session.endSession();
    }

    // Get updated repo data
    const updatedRepo = await Repo.findById(repo._id);

    const responseMessage = {
      star: "Repository starred",
      unstar: "Repository unstarred",
      watch: "Repository watched",
      unwatch: "Repository unwatched",
      fork: "Repository forked",
    }[action];

    return successResponse(res, 200, responseMessage, {
      id: updatedRepo?._id,
      repoName: updatedRepo?.repoName,
      userName: updatedRepo?.userName,
      stars: updatedRepo?.stars,
      forks: updatedRepo?.forks,
    });
  } catch (error: any) {
    if (error instanceof ApiError) {
      return errorResponse(res, error.statusCode, error.message, error.errorCode);
    }

    console.error("Error in collaboration action:", error);
    return errorResponse(res, 500, "Internal server error", "SERVER_ERROR");
  }
};

export default collaborationController;
