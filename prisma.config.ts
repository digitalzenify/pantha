import path from "node:path";
import { defineConfig } from "prisma/config";

// DATABASE_URL must be set in the environment (or a .env file) when running
// Prisma CLI commands such as `prisma migrate dev` or `prisma migrate deploy`.
export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
  schema: path.join("prisma", "schema.prisma"),
});
