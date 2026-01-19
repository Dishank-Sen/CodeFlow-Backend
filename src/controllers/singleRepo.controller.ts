import type { Request, Response, RequestHandler } from "express";
import Repo from "../models/repo.models.ts"
import mongoose from "mongoose"

const singleRepoController: RequestHandler = async (req: Request, res: Response) => {
    try {
        const userName = req.params.userName
        const repoName = req.params.repoName

        if(!userName || !repoName){
            return res.status(400).json({ error: "USERNAME-OR-REPONAME-NOT-PROVIDED", message: "username or reponame is not provided!"})
        }

        const repoData = await Repo.findOne({ userName: userName, repoName: repoName})

        if(!repoData){
            return res.status(404).json({ error: "DATA-NOT-FOUND", message: "repository data not found!"})
        }

        return res.status(200).json({ message: "DATA-FETCHED-SUCCESSFULLY", data: repoData})
    } catch (error) {
        console.log("error in singleRepo.controller: ",error)
        return res.status(500).json({ error: "SERVER-ERROR", message: "internal server error!"})
    }
}

export default singleRepoController