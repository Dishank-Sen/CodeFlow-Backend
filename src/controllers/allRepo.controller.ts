import type { Request, Response } from "express"
import Repo from "../models/repo.models.ts"

const allRepoController = async (req: Request, res: Response) => {
    try {
        const {userName} = req.body
        const repos = await Repo.find({userName: userName, visibility: "public"})

        res.status(200).json({message: "repo fetched successfull", data: repos})
    } catch (error) {
        console.log("error while fetching all user repo:",error)
        res.send(500).json({ error: "SERVER-ERROR", message: "internal server error"})
    }
}

export default allRepoController