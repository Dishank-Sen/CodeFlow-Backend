import type { Request, Response } from "express";
import jwt from "jsonwebtoken";

type JwtUserPayload = {
  userId: string;
  userName: string;
  email: string;
  profileImg: string;
};

const authenticateToken = (req: Request, res: Response, next: any) => {
  const token = req.cookies?.jwt || req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "UNAUTHORIZED" ,message: "no token provided" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as JwtUserPayload | string;
    if (typeof payload === "string") {
      return res.status(403).json({ error: "INVALID-TOKEN", message: "Token payload is invalid" });
    }
    req.user = payload; // Attach payload to req for downstream
    next();
  } catch (err) {
    console.log(err)
    return res.status(403).json({ error: "INVALID-TOKEN", message: "Invalid or expired token" });
  }
};

export default authenticateToken