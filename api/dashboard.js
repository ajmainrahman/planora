import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";

const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1, ssl: { rejectUnauthorized: false } });
const db = drizzle(pool);

const ideasTable = pgTable("ideas", {
  id: integer("id").primaryKey(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

const progressNotesTable = pgTable("progress_notes", {
  id: integer("id").primaryKey(),
});

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  try {
    const ideas = await db.select().from(ideasTable);
    const notes = await db.select({ id: progressNotesTable.id }).from(progressNotesTable);
    const statuses = ["seed", "planning", "building", "shared"];
    res.status(200).json({
      totalIdeas: ideas.length,
      activeIdeas: ideas.filter(i => i.status !== "shared").length,
      sharedIdeas: ideas.filter(i => i.status === "shared").length,
      progressNotes: notes.length,
      statusCounts: statuses.map(status => ({
        status,
        count: ideas.filter(i => i.status === status).length,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
}
