import { pgEnum, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const trackerStatusEnum = pgEnum("tracker_status", [
  "not_started",
  "working_on",
  "complete",
  "blocked",
  "in_review",
  "na",
]);

export const trackerPriorityEnum = pgEnum("tracker_priority", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const projectTrackerTable = pgTable("project_tracker", {
  id: serial("id").primaryKey(),
  ownerId: text("owner_id").notNull(),
  feature: text("feature").notNull().default(""),
  poc: text("poc").default(""),
  deadline: text("deadline").default(""),
  prdStatus: trackerStatusEnum("prd_status").default("not_started"),
  figmaLink: text("figma_link").default(""),
  prdLink: text("prd_link").default(""),
  brdStatus: trackerStatusEnum("brd_status").default("not_started"),
  brdLink: text("brd_link").default(""),
  testCaseLink: text("test_case_link").default(""),
  prototype: text("prototype").default(""),
  priority: trackerPriorityEnum("priority").default("medium"),
  assignee: text("assignee").default(""),
  comment: text("comment").default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertTrackerRowSchema = createInsertSchema(projectTrackerTable).omit({
  id: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
});

export const updateTrackerRowSchema = insertTrackerRowSchema.partial();

export type InsertTrackerRow = z.infer<typeof insertTrackerRowSchema>;
export type UpdateTrackerRow = z.infer<typeof updateTrackerRowSchema>;
export type TrackerRow = typeof projectTrackerTable.$inferSelect;
