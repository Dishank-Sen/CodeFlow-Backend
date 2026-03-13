import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const signupMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.jwt;

    // no token → user not logged in → allow signup
    if (!token) {
      return next();
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET as string);

      // valid token → user already logged in
      if (payload) {
        return res
          .status(409)
          .json({ error: "ALREADY-LOGGED-IN", message: "user is already logged in!" });
      }
    } catch (err) {
      // token invalid or expired → allow signup
      return next();
    }

  } catch (error) {
    console.log("error in signup middleware:", error);
    return res.status(500).json({
      error: "SERVER-ERROR",
      message: "internal server error",
    });
  }
};

export default signupMiddleware;
