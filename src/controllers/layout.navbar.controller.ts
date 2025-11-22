import type { Request, Response, RequestHandler } from "express";

const layoutNavbarController: RequestHandler = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user || !user.userId) {
      return res.status(401).json({ error: "NO-USER-INFO", message: "No user info found" });
    }

    const data = {
      userName: user.userName,
      profileImg: user.profileImg,
    };

    return res.status(200).json({ message: "User found", data: data });
  } catch (error) {
    console.error("User Detail server error:", error);
    return res.status(500).json({ error: "SERVER-ERROR" ,message: "internal server error" });
  }
};

export default layoutNavbarController;