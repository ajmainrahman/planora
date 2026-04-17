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
const isServerless = process.env.VERCEL === "1" || process.env.AWS_LAMBDA_FUNCTION_NAME;

export const pool = new Pool({
  connectionString,
  // Keep pool small in serverless to avoid exhausting Neon connections.
  max: isServerless ? 1 : 10,
});
export const db = drizzle(pool, { schema });

export * from "./schema";
