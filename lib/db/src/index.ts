import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const connectionString = process.env.DATABASE_URL;

// In serverless environments (Vercel, AWS Lambda) keep the pool small to avoid
// exhausting connection limits — each function instance gets its own pool.
const isServerless =
  process.env.VERCEL === "1" || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);

// Cloud databases (Neon, Supabase, etc.) require SSL. Skip SSL only for
// local connections that explicitly opt out (e.g., sslmode=disable).
const requireSsl = !connectionString.includes("sslmode=disable");

export const pool = new Pool({
  connectionString,
  max: isServerless ? 1 : 10,
  ...(requireSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});

export const db = drizzle(pool, { schema });

export * from "./schema";
