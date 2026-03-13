import type { Request, Response, RequestHandler } from "express";
import Repo from '../models/repo.models.js';

const searchRepositoryController: RequestHandler = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const query = typeof req.query.q === "string" ? req.query.q.trim() : "";

    if (!query || query.length < 1) {
      return res.status(400).json({ 
        error: "INVALID-QUERY", 
        message: "Search query must be at least 1 character" 
      });
    }

    if (query.length > 100) {
      return res.status(400).json({ 
        error: "QUERY-TOO-LONG", 
        message: "Search query must be less than 100 characters" 
      });
    }

    // Build search filter
    const searchRegex = new RegExp(query, "i");
    const filter: any = {
      $or: [
        { repoName: searchRegex },
        { description: searchRegex },
      ]
    };

    // If user is logged in, show their private repos too
    // Otherwise only show public repos
    if (!user?.userId) {
      filter.visibility = "public";
    } else {
      // Show public repos + user's own repos (public or private)
      filter.$or.push({
        $and: [
          { ownerId: user.userId },
        ]
      });
    }

    const repositories = await Repo.find(filter)
      .select("repoName description userName visibility stars forks")
      .limit(10)
      .sort({ stars: -1 });

    res.status(200).json({
      message: "Repositories found",
      data: {
        repositories: repositories || [],
        count: repositories.length,
      }
    });
  } catch (error) {
    console.error("Error in search repository controller:", error);
    res.status(500).json({ 
      error: "SERVER-ERROR", 
      message: "Internal server error" 
    });
  }
};

export default searchRepositoryController;
