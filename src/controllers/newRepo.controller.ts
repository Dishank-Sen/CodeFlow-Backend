import type { Request, Response, RequestHandler } from "express"
import Repo from "../models/repo.models.ts"
import User from "../models/user.models.ts"

const newRepoController: RequestHandler = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.userId)
      return res.status(401).json({ error: "NO-USER-INFO" ,message: "No user info found" });

    let { repoName, description, visibility } = req.body;

    const existingUser = await User.findById(user.userId).select("userName -_id");
    if (!existingUser){
      return res.status(401).json({ error: "NO-USER-INFO" ,message: "No user info found" });
    }

    const remoteUrl = `http://localhost:3000/${existingUser.userName}/${repoName}`;

    const exists = await Repo.exists({ repoName, userName: user.userName });
    if (exists){
      return res.status(409).json({ error: "REPO-NAME-ALREADY-TAKEN" ,message: "repository name already taken" });
    }

    // push reponame in user
    const updateResult = await User.updateOne(
      { _id: user.userId },
      {
        $push: {
          repository: {
            repoName,
            description,
            visibility,
          },
        },
      }
    );

    const newRepo = new Repo({
      userName: existingUser.userName,  
      repoName,
      description,
      remoteUrl,
      visibility,
    });

    await newRepo.save();

    res.status(201).json({ message: "repository created" });
  } catch (error) {
    console.log("error occurred in new repo:", error);
    res.status(500).json({ error: "SERVER-ERROR" ,message: "internal server error" });
  }
};


export default newRepoController