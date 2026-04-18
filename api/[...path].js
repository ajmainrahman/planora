import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
import { desc, eq } from "drizzle-orm";
import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";

const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1, ssl: { rejectUnauthorized: false } });
const db = drizzle(pool);

const ideasTable = pgTable("ideas", {
  id: integer("id").primaryKey(),
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

const progressNotesTable = pgTable("progress_notes", {
  id: integer("id").primaryKey(),
  ideaId: integer("idea_id").notNull(),
  content: text("content").notNull(),
  mood: text("mood"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

function toIdea(r) {
  return { id: r.id, title: r.title, description: r.description, status: r.status, priority: r.priority, category: r.category, nextStep: r.nextStep, dueDate: r.dueDate, reminderAt: r.reminderAt, createdAt: r.createdAt, updatedAt: r.updatedAt };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const url = req.url.split("?")[0];
  const parts = url.split("/").filter(Boolean);

  try {
    // GET /api/ideas
    if (req.method === "GET" && parts.length === 2 && parts[1] === "ideas") {
      const ideas = await db.select().from(ideasTable).orderBy(desc(ideasTable.updatedAt));
      return res.status(200).json(ideas.map(toIdea));
    }
    // POST /api/ideas
    if (req.method === "POST" && parts.length === 2 && parts[1] === "ideas") {
      const b = req.body;
      const [idea] = await db.insert(ideasTable).values({ title: b.title, description: b.description, status: b.status ?? "seed", priority: b.priority ?? "medium", category: b.category ?? "General", nextStep: b.nextStep ?? "", dueDate: b.dueDate ? new Date(b.dueDate) : null, reminderAt: b.reminderAt ? new Date(b.reminderAt) : null }).returning();
      return res.status(201).json(toIdea(idea));
    }
    // GET /api/ideas/:id
    if (req.method === "GET" && parts.length === 3 && parts[1] === "ideas") {
      const id = parseInt(parts[2]);
      const [idea] = await db.select().from(ideasTable).where(eq(ideasTable.id, id));
      if (!idea) return res.status(404).json({ error: "Not found" });
      const notes = await db.select().from(progressNotesTable).where(eq(progressNotesTable.ideaId, id));
      return res.status(200).json({ ...toIdea(idea), progressNotes: notes });
    }
    // PATCH /api/ideas/:id
    if (req.method === "PATCH" && parts.length === 3 && parts[1] === "ideas") {
      const id = parseInt(parts[2]);
      const b = req.body;
      const [idea] = await db.update(ideasTable).set({ ...b.title && { title: b.title }, ...b.description && { description: b.description }, ...b.status && { status: b.status }, ...b.priority && { priority: b.priority }, ...b.category && { category: b.category }, ...b.nextStep && { nextStep: b.nextStep }, updatedAt: new Date() }).where(eq(ideasTable.id, id)).returning();
      if (!idea) return res.status(404).json({ error: "Not found" });
      return res.status(200).json(toIdea(idea));
    }
    // DELETE /api/ideas/:id
    if (req.method === "DELETE" && parts.length === 3 && parts[1] === "ideas") {
      const id = parseInt(parts[2]);
      await db.delete(ideasTable).where(eq(ideasTable.id, id));
      return res.status(204).end();
    }
    // GET /api/ideas/:id/progress
    if (req.method === "GET" && parts.length === 4 && parts[3] === "progress") {
      const id = parseInt(parts[2]);
      const notes = await db.select().from(progressNotesTable).where(eq(progressNotesTable.ideaId, id));
      return res.status(200).json(notes);
    }
    // POST /api/ideas/:id/progress
    if (req.method === "POST" && parts.length === 4 && parts[3] === "progress") {
      const id = parseInt(parts[2]);
      const [note] = await db.insert(progressNotesTable).values({ ideaId: id, content: req.body.content, mood: req.body.mood ?? "Focused" }).returning();
      await db.update(ideasTable).set({ updatedAt: new Date() }).where(eq(ideasTable.id, id));
      return res.status(201).json(note);
    }
    // GET /api/dashboard
    if (req.method === "GET" && parts[1] === "dashboard") {
      const ideas = await db.select().from(ideasTable);
      const notes = await db.select({ id: progressNotesTable.id }).from(progressNotesTable);
      return res.status(200).json({ totalIdeas: ideas.length, activeIdeas: ideas.filter(i => i.status !== "shared").length, sharedIdeas: ideas.filter(i => i.status === "shared").length, progressNotes: notes.length, statusCounts: ["seed","planning","building","shared"].map(s => ({ status: s, count: ideas.filter(i => i.status === s).length })) });
    }
    // GET /api/activity
    if (req.method === "GET" && parts[1] === "activity") {
      const ideas = await db.select().from(ideasTable);
      const notes = await db.select().from(progressNotesTable);
      const activity = [...ideas.map(i => ({ id: `idea-${i.id}`, type: "idea_created", title: i.title, detail: `Added to ${i.category}`, createdAt: i.createdAt })), ...notes.map(n => ({ id: `note-${n.id}`, type: "progress_added", title: ideas.find(i => i.id === n.ideaId)?.title ?? "Unknown", detail: n.content, createdAt: n.createdAt }))].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 12);
      return res.status(200).json(activity);
    }
    return res.status(404).json({ error: "Not found" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: String(err) });
  }
}
