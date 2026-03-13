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

  const authHeader = (req.headers.authorization ?? req.headers.Authorization) as string | undefined;
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length === 2 && /^Bearer$/i.test(parts[0])) return parts[1];
  return null;
}

/**
 * loginMiddleware:
 * - If a valid JWT is present, attaches req.user = { userId, userName, email, profileImg }
 * - If no token or token invalid/expired: does NOT block the request, simply proceeds without req.user
 * - Use where route behavior differs for authenticated vs anonymous users (e.g. login/signup pages)
 */
const loginMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = getTokenFromReq(req);
    if (!token) return next();

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("loginMiddleware: JWT_SECRET not set");
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
      // continue regardless
      return next();
    } catch (err) {
      // invalid/expired token -> ignore and continue as anonymous user
      return next();
    }
  } catch (err) {
    console.error("loginMiddleware error:", err);
    return next();
  }
};

export default loginMiddleware;
