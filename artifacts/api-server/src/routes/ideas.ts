import { getAuth } from "@clerk/express";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { Router, type IRouter, type NextFunction, type Request, type Response } from "express";
import {
  CreateIdeaBody,
  CreateProgressNoteBody,
  CreateProgressNoteParams,
  DeleteIdeaParams,
  GetCalendarResponse,
  GetDashboardResponse,
  GetIdeaParams,
  GetIdeaResponse,
  GetProgressSummaryResponse,
  GetPublicIdeaParams,
  GetPublicIdeaResponse,
  GetPublicPortfolioResponse,
  GetWeeklyReviewResponse,
  ListActivityResponse,
  ListIdeasResponse,
  ListProgressNotesParams,
  ListProgressNotesResponse,
  SearchResponse,
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
const seedDataPromises = new Map<string, Promise<void>>();

type AuthenticatedRequest = Request & { userId: string };

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const auth = getAuth(req);
  const userId = auth.userId ?? (auth.sessionClaims as { userId?: string } | undefined)?.userId;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  (req as AuthenticatedRequest).userId = userId;
  next();
};

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
  recurrenceType: idea.recurrenceType ?? null,
  recurrenceInterval: idea.recurrenceInterval ?? null,
  createdAt: idea.createdAt,
  updatedAt: idea.updatedAt,
});

const toProgressResponse = (note: ProgressNote) => ({
  id: note.id,
  ideaId: note.ideaId,
  content: note.content,
  mood: note.mood,
  tags: note.tags ?? [],
  createdAt: note.createdAt,
});

const toPublicIdeaResponse = (idea: Idea, notes: ProgressNote[] = []) => ({
  ...toIdeaResponse(idea),
  shareUrl: `/share/${idea.id}`,
  progressNotes: notes.map(toProgressResponse),
});

const formatDateLabel = (date: Date) =>
  new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);

const formatWeekLabel = (date: Date) => {
  const weekStart = new Date(date);
  const day = weekStart.getDay();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - day);
  return `Week of ${formatDateLabel(weekStart)}`;
};

const daysBetween = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const countInRange = (items: Date[], start: Date, end: Date) =>
  items.filter((item) => item >= start && item < end).length;

const buildDailyBuckets = (ideas: Idea[], notes: ProgressNote[]) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, index) => {
    const start = daysBetween(today, index - 6);
    const end = daysBetween(start, 1);
    const ideasCreated = countInRange(
      ideas.map((idea) => idea.createdAt),
      start,
      end,
    );
    const notesAdded = countInRange(
      notes.map((note) => note.createdAt),
      start,
      end,
    );
    const ideasShared = countInRange(
      ideas.filter((idea) => idea.status === "shared").map((idea) => idea.updatedAt),
      start,
      end,
    );

    return {
      label: formatDateLabel(start),
      ideasCreated,
      notesAdded,
      ideasShared,
      totalActivity: ideasCreated + notesAdded + ideasShared,
    };
  });
};

const buildWeeklyBuckets = (ideas: Idea[], notes: ProgressNote[]) => {
  const currentWeekStart = new Date();
  currentWeekStart.setHours(0, 0, 0, 0);
  currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());

  return Array.from({ length: 6 }, (_, index) => {
    const start = daysBetween(currentWeekStart, (index - 5) * 7);
    const end = daysBetween(start, 7);
    const ideasCreated = countInRange(
      ideas.map((idea) => idea.createdAt),
      start,
      end,
    );
    const notesAdded = countInRange(
      notes.map((note) => note.createdAt),
      start,
      end,
    );
    const ideasShared = countInRange(
      ideas.filter((idea) => idea.status === "shared").map((idea) => idea.updatedAt),
      start,
      end,
    );

    return {
      label: formatWeekLabel(start),
      ideasCreated,
      notesAdded,
      ideasShared,
      totalActivity: ideasCreated + notesAdded + ideasShared,
    };
  });
};

const summarizeProgress = (dailyTotal: number, weeklyTotal: number, sharedIdeas: number) => ({
  dailySummary:
    dailyTotal > 0
      ? `You logged ${dailyTotal} research actions over the last 7 days.`
      : "No research activity has been logged this week yet.",
  weeklySummary:
    weeklyTotal > 0
      ? `The last 6 weeks contain ${weeklyTotal} total idea, note, and sharing actions.`
      : "Start adding notes or moving ideas forward to build your weekly graph.",
  sharedSummary:
    sharedIdeas > 0
      ? `${sharedIdeas} idea${sharedIdeas === 1 ? " is" : "s are"} ready to share publicly.`
      : "Mark an idea as shared to add it to your public portfolio.",
});

const computeStreaks = (notes: Array<{ createdAt: Date }>) => {
  if (notes.length === 0) return { currentStreak: 0, longestStreak: 0 };

  const daySet = new Set<string>();
  for (const note of notes) {
    const d = new Date(note.createdAt);
    d.setHours(0, 0, 0, 0);
    daySet.add(d.toISOString());
  }

  const days = Array.from(daySet)
    .map((d) => new Date(d))
    .sort((a, b) => a.getTime() - b.getTime());

  let longestStreak = 1;
  let currentRun = 1;

  for (let i = 1; i < days.length; i++) {
    const prev = days[i - 1]!;
    const curr = days[i]!;
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      currentRun++;
      if (currentRun > longestStreak) longestStreak = currentRun;
    } else if (diff > 1) {
      currentRun = 1;
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const lastDay = days[days.length - 1]!;
  const lastDayStr = lastDay.toISOString();
  const hasToday = lastDayStr === today.toISOString();
  const hasYesterday = lastDayStr === yesterday.toISOString();

  let currentStreak = 0;
  if (hasToday || hasYesterday) {
    currentStreak = 1;
    for (let i = days.length - 2; i >= 0; i--) {
      const curr = days[i + 1]!;
      const prev = days[i]!;
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  return { currentStreak, longestStreak };
};

async function seedDataIfEmpty(userId: string): Promise<void> {
  const existing = await db
    .select({ id: ideasTable.id })
    .from(ideasTable)
    .where(eq(ideasTable.ownerId, userId))
    .limit(1);

  if (existing.length > 0) {
    return;
  }

  const [studioIdea, writingIdea, sharingIdea] = await db
    .insert(ideasTable)
    .values([
      {
        ownerId: userId,
        title: "Build a weekly idea studio",
        description:
          "Create a repeatable weekly ritual to collect sparks, choose one promising idea, and turn it into a concrete experiment.",
        status: "building",
        priority: "high",
        category: "Personal system",
        nextStep: "Write the first weekly review and pick one idea to prototype.",
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10),
        reminderAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        recurrenceType: "weekly",
        recurrenceInterval: 1,
      },
      {
        ownerId: userId,
        title: "Publish tiny progress notes",
        description:
          "Share concise updates that show what changed, what was learned, and what is next without needing a polished final result.",
        status: "shared",
        priority: "medium",
        category: "Sharing",
        nextStep: "Draft three update formats and choose the easiest one to keep using.",
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21),
        reminderAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
      },
      {
        ownerId: userId,
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
      tags: ["planning", "system"],
    },
    {
      ideaId: studioIdea.id,
      content:
        "Next challenge is making the system light enough that it feels like journaling, not project management overhead.",
      mood: "Curious",
      tags: ["reflection"],
    },
    {
      ideaId: writingIdea.id,
      content:
        "Progress updates should focus on the story of learning, not just a completed checklist.",
      mood: "Focused",
      tags: ["writing"],
    },
  ]);
}

async function ensureSeedData(userId: string): Promise<void> {
  if (!seedDataPromises.has(userId)) {
    seedDataPromises.set(userId, seedDataIfEmpty(userId));
  }
  await seedDataPromises.get(userId);
}

async function getUserProgressNotes(userId: string): Promise<ProgressNote[]> {
  return db
    .select({
      id: progressNotesTable.id,
      ideaId: progressNotesTable.ideaId,
      content: progressNotesTable.content,
      mood: progressNotesTable.mood,
      tags: progressNotesTable.tags,
      createdAt: progressNotesTable.createdAt,
    })
    .from(progressNotesTable)
    .innerJoin(ideasTable, eq(progressNotesTable.ideaId, ideasTable.id))
    .where(eq(ideasTable.ownerId, userId));
}

router.get("/share", async (_req, res): Promise<void> => {
  const sharedIdeas = await db
    .select()
    .from(ideasTable)
    .where(eq(ideasTable.status, "shared"))
    .orderBy(desc(ideasTable.updatedAt));
  const notes = await db.select().from(progressNotesTable).orderBy(desc(progressNotesTable.createdAt));

  res.json(
    GetPublicPortfolioResponse.parse({
      title: "Planora Research Portfolio",
      description:
        "A public collection of ideas that moved from rough sparks into visible progress.",
      sharedIdeas: sharedIdeas.map((idea) =>
        toPublicIdeaResponse(
          idea,
          notes.filter((note) => note.ideaId === idea.id),
        ),
      ),
      stats: [
        {
          label: "Published ideas",
          value: sharedIdeas.length,
          detail: "Ideas marked as shared",
        },
        {
          label: "Progress notes",
          value: notes.filter((note) =>
            sharedIdeas.some((idea) => idea.id === note.ideaId),
          ).length,
          detail: "Public learning updates",
        },
        {
          label: "Active categories",
          value: new Set(sharedIdeas.map((idea) => idea.category)).size,
          detail: "Research themes represented",
        },
      ],
    }),
  );
});

router.get("/share/:id", async (req, res): Promise<void> => {
  const params = GetPublicIdeaParams.safeParse(req.params);

  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [idea] = await db
    .select()
    .from(ideasTable)
    .where(eq(ideasTable.id, params.data.id));

  if (!idea || idea.status !== "shared") {
    res.status(404).json({ error: "Public idea not found" });
    return;
  }

  const notes = await db
    .select()
    .from(progressNotesTable)
    .where(eq(progressNotesTable.ideaId, idea.id))
    .orderBy(desc(progressNotesTable.createdAt));

  res.json(GetPublicIdeaResponse.parse(toPublicIdeaResponse(idea, notes)));
});

router.use(requireAuth);

router.get("/ideas", async (req, res): Promise<void> => {
  const userId = (req as AuthenticatedRequest).userId;
  await ensureSeedData(userId);
  const ideas = await db
    .select()
    .from(ideasTable)
    .where(eq(ideasTable.ownerId, userId))
    .orderBy(desc(ideasTable.updatedAt));
  res.json(ListIdeasResponse.parse(ideas.map(toIdeaResponse)));
});

router.post("/ideas", async (req, res): Promise<void> => {
  const userId = (req as AuthenticatedRequest).userId;
  const parsed = CreateIdeaBody.safeParse(req.body);

  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid idea create body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [idea] = await db.insert(ideasTable).values({ ...parsed.data, ownerId: userId }).returning();

  if (!idea) {
    res.status(500).json({ error: "Unable to create idea" });
    return;
  }

  res.status(201).json(UpdateIdeaResponse.parse(toIdeaResponse(idea)));
});

router.get("/ideas/:id", async (req, res): Promise<void> => {
  const userId = (req as AuthenticatedRequest).userId;
  await ensureSeedData(userId);
  const params = GetIdeaParams.safeParse(req.params);

  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [idea] = await db
    .select()
    .from(ideasTable)
    .where(and(eq(ideasTable.id, params.data.id), eq(ideasTable.ownerId, userId)));

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
  const userId = (req as AuthenticatedRequest).userId;
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
    .where(and(eq(ideasTable.id, params.data.id), eq(ideasTable.ownerId, userId)))
    .returning();

  if (!idea) {
    res.status(404).json({ error: "Idea not found" });
    return;
  }

  res.json(UpdateIdeaResponse.parse(toIdeaResponse(idea)));
});

router.delete("/ideas/:id", async (req, res): Promise<void> => {
  const userId = (req as AuthenticatedRequest).userId;
  const params = DeleteIdeaParams.safeParse(req.params);

  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const deleted = await db
    .delete(ideasTable)
    .where(and(eq(ideasTable.id, params.data.id), eq(ideasTable.ownerId, userId)))
    .returning({ id: ideasTable.id });

  if (deleted.length === 0) {
    res.status(404).json({ error: "Idea not found" });
    return;
  }

  res.status(204).send();
});

router.get("/ideas/:id/progress", async (req, res): Promise<void> => {
  const userId = (req as AuthenticatedRequest).userId;
  await ensureSeedData(userId);
  const params = ListProgressNotesParams.safeParse(req.params);

  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [idea] = await db
    .select({ id: ideasTable.id })
    .from(ideasTable)
    .where(and(eq(ideasTable.id, params.data.id), eq(ideasTable.ownerId, userId)));

  if (!idea) {
    res.status(404).json({ error: "Idea not found" });
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
  const userId = (req as AuthenticatedRequest).userId;
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
    .where(and(eq(ideasTable.id, params.data.id), eq(ideasTable.ownerId, userId)));

  if (!idea) {
    res.status(404).json({ error: "Idea not found" });
    return;
  }

  const [note] = await db
    .insert(progressNotesTable)
    .values({ ...body.data, ideaId: params.data.id, tags: body.data.tags ?? [] })
    .returning();

  await db
    .update(ideasTable)
    .set({ updatedAt: new Date() })
    .where(and(eq(ideasTable.id, params.data.id), eq(ideasTable.ownerId, userId)));

  if (!note) {
    res.status(500).json({ error: "Unable to create progress note" });
    return;
  }

  res.status(201).json(toProgressResponse(note));
});

router.get("/dashboard", async (req, res): Promise<void> => {
  const userId = (req as AuthenticatedRequest).userId;
  await ensureSeedData(userId);
  const ideas = await db.select().from(ideasTable).where(eq(ideasTable.ownerId, userId));
  const notes = await db
    .select({ id: progressNotesTable.id, createdAt: progressNotesTable.createdAt })
    .from(progressNotesTable)
    .innerJoin(ideasTable, eq(progressNotesTable.ideaId, ideasTable.id))
    .where(eq(ideasTable.ownerId, userId));

  const statusCounts = statuses.map((status) => ({
    status,
    count: ideas.filter((idea) => idea.status === status).length,
  }));

  const { currentStreak, longestStreak } = computeStreaks(notes);

  res.json(
    GetDashboardResponse.parse({
      totalIdeas: ideas.length,
      activeIdeas: ideas.filter((idea) => idea.status !== "shared").length,
      sharedIdeas: ideas.filter((idea) => idea.status === "shared").length,
      progressNotes: notes.length,
      currentStreak,
      longestStreak,
      statusCounts,
    }),
  );
});

router.get("/activity", async (req, res): Promise<void> => {
  const userId = (req as AuthenticatedRequest).userId;
  await ensureSeedData(userId);
  const ideas = await db.select().from(ideasTable).where(eq(ideasTable.ownerId, userId));
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
    .innerJoin(ideasTable, eq(progressNotesTable.ideaId, ideasTable.id))
    .where(eq(ideasTable.ownerId, userId));

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

router.get("/progress-summary", async (req, res): Promise<void> => {
  const userId = (req as AuthenticatedRequest).userId;
  await ensureSeedData(userId);
  const ideas = await db.select().from(ideasTable).where(eq(ideasTable.ownerId, userId));
  const notes = await getUserProgressNotes(userId);
  const daily = buildDailyBuckets(ideas, notes);
  const weekly = buildWeeklyBuckets(ideas, notes);
  const dailyTotal = daily.reduce((sum, bucket) => sum + bucket.totalActivity, 0);
  const weeklyTotal = weekly.reduce((sum, bucket) => sum + bucket.totalActivity, 0);
  const sharedIdeas = ideas.filter((idea) => idea.status === "shared").length;
  const summaries = summarizeProgress(dailyTotal, weeklyTotal, sharedIdeas);

  res.json(
    GetProgressSummaryResponse.parse({
      daily,
      weekly,
      dailySummary: summaries.dailySummary,
      weeklySummary: summaries.weeklySummary,
      metrics: [
        {
          label: "7-day momentum",
          value: dailyTotal,
          detail: "Ideas, notes, and shares recorded this week",
        },
        {
          label: "6-week output",
          value: weeklyTotal,
          detail: "Research actions across your recent archive",
        },
        {
          label: "Share-ready",
          value: sharedIdeas,
          detail: summaries.sharedSummary,
        },
      ],
    }),
  );
});

router.get("/search", async (req, res): Promise<void> => {
  const userId = (req as AuthenticatedRequest).userId;
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

  if (!q) {
    res.json(SearchResponse.parse({ ideas: [], notes: [] }));
    return;
  }

  const likeQ = `%${q}%`;

  const ideas = await db
    .select()
    .from(ideasTable)
    .where(
      and(
        eq(ideasTable.ownerId, userId),
        or(
          ilike(ideasTable.title, likeQ),
          ilike(ideasTable.description, likeQ),
          ilike(ideasTable.category, likeQ),
          ilike(ideasTable.nextStep, likeQ),
        ),
      ),
    )
    .limit(20);

  const notesRaw = await db
    .select({
      id: progressNotesTable.id,
      ideaId: progressNotesTable.ideaId,
      content: progressNotesTable.content,
      mood: progressNotesTable.mood,
      tags: progressNotesTable.tags,
      createdAt: progressNotesTable.createdAt,
      ideaTitle: ideasTable.title,
    })
    .from(progressNotesTable)
    .innerJoin(ideasTable, eq(progressNotesTable.ideaId, ideasTable.id))
    .where(
      and(
        eq(ideasTable.ownerId, userId),
        ilike(progressNotesTable.content, likeQ),
      ),
    )
    .limit(20);

  res.json(
    SearchResponse.parse({
      ideas: ideas.map(toIdeaResponse),
      notes: notesRaw.map((n) => ({
        id: n.id,
        ideaId: n.ideaId,
        ideaTitle: n.ideaTitle,
        content: n.content,
        mood: n.mood,
        tags: n.tags ?? [],
        createdAt: n.createdAt,
      })),
    }),
  );
});

router.get("/calendar", async (req, res): Promise<void> => {
  const userId = (req as AuthenticatedRequest).userId;
  await ensureSeedData(userId);

  const monthParam = typeof req.query.month === "string" ? req.query.month : null;
  let rangeStart: Date;
  let rangeEnd: Date;

  if (monthParam) {
    rangeStart = new Date(`${monthParam}-01T00:00:00Z`);
    rangeEnd = new Date(rangeStart);
    rangeEnd.setMonth(rangeEnd.getMonth() + 1);
  } else {
    rangeStart = new Date();
    rangeStart.setDate(1);
    rangeStart.setHours(0, 0, 0, 0);
    rangeEnd = new Date(rangeStart);
    rangeEnd.setMonth(rangeEnd.getMonth() + 1);
  }

  const ideas = await db
    .select()
    .from(ideasTable)
    .where(eq(ideasTable.ownerId, userId));

  const notesRaw = await db
    .select({
      id: progressNotesTable.id,
      ideaId: progressNotesTable.ideaId,
      content: progressNotesTable.content,
      mood: progressNotesTable.mood,
      tags: progressNotesTable.tags,
      createdAt: progressNotesTable.createdAt,
      ideaTitle: ideasTable.title,
    })
    .from(progressNotesTable)
    .innerJoin(ideasTable, eq(progressNotesTable.ideaId, ideasTable.id))
    .where(eq(ideasTable.ownerId, userId));

  const entriesMap = new Map<string, {
    date: string;
    ideas: Array<{ id: number; title: string; status: string; dueDate: string | null; recurrenceType: string | null }>;
    notes: Array<{ id: number; ideaId: number; ideaTitle: string; content: string; mood: string }>;
  }>();

  const toDateKey = (d: Date) => {
    const dd = new Date(d);
    return `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, "0")}-${String(dd.getDate()).padStart(2, "0")}`;
  };

  const getOrCreate = (key: string) => {
    if (!entriesMap.has(key)) {
      entriesMap.set(key, { date: key, ideas: [], notes: [] });
    }
    return entriesMap.get(key)!;
  };

  for (const idea of ideas) {
    if (idea.dueDate) {
      const key = toDateKey(idea.dueDate);
      if (idea.dueDate >= rangeStart && idea.dueDate < rangeEnd) {
        getOrCreate(key).ideas.push({
          id: idea.id,
          title: idea.title,
          status: idea.status,
          dueDate: idea.dueDate.toISOString(),
          recurrenceType: idea.recurrenceType ?? null,
        });
      }
    }
  }

  for (const note of notesRaw) {
    if (note.createdAt >= rangeStart && note.createdAt < rangeEnd) {
      const key = toDateKey(note.createdAt);
      getOrCreate(key).notes.push({
        id: note.id,
        ideaId: note.ideaId,
        ideaTitle: note.ideaTitle,
        content: note.content,
        mood: note.mood,
      });
    }
  }

  const entries = Array.from(entriesMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  res.json(GetCalendarResponse.parse(entries));
});

router.get("/weekly-review", async (req, res): Promise<void> => {
  const userId = (req as AuthenticatedRequest).userId;
  await ensureSeedData(userId);

  const weekParam = typeof req.query.week === "string" ? req.query.week : null;
  let weekStart: Date;

  if (weekParam) {
    weekStart = new Date(`${weekParam}T00:00:00Z`);
  } else {
    weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  }

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const ideas = await db
    .select()
    .from(ideasTable)
    .where(eq(ideasTable.ownerId, userId));

  const notesRaw = await db
    .select({
      id: progressNotesTable.id,
      ideaId: progressNotesTable.ideaId,
      content: progressNotesTable.content,
      mood: progressNotesTable.mood,
      tags: progressNotesTable.tags,
      createdAt: progressNotesTable.createdAt,
      ideaTitle: ideasTable.title,
    })
    .from(progressNotesTable)
    .innerJoin(ideasTable, eq(progressNotesTable.ideaId, ideasTable.id))
    .where(eq(ideasTable.ownerId, userId))
    .orderBy(desc(progressNotesTable.createdAt));

  const weekNotes = notesRaw.filter(
    (n) => n.createdAt >= weekStart && n.createdAt < weekEnd,
  );

  const weekIdeas = ideas.filter(
    (i) => i.createdAt >= weekStart && i.createdAt < weekEnd,
  );

  const notesByIdea = new Map<number, number>();
  for (const note of notesRaw) {
    notesByIdea.set(note.ideaId, (notesByIdea.get(note.ideaId) ?? 0) + 1);
  }

  const topIdeas = ideas
    .map((idea) => ({
      id: idea.id,
      title: idea.title,
      status: idea.status,
      progressCount: notesByIdea.get(idea.id) ?? 0,
      nextStep: idea.nextStep,
    }))
    .sort((a, b) => b.progressCount - a.progressCount)
    .slice(0, 5);

  const allTags = Array.from(
    new Set(notesRaw.flatMap((n) => n.tags ?? [])),
  );

  res.json(
    GetWeeklyReviewResponse.parse({
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      tasksCompleted: ideas.filter(
        (i) => i.status === "shared" && i.updatedAt >= weekStart && i.updatedAt < weekEnd,
      ).length,
      notesWritten: weekNotes.length,
      ideasCreated: weekIdeas.length,
      topIdeas,
      recentNotes: weekNotes.slice(0, 10).map((n) => ({
        id: n.id,
        ideaId: n.ideaId,
        ideaTitle: n.ideaTitle,
        content: n.content,
        mood: n.mood,
        tags: n.tags ?? [],
        createdAt: n.createdAt,
      })),
      allTags,
    }),
  );
});

export default router;
