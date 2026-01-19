import type { Request, Response } from "express";
import FileTree from "../models/fileTree.push.models.ts";
import Repo from "../models/repo.models.ts";

const getFileTreeController = async (req: Request, res: Response) => {
  try {
    const { userName, repoName } = req.params;

    // 1. Validate repo exists (cheap, indexed)
    const exists = await Repo.exists({
      userName: userName.toLowerCase(),
      repoName_normalized: repoName.toLowerCase(),
    });

    if (!exists) {
      return res.status(404).json({ message: "Repository not found" });
    }

    // 2. Fetch latest file tree
    const tree = await FileTree.findOne(
      {
        ownerName: userName.toLowerCase(),
        repoName: repoName.toLowerCase(),
      },
      { _id: 0, files: 1, timestamp: 1 }
    ).lean();

    if (!tree) {
      return res.status(204).json({ message: "No file tree available" });
    }

    res.status(200).json(tree);
  } catch (err) {
    console.error("getFileTree error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export default getFileTreeController