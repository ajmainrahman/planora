import { eq, and } from "drizzle-orm";
import { Router, type IRouter, type Request, type Response } from "express";
import { db, projectTrackerTable } from "@workspace/db";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router: IRouter = Router();

const getUserId = (req: Request) => String(req.sessionUser!.userId);

// List all rows for the current user
router.get("/tracker", requireAuth, async (req: Request, res: Response) => {
  const ownerId = getUserId(req);
  const rows = await db
    .select()
    .from(projectTrackerTable)
    .where(eq(projectTrackerTable.ownerId, ownerId))
    .orderBy(projectTrackerTable.createdAt);
  res.json(rows);
});

// Create a new row
router.post("/tracker", requireAuth, async (req: Request, res: Response) => {
  const ownerId = getUserId(req);
  const body = req.body ?? {};
  const [row] = await db
    .insert(projectTrackerTable)
    .values({ ownerId, ...body })
    .returning();
  res.status(201).json(row);
});

// Update a row
router.patch("/tracker/:id", requireAuth, async (req: Request, res: Response) => {
  const ownerId = getUserId(req);
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const body = req.body ?? {};
  const [row] = await db
    .update(projectTrackerTable)
    .set(body)
    .where(and(eq(projectTrackerTable.id, id), eq(projectTrackerTable.ownerId, ownerId)))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(row);
});

// Delete a row
router.delete("/tracker/:id", requireAuth, async (req: Request, res: Response) => {
  const ownerId = getUserId(req);
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [deleted] = await db
    .delete(projectTrackerTable)
    .where(and(eq(projectTrackerTable.id, id), eq(projectTrackerTable.ownerId, ownerId)))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.status(204).send();
});

export default router;
