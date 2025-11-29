import type { Request, Response } from "express";
import jwt from "jsonwebtoken";

type JwtUserPayload = {
  userId: string;
  userName?: string;
  email?: string;
  profileImg?: string;
  iat?: number;
  exp?: number;
};

function getTokenFromReq(req: Request): string | null {
  const cookieToken = (req.cookies as any)?.jwt;
  if (cookieToken) return cookieToken;

  const authHeader = (req.headers.authorization ?? req.headers.Authorization) as string | undefined;
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length === 2 && /^Bearer$/i.test(parts[0])) return parts[1];
  return null;
}

const authStatusController = (req: Request, res: Response) => {
  try {
    const token = getTokenFromReq(req);
    if (!token) {
      return res.status(401).json({ error: "UNAUTHORIZED", message: "No token provided" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("authStatusController: JWT_SECRET not set");
      return res.status(500).json({ error: "SERVER-ERROR", message: "Server misconfiguration" });
    }

    try {
      const payload = jwt.verify(token, secret) as JwtUserPayload | string;
      if (!payload || typeof payload === "string" || !("userId" in payload)) {
        return res.status(403).json({ error: "INVALID-TOKEN", message: "Token payload invalid" });
      }

      const user = {
        userId: (payload as JwtUserPayload).userId,
        userName: (payload as JwtUserPayload).userName ?? null,
        email: (payload as JwtUserPayload).email ?? null,
        profileImg: (payload as JwtUserPayload).profileImg ?? null,
      };

      return res.status(200).json({ message: "authenticated", data: user });
    } catch (err: any) {
      if (err?.name === "TokenExpiredError") {
        return res.status(403).json({ error: "INVALID-TOKEN", message: "Token expired" });
      }
      return res.status(403).json({ error: "INVALID-TOKEN", message: "Invalid token" });
    }
  } catch (err) {
    console.error("authStatusController error:", err);
    return res.status(500).json({ error: "SERVER-ERROR", message: "internal server error" });
  }
};

export default authStatusController;
