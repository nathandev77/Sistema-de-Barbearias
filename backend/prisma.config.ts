/// <reference types="node" />
// Prisma 7 — URLs de conexão configuradas aqui, não no schema.prisma
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"]!,
    // directUrl usado pelo prisma migrate (conexão direta, sem PgBouncer)
    directUrl: process.env["DIRECT_URL"],
  },
});
