import { createInsertSchema } from "drizzle-zod";
import { pgEnum, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const ideaStatusEnum = pgEnum("idea_status", [
  "seed",
  "planning",
  "building",
  "shared",
]);

export const ideaPriorityEnum = pgEnum("idea_priority", [
  "low",
  "medium",
  "high",
]);

export const ideasTable = pgTable("ideas", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: ideaStatusEnum("status").notNull().default("seed"),
  priority: ideaPriorityEnum("priority").notNull().default("medium"),
  category: text("category").notNull(),
  nextStep: text("next_step").notNull(),
  dueDate: timestamp("due_date", { withTimezone: true }),
  reminderAt: timestamp("reminder_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertIdeaSchema = createInsertSchema(ideasTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertIdea = z.infer<typeof insertIdeaSchema>;
export type Idea = typeof ideasTable.$inferSelect;
