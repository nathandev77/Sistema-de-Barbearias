import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL;

// Criando o Pool de Conexões do Node (otimizado para o Supabase Pooler)
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

// Usando o Driver Nativo do Postgres (Mais leve e seguro no Prisma 7+)
const adapter = new PrismaPg(pool);

// Exportando uma instância única (Singleton) do Prisma Client
export const prisma = new PrismaClient({ adapter });
