import type { Request, Response, NextFunction } from "express";
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
  // prefer cookie, fallback to Authorization header (Bearer)
  const cookieToken = req.cookies?.jwt;
  if (cookieToken) return cookieToken;

  const auth = (req.headers.authorization ?? req.headers.Authorization) as string | undefined;
  if (!auth) return null;
  const parts = auth.split(" ");
  if (parts.length === 2 && /^Bearer$/i.test(parts[0])) return parts[1];
  return null;
}

const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const token = getTokenFromReq(req);

  if (!token) {
    return res.status(401).json({ error: "UNAUTHORIZED", message: "No token provided" });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT_SECRET not set");
      return res.status(500).json({ error: "SERVER-ERROR", message: "Server misconfiguration" });
    }

    const payload = jwt.verify(token, secret) as JwtUserPayload | string;

    if (!payload || typeof payload === "string" || !("userId" in payload)) {
      return res.status(403).json({ error: "INVALID-TOKEN", message: "Token payload is invalid" });
    }

    // attach minimal user info to req for downstream controllers
    ;(req as any).user = {
      userId: (payload as JwtUserPayload).userId,
      userName: (payload as JwtUserPayload).userName,
      email: (payload as JwtUserPayload).email,
      profileImg: (payload as JwtUserPayload).profileImg,
    };

    return next();
  } catch (err: any) {
    // token expired or invalid
    if (err?.name === "TokenExpiredError") {
      return res.status(403).json({ error: "INVALID-TOKEN", message: "Token expired" });
    }
    return res.status(403).json({ error: "INVALID-TOKEN", message: "Invalid token" });
  }
};

export default authenticateToken;
