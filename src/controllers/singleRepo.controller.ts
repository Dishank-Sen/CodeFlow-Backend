import type { Request, Response, RequestHandler } from "express";
import Repo from '../models/repo.models.js'

const singleRepoController: RequestHandler = async (req: Request, res: Response) => {
    try {
        const userName = req.params.userName
        const repoName = req.params.repoName
        const userNameStr = typeof userName === 'string' ? userName : userName[0];
        const repoNameStr = typeof repoName === 'string' ? repoName : repoName[0];

        if (!userNameStr || !repoNameStr) {
            return res.status(400).json({ error: "USERNAME-OR-REPONAME-NOT-PROVIDED", message: "username or reponame is not provided!" });
        }

        const authUser = req.user;
        const query: any = { userName: userNameStr.toLowerCase(), repoName: repoNameStr.toLowerCase() };
        
        const repoData = await Repo.findOne(query);

        if (!repoData) {
            return res.status(404).json({ error: "DATA-NOT-FOUND", message: "repository data not found!" });
        }

        // Check visibility: allow access if owner or repo is public
        const isOwner = authUser && authUser.userId && repoData.ownerId.toString() === authUser.userId;
        const isPublic = repoData.visibility === "public";

        if (!isOwner && !isPublic) {
            return res.status(403).json({ error: "ACCESS-DENIED", message: "Cannot access private repository" });
        }

        return res.status(200).json({ message: "DATA-FETCHED-SUCCESSFULLY", data: repoData });
    } catch (error) {
        console.log("error in singleRepo.controller: ", error);
        return res.status(500).json({ error: "SERVER-ERROR", message: "internal server error!" });
    }
}

export default singleRepoController