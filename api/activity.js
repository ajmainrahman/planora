import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { eq } from "drizzle-orm";

const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1, ssl: { rejectUnauthorized: false } });
const db = drizzle(pool);

const ideasTable = pgTable("ideas", {
  id: integer("id").primaryKey(),
  title: text("title").notNull(),
  status: text("status").notNull(),
  category: text("category").notNull(),
  nextStep: text("next_step").notNull(),
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

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  try {
    const ideas = await db.select().from(ideasTable);
    const notes = await db.select().from(progressNotesTable);
    const activity = [
      ...ideas.map(idea => ({
        id: `idea-created-${idea.id}`,
        type: "idea_created",
        title: idea.title,
        detail: `Added to ${idea.category}`,
        createdAt: idea.createdAt,
      })),
      ...notes.map(note => {
        const idea = ideas.find(i => i.id === note.ideaId);
        return {
          id: `progress-${note.id}`,
          type: "progress_added",
          title: idea?.title ?? "Unknown",
          detail: note.content,
          createdAt: note.createdAt,
        };
      }),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 12);
    res.status(200).json(activity);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
}
