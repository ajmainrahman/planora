import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
import { desc } from "drizzle-orm";
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

function toResponse(idea) {
  return {
    id: idea.id,
    title: idea.title,
    description: idea.description,
    status: idea.status,
    priority: idea.priority,
    category: idea.category,
    nextStep: idea.nextStep,
    dueDate: idea.dueDate,
    reminderAt: idea.reminderAt,
    createdAt: idea.createdAt,
    updatedAt: idea.updatedAt,
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    if (req.method === "GET") {
      const ideas = await db.select().from(ideasTable).orderBy(desc(ideasTable.updatedAt));
      return res.status(200).json(ideas.map(toResponse));
    }
    if (req.method === "POST") {
      const body = req.body;
      const [idea] = await db.insert(ideasTable).values({
        title: body.title,
        description: body.description,
        status: body.status ?? "seed",
        priority: body.priority ?? "medium",
        category: body.category ?? "General",
        nextStep: body.nextStep ?? "",
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        reminderAt: body.reminderAt ? new Date(body.reminderAt) : null,
      }).returning();
      return res.status(201).json(toResponse(idea));
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: String(err) });
  }
}
