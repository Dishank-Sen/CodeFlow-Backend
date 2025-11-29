import type { Request, Response } from "express";
import mongoose from "mongoose";
import Repo from "../models/repo.models.ts";

type ReqBody = {
  userName?: string;
  limit?: number;
  cursor?: string;     // ISO date string for updatedAt cursor
  sortBy?: "updated" | "stars" | "name";
};

const allRepoController = async (req: Request, res: Response) => {
  try {
    const body: ReqBody = req.body ?? {};
    const userNameRaw = body.userName;
    if (!userNameRaw || typeof userNameRaw !== "string") {
      return res.status(400).json({ error: "BAD_REQUEST", message: "userName is required" });
    }
    const userName = userNameRaw.trim().toLowerCase();
    if (!userName) {
      return res.status(400).json({ error: "BAD_REQUEST", message: "userName cannot be empty" });
    }
    if (userName.length > 100) {
      return res.status(400).json({ error: "BAD_REQUEST", message: "userName too long" });
    }

    // pagination & sort params
    const limit = Math.min(Math.max(1, Number(body.limit) || 20), 100); // 1..100 default 20
    const cursor = body.cursor ? new Date(body.cursor) : null;
    const sortBy = body.sortBy ?? "updated";

    // determine if requester is the owner
    const requester = req.user;
    const isOwner = requester && typeof requester.userName === "string" && requester.userName === userName;

    // build query
    const base: any = { userName };
    if (!isOwner) {
      base.visibility = "public";
    }

    // cursor-based pagination using updatedAt
    // If cursor provided, fetch docs with updatedAt < cursor (newest-first)
    if (cursor && sortBy === "updated") {
      base.updatedAt = { $lt: cursor };
    }

    // projection: include only necessary fields
    const projection = {
      userName: 1,
      repoName: 1,
      description: 1,
      remoteUrl: 1,
      visibility: 1,
      stars: 1,
      forks: 1,
      updatedAt: 1,
      createdAt: 1
    };

    // compute sort object
    let sortObj: any = { updatedAt: -1 };
    if (sortBy === "stars") sortObj = { stars: -1, updatedAt: -1 };
    if (sortBy === "name") sortObj = { repoName: 1 };

    const repos = await Repo.find(base)
      .select(projection)
      .sort(sortObj)
      .limit(limit)
      .lean()
      .exec();

    // return results and next cursor (if any)
    const nextCursor = repos.length > 0 ? repos[repos.length - 1].updatedAt : null;

    return res.status(200).json({
      message: "repos fetched successfully",
      data: repos,
      meta: { count: repos.length, nextCursor: nextCursor ? nextCursor.toISOString() : null },
    });
  } catch (err) {
    console.error("error while fetching all user repo:", err);
    return res.status(500).json({ error: "SERVER-ERROR", message: "internal server error" });
  }
};

export default allRepoController;
