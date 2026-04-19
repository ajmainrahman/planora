import { Router } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { clearSession, parseSession, requireAuth, setSession } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body as { name?: string; email?: string; password?: string };
  if (!name || !email || !password) {
    res.status(400).json({ error: "Name, email and password are required." });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters." });
    return;
  }
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "An account with that email already exists." });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db.insert(usersTable).values({ name: name.trim(), email: email.toLowerCase(), passwordHash }).returning();
  await setSession(res, { userId: user.id, name: user.name, email: user.email });
  res.status(201).json({ id: user.id, name: user.name, email: user.email });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
  if (!user) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }
  await setSession(res, { userId: user.id, name: user.name, email: user.email });
  res.json({ id: user.id, name: user.name, email: user.email });
});

router.post("/logout", async (_req, res) => {
  clearSession(res);
  res.json({ ok: true });
});

router.get("/me", async (req, res) => {
  const session = await parseSession(req);
  if (!session) {
    res.status(401).json({ error: "Not signed in." });
    return;
  }
  res.json(session);
});

export default router;
