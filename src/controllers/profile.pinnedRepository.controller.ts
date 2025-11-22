import type { Request, Response, RequestHandler } from "express"
import User from "../models/user.models.ts"

const profilePinnedRepoController: RequestHandler = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        if (!user || !user.userId) {
            return res.status(401).json({ error: "NO-USER-INFO", message: "No user info found" });
        }

        const existingUser = await User.aggregate([
        { $match: { userName: user.userName } },
        {
            $project: {
            repository: {
                $filter: {
                input: "$repository",
                as: "repo",
                cond: { $eq: ["$$repo.pinned", true] }
                }
            }
            }
        }
        ])

        if(!existingUser){
            console.log("user not exist")
            return res.status(404).json({ error: "USER-NOT-FOUND" ,message: "user not exists" })
        }

        res.status(200).json({message: "user detail retrieved successfully", data: existingUser})
    } catch (error) {
        console.log("error in profile controller: ", error)
        res.status(500).json({ error: "SERVER-ERROR" ,message: "internal server error", data: null})
    }
}

export default profilePinnedRepoController