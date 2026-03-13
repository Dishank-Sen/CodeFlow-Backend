import type { Express, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import { readFileSync, readdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import YAML from "yaml";
import pkg from '../../package.json' with { type: "json" };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadYaml(filePath: string) {
  const file = readFileSync(filePath, "utf8");
  return YAML.parse(file) as Record<string, any>;
}

export function swaggerDocs(app: Express, port: number) {
  // 1. Base spec
  const basePath = path.resolve(__dirname, "../docs/openapi.base.yaml");
  const swaggerSpec = loadYaml(basePath);
  swaggerSpec.info.version = pkg.version;

  // Ensure paths exists
  swaggerSpec.paths ||= {};

  // 2. Merge all path files
  const pathsDir = path.resolve(__dirname, "../docs/paths");
  const files = readdirSync(pathsDir).filter((f) => f.endsWith(".yaml"));

  for (const file of files) {
    const full = path.join(pathsDir, file);
    const doc = loadYaml(full);

    const docPaths = (doc.paths ?? {}) as Record<string, any>;

    for (const [route, definition] of Object.entries(docPaths)) {
      const existing = (swaggerSpec.paths[route] ?? {}) as Record<string, any>;

      swaggerSpec.paths[route] = {
        ...existing,
        ...(definition as Record<string, any>), // ← explicitly tell TS it's an object
      };
    }
  }

  // 3. Serve UI
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.get("/docs.json", (req: Request, res: Response) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  console.log(`Swagger running at http://localhost:${port}/docs`);
}
