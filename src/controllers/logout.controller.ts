import type { Request, Response, RequestHandler } from "express";

const logoutController: RequestHandler = async (req: Request, res: Response) => {
  try {
    // Clear the cookie containing JWT
    res.clearCookie("jwt", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ error: "SERVER-ERROR" ,message: "Server error during logout" });
  }
};

export default logoutController;