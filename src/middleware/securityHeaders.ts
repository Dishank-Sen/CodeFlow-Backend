import helmet from "helmet";
import { Express } from "express";

export function setupSecurityHeaders(app: Express) {
  // Helmet middleware for security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          fontSrc: ["'self'", "data:"],
          connectSrc: ["'self'", "http://localhost:3000"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
        },
      },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      xContentTypeOptions: true,
      xFrameOptions: {
        action: "deny",
      },
      xXssProtection: true,
      referrerPolicy: {
        policy: "strict-origin-when-cross-origin",
      },
    })
  );

  // Additional security headers
  app.use((req, res, next) => {
    res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
    res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
    next();
  });
}
