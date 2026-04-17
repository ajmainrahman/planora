import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
import { eq } from "drizzle-orm";
import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";

const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1, ssl: { rejectUnauthorized: false } });
const db = drizzle(pool);

const ideasTable = pgTable("ideas", {
  id: integer("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull(),
  priority: text("priority").notNull(),
  category: text("category").notNull(),
  nextStep: text("next_step").notNull(),
  dueDate: timestamp("due_date"),
  reminderAt: timestamp("reminder_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

const progressNotesTable = pgTable("progress_notes", {
  id: integer("id").primaryKey(),
  ideaId: integer("idea_id").notNull(),
  content: text("content").notNull(),
  mood: text("mood"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

function toResponse(idea) {
  return {
    id: idea.id, title: idea.title, description: idea.description,
    status: idea.status, priority: idea.priority, category: idea.category,
    nextStep: idea.nextStep, dueDate: idea.dueDate, reminderAt: idea.reminderAt,
    createdAt: idea.createdAt, updatedAt: idea.updatedAt,
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const id = parseInt(req.query.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  try {
    if (req.method === "GET") {
      const [idea] = await db.select().from(ideasTable).where(eq(ideasTable.id, id));
      if (!idea) return res.status(404).json({ error: "Idea not found" });
      const notes = await db.select().from(progressNotesTable).where(eq(progressNotesTable.ideaId, id));
      return res.status(200).json({ ...toResponse(idea), progressNotes: notes });
    }
    if (req.method === "PATCH") {
      const body = req.body;
      const [idea] = await db.update(ideasTable).set({
        ...body.title && { title: body.title },
        ...body.description && { description: body.description },
        ...body.status && { status: body.status },
        ...body.priority && { priority: body.priority },
        ...body.category && { category: body.category },
        ...body.nextStep && { nextStep: body.nextStep },
        updatedAt: new Date(),
      }).where(eq(ideasTable.id, id)).returning();
      if (!idea) return res.status(404).json({ error: "Idea not found" });
      return res.status(200).json(toResponse(idea));
    }
    if (req.method === "DELETE") {
      await db.delete(ideasTable).where(eq(ideasTable.id, id));
      return res.status(204).end();
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: String(err) });
  }
}
