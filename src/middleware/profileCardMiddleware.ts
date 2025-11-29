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
  const cookieToken = (req.cookies as any)?.jwt;
  if (cookieToken) return cookieToken;
  const auth = (req.headers.authorization ?? req.headers.Authorization) as string | undefined;
  if (!auth) return null;
  const parts = auth.split(" ");
  if (parts.length === 2 && /^Bearer$/i.test(parts[0])) return parts[1];
  return null;
}

const ProfileCardMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = getTokenFromReq(req);
    if (!token) return next();

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("ProfileCardMiddleware: JWT_SECRET not set");
      return next();
    }

    try {
      const payload = jwt.verify(token, secret) as JwtUserPayload | string;
      if (payload && typeof payload !== "string" && payload.userId) {
        (req as any).user = {
          userId: payload.userId,
          userName: payload.userName,
          email: payload.email,
          profileImg: payload.profileImg,
        };
      }
    } catch (err) {
      // invalid/expired token -> ignore and continue as anonymous
    }
    return next();
  } catch (err) {
    console.error("ProfileCardMiddleware error:", err);
    return next();
  }
};

export default ProfileCardMiddleware;
