// controllers/profileCardController.ts
import type { Request, Response } from "express";
import mongoose from "mongoose";
import User from '../models/user.models.js';

type UserAggResult = {
  bio: string;
  followerCount: number;
  followingCount: number;
  userName: string;
  profileImg?: string;
  email?: string | null;
};

const profileCardController = async (req: Request, res: Response) => {
  try {
    // prefer explicit query param `?userName=...` (viewing requested user)
    const requestedUserNameRaw = typeof req.query.userName === "string" ? req.query.userName.trim() : "";

    const authUser = (req as any).user as { userId?: string; userName?: string } | undefined;

    // If no requested username is provided, we must have an authenticated user to return owner data.
    const wantOwner = !requestedUserNameRaw;

    if (wantOwner && (!authUser || !authUser.userId)) {
      return res.status(401).json({ error: "NO-USER-INFO", message: "No user info found" });
    }

    // Build aggregation match:
    // - If requestedUserNameRaw exists: match by userName (public profile)
    // - Else match by _id (authenticated owner)
    const matchStage = requestedUserNameRaw
      ? { userName: requestedUserNameRaw }
      : { _id: new mongoose.Types.ObjectId(authUser!.userId) };

    // Project counts and public fields
    const pipeline = [
      { $match: matchStage },
      {
        $project: {
          _id: 0,
          userName: 1,
          email: 1,
          profileImg: 1,
          bio: 1,
          // compute counts even if arrays absent
          followerCount: { $cond: [{ $isArray: "$followers" }, { $size: "$followers" }, 0] },
          followingCount: { $cond: [{ $isArray: "$following" }, { $size: "$following" }, 0] },
        },
      },
      // limit 1 for safety
      { $limit: 1 },
    ];

    const [aggResult] = await User.aggregate<UserAggResult>(pipeline).exec();

    if (!aggResult) {
      return res.status(404).json({ error: "USER-NOT-FOUND", message: "User not found" });
    }

    // If requester is not the owner and you want to hide certain fields for public viewers,
    // remove them here. Currently we expose bio and follower/following counts — adjust as needed.
    const isOwner = authUser && authUser.userId && authUser.userName === aggResult.userName;

    // Build response data
    const responseData: Record<string, any> = {
      userName: aggResult.userName,
      email: aggResult.email,
      profileImg: aggResult.profileImg ?? "",
      bio: aggResult.bio ?? "",
      followerCount: typeof aggResult.followerCount === "number" ? aggResult.followerCount : 0,
      followingCount: typeof aggResult.followingCount === "number" ? aggResult.followingCount : 0,
    };

    // If owner requested their own card, include email and userId info from authUser (trusted).
    if (isOwner && authUser && authUser.userId) {
      responseData.userId = authUser.userId;
      // Note: don't trust email from auth payload unless your token contains it. If needed, fetch it separately.
      responseData.email = (req as any).user?.email ?? null;
    }

    return res.status(200).json({ message: "User data fetched", data: responseData });
  } catch (error) {
    console.error("profileCardController error:", error);
    return res.status(500).json({ error: "SERVER-ERROR", message: "Server error" });
  }
};

export default profileCardController;
