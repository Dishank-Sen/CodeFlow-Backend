const RESERVED_USERNAMES = [
  // Core
  "admin", "root", "system", "sys", "superuser",
  "support", "help", "contact", "about", "info",

  // Auth
  "auth", "login", "logout", "signin", "signup", "register",
  "verify", "verification", "reset", "forgot", "password",

  // API & Backends
  "api", "v1", "v2", "v3", "graphql", "backend", "server",

  // Frontend pages
  "home", "dashboard", "settings", "profile", "user", "users",

  // Reserved UI/UX words
  "search", "explore", "discover", "feed", "posts", "messages",
  "notifications", "chat", "inbox", "outbox",

  // System / networking
  "localhost", "127.0.0.1", "0.0.0.0", "null", "undefined",

  // File extensions
  "css", "js", "json", "xml", "html", "htm", "jpg", "jpeg",
  "png", "gif", "svg", "webp", "ico",

  // Common folders
  "static", "assets", "public", "private", "scripts",

  // Organization/role words
  "staff", "team", "developer", "dev", "moderator", "mod",

  // OAuth providers
  "google", "github", "facebook", "twitter", "linkedin",
  "instagram", "discord", "apple", "microsoft",

  // Finance
  "billing", "payment", "payments", "wallet", "bank",

  // Misleading words
  "secure", "security", "status", "health", "ping",
  "terms", "privacy", "policy", "tos",

  // Tech keywords
  "api-docs", "swagger", "docs", "documentation",
  "robots", "sitemap",

  // Your routing-sensitive words
  "repository", "repo", "repos", "admin",

  // Common programming keywords (avoid confusion)
  "new", "delete", "update", "create", "edit",

  // Potentially offensive words (keep minimal, platform-safe)
  "fuck", "shit", "bitch", "ass", "nigga", "nigger", // add more if needed
];

export default RESERVED_USERNAMES