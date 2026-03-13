import type { Request, Response, RequestHandler } from "express";
import { validationResult } from "express-validator";
import Repo from '../models/repo.models.js';
import { ApiError } from '../utils/apiError.js';
import { errorResponse, successResponse } from '../utils/errorResponse.js';

const updateRepoController: RequestHandler = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.userId) {
      throw new ApiError(401, "No user info found", "NO-USER-INFO");
    }

    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, "Validation error", "VALIDATION_ERROR", errors.array());
    }

    const { userName, repoName } = req.params;
    const userNameStr = typeof userName === 'string' ? userName : userName[0];
    const repoNameStr = typeof repoName === 'string' ? repoName : repoName[0];

    if (!userNameStr || !repoNameStr) {
      throw new ApiError(400, "userName and repoName are required", "MISSING_PARAMS");
    }

    // Find repo and verify ownership
    const repo = await Repo.findOne({
      userName: userNameStr.toLowerCase(),
      repoName_normalized: repoNameStr.toLowerCase(),
    });

    if (!repo) {
      throw new ApiError(404, "Repository not found", "REPO_NOT_FOUND");
    }

    // Verify ownership
    if (repo.ownerId.toString() !== user.userId) {
      throw new ApiError(403, "Unauthorized to update this repository", "UNAUTHORIZED");
    }

    // Extract updateable fields from request body
    const { description, visibility, pinned } = req.body;
    const updates: any = {};

    if (description !== undefined) {
      updates.description = description;
    }

    if (visibility !== undefined) {
      updates.visibility = visibility;
    }

    if (pinned !== undefined) {
      // Validate max 6 pinned repos if trying to pin
      if (pinned === true) {
        const pinnedCount = await Repo.countDocuments({
          ownerId: user.userId,
          pinned: true,
        });

        if (pinnedCount >= 6) {
          throw new ApiError(400, "Maximum 6 repositories can be pinned", "MAX_PINNED_REACHED");
        }
      }
      updates.pinned = pinned;
    }

    // Ensure at least one field is being updated
    if (Object.keys(updates).length === 0) {
      throw new ApiError(400, "No valid fields to update", "NO_UPDATES");
    }

    // Update repo
    const updatedRepo = await Repo.findByIdAndUpdate(repo._id, updates, {
      new: true,
      runValidators: true,
    });

    return successResponse(res, 200, "Repository updated successfully", {
      id: updatedRepo?._id,
      repoName: updatedRepo?.repoName,
      userName: updatedRepo?.userName,
      description: updatedRepo?.description,
      visibility: updatedRepo?.visibility,
      pinned: updatedRepo?.pinned,
      stars: updatedRepo?.stars,
      forks: updatedRepo?.forks,
      updatedAt: updatedRepo?.updatedAt,
    });
  } catch (error: any) {
    if (error instanceof ApiError) {
      return errorResponse(res, error.statusCode, error.message, error.errorCode);
    }

    console.error("Error updating repo:", error);
    return errorResponse(res, 500, "Internal server error", "SERVER_ERROR");
  }
};

export default updateRepoController;
