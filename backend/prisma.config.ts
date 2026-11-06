/// <reference types="node" />
// Prisma 7 — connection URLs configured here, not in schema.prisma
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"]!,
    // directUrl used by prisma migrate (direct connection, without PgBouncer)
    directUrl: process.env["DIRECT_URL"],
  },
});
