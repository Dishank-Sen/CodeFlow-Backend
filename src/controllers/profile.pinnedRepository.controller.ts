import type { Request, Response, RequestHandler } from "express"
import User from "../models/user.models.ts"
import Repo from "../models/repo.models.ts"
import mongoose from "mongoose";

const profilePinnedRepoController: RequestHandler = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        if (!user || !user.userId) {
            return res.status(401).json({ error: "NO-USER-INFO", message: "No user info found" });
        }

        const ownerId = new mongoose.Types.ObjectId(user.userId)
        const pinned = await Repo.find({ ownerId, pinned: true }, { repoName: 1, description: 1, stars: 1, forks: 1, _id: 0}).sort({ updatedAt: -1 }).limit(6)

        if(pinned.length === 0){
            console.log("no pinned repository")
            return res.status(404).json({ error: "NO-PINNED-REPO" ,message: "no pinned repository" })
        }

        res.status(200).json({message: "user detail retrieved successfully", data: pinned})
    } catch (error) {
        console.log("error in profile controller: ", error)
        res.status(500).json({ error: "SERVER-ERROR" ,message: "internal server error", data: null})
    }
}

export default profilePinnedRepoController