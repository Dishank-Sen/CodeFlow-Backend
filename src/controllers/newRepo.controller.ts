import type { Request, Response, RequestHandler } from "express";
import mongoose from "mongoose";
import { validationResult } from "express-validator";
import Repo from '../models/repo.models.js';
import User from '../models/user.models.js';

const newRepoController: RequestHandler = async (req: Request, res: Response) => {
  // assume auth middleware attaches user with userId and userName
  try {
    const user = (req as any).user;
    if (!user?.userId) {
      return res
        .status(401)
        .json({ error: "NO-USER-INFO", message: "No user info found" });
    }

    // validationResult from express-validator (validator middleware must run before)
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: "VALIDATION-ERROR", details: errors.array() });
    }

    // input
    let { repoName, description = "", visibility = "public" } = req.body as {
      repoName: string;
      description?: string;
      visibility?: "public" | "private";
    };

    // normalize repoName for uniqueness (lowercase trim)
    const repoNameNormalized = repoName.trim().toLowerCase();
    const userNameNormalized = user.userName.trim().toLowerCase();

    // find user (ensure exists and get username)
    const existingUser = await User.findById(user.userId).select("userName").lean();
    if (!existingUser) {
      return res
        .status(401)
        .json({ error: "NO-USER-INFO", message: "No user info found" });
    }

    // Build remoteUrl using host if available; fallback to backend base URL env var
    const host = req.get("host") ?? process.env.FRONTEND_HOST ?? "localhost:3000";
    const protocol = req.get("x-forwarded-proto") ?? req.protocol ?? "http";
    const remoteUrl = `${protocol}://${host}/${existingUser.userName}/${repoName}`;

    // Start a session / transaction
    const session = await mongoose.startSession();
    let createdRepo: any = null;

    try {
      await session.withTransaction(async () => {
        // Defensive uniqueness check (optional): quick exists check
        // NOTE: race still possible -> unique index will ultimately enforce
        const conflict = await Repo.findOne({
          ownerId: new mongoose.Types.ObjectId(user.userId),
          repoName_normalized: repoNameNormalized
        })
          .session(session)
          .lean();

        if (conflict) {
          // abort transaction by throwing
          throw Object.assign(new Error("Repository name already taken for this user"), {
            status: 409,
            code: "REPO-NAME-ALREADY-TAKEN"
          });
        }

        // Create repo document
        const repoDoc = {
          ownerId: new mongoose.Types.ObjectId(user.userId),
          repoName,
          userName: userNameNormalized,
          repoName_normalized: repoNameNormalized,
          description,
          remoteUrl,
          visibility,
          pinned: false,
          stars: 0,
          forks: 0
        };

        const repo = await Repo.create([repoDoc], { session });
        createdRepo = repo[0];

        // Push repo _id into user's repository array and increment repoCount (optional)
        await User.updateOne(
          { _id: user.userId },
          {
            $push: { repository: createdRepo._id },
            $inc: { repoCount: 1 } // if you maintain repoCount
          },
          { session }
        );
      }); // end withTransaction
    } catch (txErr) {
      // transaction-level errors handled here
      if ((txErr as any)?.status === 409 || (txErr as any)?.code === "REPO-NAME-ALREADY-TAKEN") {
        return res
          .status(409)
          .json({ error: "REPO-NAME-ALREADY-TAKEN", message: "repository name already taken" });
      }

      // if duplicate key error occurred (concurrent race), handle below
      throw txErr;
    } finally {
      session.endSession();
    }

    // success: return created repo summary
    return res.status(201).json({
      message: "repository created",
      data: {
        id: createdRepo._id,
        repoName: createdRepo.repoName,
        userName: user.userName,
        description: createdRepo.description,
        visibility: createdRepo.visibility,
        remoteUrl: createdRepo.remoteUrl,
        pinned: createdRepo.pinned,
        stars: createdRepo.stars,
        forks: createdRepo.forks,
        createdAt: createdRepo.createdAt
      }
    });
  } catch (error: any) {
    // Duplicate key error (E11000) - occurs if unique index prevented race insertion
    if (error?.code === 11000) {
      return res
        .status(409)
        .json({ error: "REPO-NAME-ALREADY-TAKEN", message: "repository name already taken" });
    }

    console.error("error occurred in new repo:", error);
    return res.status(500).json({ error: "SERVER-ERROR", message: "internal server error" });
  }
};

export default newRepoController;
