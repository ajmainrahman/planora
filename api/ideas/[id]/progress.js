import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
import { eq } from "drizzle-orm";
import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";

const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1, ssl: { rejectUnauthorized: false } });
const db = drizzle(pool);

const progressNotesTable = pgTable("progress_notes", {
  id: integer("id").primaryKey(),
  ideaId: integer("idea_id").notNull(),
  content: text("content").notNull(),
  mood: text("mood"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

const ideasTable = pgTable("ideas", {
  id: integer("id").primaryKey(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  const id = parseInt(req.query.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  try {
    if (req.method === "GET") {
      const notes = await db.select().from(progressNotesTable).where(eq(progressNotesTable.ideaId, id));
      return res.status(200).json(notes);
    }
    if (req.method === "POST") {
      const [note] = await db.insert(progressNotesTable).values({
        ideaId: id,
        content: req.body.content,
        mood: req.body.mood ?? "Focused",
      }).returning();
      await db.update(ideasTable).set({ updatedAt: new Date() }).where(eq(ideasTable.id, id));
      return res.status(201).json(note);
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: String(err) });
  }
}
