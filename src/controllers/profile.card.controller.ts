import type { Request ,Response } from "express";
import mongoose from "mongoose";
import User from "../models/user.models.ts";

type UserAggResult = {
  bio: string;
  followerCount: number;
  followingCount: number;
};

const profileCardController = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user || !user.userId) {
      return res
        .status(401)
        .json({ error: "NO-USER-INFO", message: "No user info found" });
    }

    const userId = new mongoose.Types.ObjectId(user.userId);

    const [aggResult] = await User.aggregate<UserAggResult>([
      { $match: { _id: userId } },
      {
        $project: {
          _id: 0,
          bio: 1,
          followerCount: { $size: "$followers" },
          followingCount: { $size: "$following" }
        }
      }
    ]);

    const userData: UserAggResult = aggResult ?? {
      bio: "",
      followerCount: 0,
      followingCount: 0
    };

    const data = {
      userId: user.userId,
      userName: user.userName,
      email: user.email,
      profileImg: user.profileImg,
      bio: userData.bio,
      followerCount: userData.followerCount,
      followingCount: userData.followingCount
    };

    return res.status(200).json({ message: "User data fetched", data });
  } catch (error) {
    console.error("User Detail server error:", error);
    return res
      .status(500)
      .json({ error: "SERVER-ERROR", message: "Server error" });
  }
};

export default profileCardController;