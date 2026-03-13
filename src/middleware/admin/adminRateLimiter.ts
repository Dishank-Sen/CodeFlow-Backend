import rateLimit, { ipKeyGenerator } from "express-rate-limit";

/**
 * Strict rate limiter for admin login endpoint
 * 5 attempts per 15 minutes
 */
export const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  keyGenerator: (req) => {
    // Rate limit by username or IP
    const username = req.body?.username || "unknown";
    const ip = ipKeyGenerator(req);
    return `${username}:${ip}`;
  },
  message: "Too many login attempts. Please try again later.",
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: (req) => req.method === "GET", // Skip GET requests
});

/**
 * Rate limiter for general admin endpoints
 * 100 requests per 15 minutes
 */
export const adminEndpointLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  keyGenerator: ipKeyGenerator,
  message: "Too many requests. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Stricter rate limiter for sensitive operations
 * 10 requests per hour
 */
export const adminSensitiveOpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  keyGenerator: (req) => {
    // Rate limit by admin ID if available, else IP
    return (req as any).admin?.id || ipKeyGenerator(req);
  },
  message: "Too many sensitive operations. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * MFA code verification limiter
 * 5 attempts per 5 minutes
 */
export const mfaVerifyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => {
    const sessionId = req.body?.sessionId || req.cookies.admin_mfa_session || "unknown";
    return `mfa:${sessionId}`;
  },
  message: "Too many MFA verification attempts. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
