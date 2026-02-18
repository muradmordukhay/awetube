import path from "path";
import { loadEnvFile } from "process";
import { defineConfig } from "prisma/config";

// Load .env.local so Prisma CLI picks up DATABASE_URL in development
try {
  loadEnvFile(path.resolve(process.cwd(), ".env.local"));
} catch {
  // .env.local may not exist in CI/production — safe to ignore
}

export default defineConfig({});
