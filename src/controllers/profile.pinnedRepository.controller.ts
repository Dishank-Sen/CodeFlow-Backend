import type { Request, Response, RequestHandler } from "express"
import Repo from '../models/repo.models.js'

const profilePinnedRepoController: RequestHandler = async (req: Request, res: Response) => {
    try {
        const authUser = req.user;
        
        // Get userName from query parameter
        const requestedUserName = typeof req.query.userName === "string" ? req.query.userName.trim().toLowerCase() : "";

        if (!requestedUserName) {
            return res.status(400).json({ error: "MISSING-PARAM", message: "userName is required" });
        }

        // Determine if the requester is the owner of the profile
        const isOwner = authUser && authUser.userId && authUser.userName && authUser.userName.toLowerCase() === requestedUserName;

        // Build aggregation pipeline to search directly in repo collection
        const pipeline: any[] = [
            // Match pinned repos for the requested username
            {
                $match: {
                    userName: requestedUserName,
                    pinned: true
                }
            }
        ];

        // Add visibility filter based on whether user is owner or not
        if (!isOwner) {
            // Non-owner can only see public pinned repos
            pipeline.push({
                $match: {
                    visibility: "public"
                }
            });
        }
        // Owner can see both public and private pinned repos (no additional filter needed)

        // Add sorting and projection
        pipeline.push(
            {
                $sort: { updatedAt: -1 }
            },
            {
                $limit: 6
            },
            {
                $project: {
                    repoName: 1,
                    description: 1,
                    stars: 1,
                    forks: 1,
                    visibility: 1,
                    _id: 0
                }
            }
        );

        const pinnedRepos = await Repo.aggregate(pipeline);

        if (pinnedRepos.length === 0) {
            return res.status(404).json({ error: "NO-PINNED-REPO", message: "no pinned repository" });
        }

        res.status(200).json({ message: "pinned repositories retrieved successfully", data: pinnedRepos });
    } catch (error) {
        console.log("error in profile pinned repo controller: ", error);
        res.status(500).json({ error: "SERVER-ERROR", message: "internal server error", data: null });
    }
}

export default profilePinnedRepoController