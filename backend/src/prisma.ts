import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL;

// Creating the Node Connection Pool (optimized for the Supabase Pooler)
const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: { rejectUnauthorized: false }
});

pool.on('error', (err) => {
  console.error('[DATABASE POOL ERROR]:', err.message);
});

// Using the Native Postgres Driver (lighter and safer in Prisma 7+)
const adapter = new PrismaPg(pool);

// Exporting a single (Singleton) Prisma Client instance
export const prisma = new PrismaClient({ adapter });
