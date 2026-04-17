import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { eq } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
  ssl: { rejectUnauthorized: false },
});
const db = drizzle(pool);

const ideasTable = pgTable("ideas", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("seed"),
  priority: text("priority").notNull().default("medium"),
  category: text("category").notNull().default("General"),
  nextStep: text("next_step").notNull().default(""),
  dueDate: timestamp("due_date"),
  reminderAt: timestamp("reminder_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { id } = req.query;
  if (!id || typeof id !== "string") return res.status(400).json({ error: "Invalid id" });

  try {
    if (req.method === "GET") {
      const [idea] = await db.select().from(ideasTable).where(eq(ideasTable.id, id));
      if (!idea) return res.status(404).json({ error: "Not found" });
      return res.status(200).json(idea);
    }
    if (req.method === "PATCH") {
      const [idea] = await db.update(ideasTable).set({ ...req.body, updatedAt: new Date() }).where(eq(ideasTable.id, id)).returning();
      if (!idea) return res.status(404).json({ error: "Not found" });
      return res.status(200).json(idea);
    }
    if (req.method === "DELETE") {
      await db.delete(ideasTable).where(eq(ideasTable.id, id));
      return res.status(204).end();
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
