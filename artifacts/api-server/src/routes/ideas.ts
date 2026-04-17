import { desc, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateIdeaBody,
  CreateProgressNoteBody,
  CreateProgressNoteParams,
  DeleteIdeaParams,
  GetDashboardResponse,
  GetIdeaParams,
  GetIdeaResponse,
  ListActivityResponse,
  ListIdeasResponse,
  ListProgressNotesParams,
  ListProgressNotesResponse,
  UpdateIdeaBody,
  UpdateIdeaParams,
  UpdateIdeaResponse,
} from "@workspace/api-zod";
import {
  db,
  type Idea,
  ideasTable,
  type ProgressNote,
  progressNotesTable,
} from "@workspace/db";

const router: IRouter = Router();
const statuses = ["seed", "planning", "building", "shared"] as const;
let seedDataPromise: Promise<void> | null = null;

const toIdeaResponse = (idea: Idea) => ({
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
});

const toProgressResponse = (note: ProgressNote) => ({
  id: note.id,
  ideaId: note.ideaId,
  content: note.content,
  mood: note.mood,
  createdAt: note.createdAt,
});

async function seedDataIfEmpty(): Promise<void> {
  const existing = await db.select({ id: ideasTable.id }).from(ideasTable).limit(1);

  if (existing.length > 0) {
    return;
  }

  const [studioIdea, writingIdea, sharingIdea] = await db
    .insert(ideasTable)
    .values([
      {
        title: "Build a weekly idea studio",
        description:
          "Create a repeatable weekly ritual to collect sparks, choose one promising idea, and turn it into a concrete experiment.",
        status: "building",
        priority: "high",
        category: "Personal system",
        nextStep: "Write the first weekly review and pick one idea to prototype.",
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10),
        reminderAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      },
      {
        title: "Publish tiny progress notes",
        description:
          "Share concise updates that show what changed, what was learned, and what is next without needing a polished final result.",
        status: "planning",
        priority: "medium",
        category: "Sharing",
        nextStep: "Draft three update formats and choose the easiest one to keep using.",
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21),
        reminderAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
      },
      {
        title: "Collect rough product thoughts",
        description:
          "Keep a backlog of rough opportunities, inspirations, and half-formed questions before judging whether they are worth building.",
        status: "seed",
        priority: "low",
        category: "Ideas",
        nextStep: "Add five raw notes from recent conversations.",
        dueDate: null,
        reminderAt: null,
      },
    ])
    .returning();

  if (!studioIdea || !writingIdea || !sharingIdea) {
    return;
  }

  await db.insert(progressNotesTable).values([
    {
      ideaId: studioIdea.id,
      content:
        "Defined the basic flow: capture ideas, choose a status, and add progress notes as the work evolves.",
      mood: "Clear",
    },
    {
      ideaId: studioIdea.id,
      content:
        "Next challenge is making the system light enough that it feels like journaling, not project management overhead.",
      mood: "Curious",
    },
    {
      ideaId: writingIdea.id,
      content:
        "Progress updates should focus on the story of learning, not just a completed checklist.",
      mood: "Focused",
    },
  ]);
}

async function ensureSeedData(): Promise<void> {
  seedDataPromise ??= seedDataIfEmpty();
  await seedDataPromise;
}

router.get("/ideas", async (_req, res): Promise<void> => {
  await ensureSeedData();
  const ideas = await db.select().from(ideasTable).orderBy(desc(ideasTable.updatedAt));
  res.json(ListIdeasResponse.parse(ideas.map(toIdeaResponse)));
});

router.post("/ideas", async (req, res): Promise<void> => {
  const parsed = CreateIdeaBody.safeParse(req.body);

  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid idea create body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [idea] = await db.insert(ideasTable).values(parsed.data).returning();

  if (!idea) {
    res.status(500).json({ error: "Unable to create idea" });
    return;
  }

  res.status(201).json(UpdateIdeaResponse.parse(toIdeaResponse(idea)));
});

router.get("/ideas/:id", async (req, res): Promise<void> => {
  await ensureSeedData();
  const params = GetIdeaParams.safeParse(req.params);

  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [idea] = await db
    .select()
    .from(ideasTable)
    .where(eq(ideasTable.id, params.data.id));

  if (!idea) {
    res.status(404).json({ error: "Idea not found" });
    return;
  }

  const notes = await db
    .select()
    .from(progressNotesTable)
    .where(eq(progressNotesTable.ideaId, params.data.id))
    .orderBy(desc(progressNotesTable.createdAt));

  res.json(
    GetIdeaResponse.parse({
      ...toIdeaResponse(idea),
      progressNotes: notes.map(toProgressResponse),
    }),
  );
});

router.patch("/ideas/:id", async (req, res): Promise<void> => {
  const params = UpdateIdeaParams.safeParse(req.params);
  const body = UpdateIdeaBody.safeParse(req.body);

  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  if (!body.success) {
    req.log.warn({ errors: body.error.message }, "Invalid idea update body");
    res.status(400).json({ error: body.error.message });
    return;
  }

  if (Object.keys(body.data).length === 0) {
    res.status(400).json({ error: "At least one field is required" });
    return;
  }

  const [idea] = await db
    .update(ideasTable)
    .set({ ...body.data, updatedAt: new Date() })
    .where(eq(ideasTable.id, params.data.id))
    .returning();

  if (!idea) {
    res.status(404).json({ error: "Idea not found" });
    return;
  }

  res.json(UpdateIdeaResponse.parse(toIdeaResponse(idea)));
});

router.delete("/ideas/:id", async (req, res): Promise<void> => {
  const params = DeleteIdeaParams.safeParse(req.params);

  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const deleted = await db
    .delete(ideasTable)
    .where(eq(ideasTable.id, params.data.id))
    .returning({ id: ideasTable.id });

  if (deleted.length === 0) {
    res.status(404).json({ error: "Idea not found" });
    return;
  }

  res.status(204).send();
});

router.get("/ideas/:id/progress", async (req, res): Promise<void> => {
  await ensureSeedData();
  const params = ListProgressNotesParams.safeParse(req.params);

  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const notes = await db
    .select()
    .from(progressNotesTable)
    .where(eq(progressNotesTable.ideaId, params.data.id))
    .orderBy(desc(progressNotesTable.createdAt));

  res.json(ListProgressNotesResponse.parse(notes.map(toProgressResponse)));
});

router.post("/ideas/:id/progress", async (req, res): Promise<void> => {
  const params = CreateProgressNoteParams.safeParse(req.params);
  const body = CreateProgressNoteBody.safeParse(req.body);

  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  if (!body.success) {
    req.log.warn({ errors: body.error.message }, "Invalid progress note body");
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [idea] = await db
    .select({ id: ideasTable.id })
    .from(ideasTable)
    .where(eq(ideasTable.id, params.data.id));

  if (!idea) {
    res.status(404).json({ error: "Idea not found" });
    return;
  }

  const [note] = await db
    .insert(progressNotesTable)
    .values({ ...body.data, ideaId: params.data.id })
    .returning();

  await db
    .update(ideasTable)
    .set({ updatedAt: new Date() })
    .where(eq(ideasTable.id, params.data.id));

  if (!note) {
    res.status(500).json({ error: "Unable to create progress note" });
    return;
  }

  res.status(201).json(toProgressResponse(note));
});

router.get("/dashboard", async (_req, res): Promise<void> => {
  await ensureSeedData();
  const ideas = await db.select().from(ideasTable);
  const notes = await db.select({ id: progressNotesTable.id }).from(progressNotesTable);
  const statusCounts = statuses.map((status) => ({
    status,
    count: ideas.filter((idea) => idea.status === status).length,
  }));

  res.json(
    GetDashboardResponse.parse({
      totalIdeas: ideas.length,
      activeIdeas: ideas.filter((idea) => idea.status !== "shared").length,
      sharedIdeas: ideas.filter((idea) => idea.status === "shared").length,
      progressNotes: notes.length,
      statusCounts,
    }),
  );
});

router.get("/activity", async (_req, res): Promise<void> => {
  await ensureSeedData();
  const ideas = await db.select().from(ideasTable);
  const notes = await db
    .select({
      id: progressNotesTable.id,
      ideaId: progressNotesTable.ideaId,
      content: progressNotesTable.content,
      mood: progressNotesTable.mood,
      createdAt: progressNotesTable.createdAt,
      ideaTitle: ideasTable.title,
    })
    .from(progressNotesTable)
    .innerJoin(ideasTable, eq(progressNotesTable.ideaId, ideasTable.id));

  const activity = [
    ...ideas.map((idea) => ({
      id: `idea-created-${idea.id}`,
      type: "idea_created" as const,
      title: idea.title,
      detail: `Added to ${idea.category}`,
      createdAt: idea.createdAt,
    })),
    ...ideas
      .filter((idea) => idea.updatedAt.getTime() !== idea.createdAt.getTime())
      .map((idea) => ({
        id: `idea-updated-${idea.id}`,
        type: "idea_updated" as const,
        title: idea.title,
        detail: `Moved forward: ${idea.nextStep}`,
        createdAt: idea.updatedAt,
      })),
    ...notes.map((note) => ({
      id: `progress-${note.id}`,
      type: "progress_added" as const,
      title: note.ideaTitle,
      detail: note.content,
      createdAt: note.createdAt,
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 12);

  res.json(ListActivityResponse.parse(activity));
});

export default router;
