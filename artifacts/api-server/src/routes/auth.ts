import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { setSession, clearSession, requireAuth } from "../middlewares/authMiddleware.js";

const router = Router();

// GET /api/auth/me
router.get("/me", requireAuth, (req, res) => {
  res.json(req.sessionUser);
});

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body as {
      name?: string;
      email?: string;
      password?: string;
    };
    if (!name || !email || !password) {
      res.status(400).json({ error: "name, email and password are required" });
      return;
    }
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }
    const password_hash = await bcrypt.hash(password, 12);
    const [user] = await db
      .insert(usersTable)
      .values({ name, email, password_hash })
      .returning({ id: usersTable.id, email: usersTable.email, name: usersTable.name });
    await setSession(res, { userId: user.id, name: user.name, email: user.email });
    res.status(201).json({ id: user.id, email: user.email, name: user.name });
  } catch (err) {
    console.error("register error", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    await setSession(res, { userId: user.id, name: user.name, email: user.email });
    res.json({ id: user.id, email: user.email, name: user.name });
  } catch (err) {
    console.error("login error", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// POST /api/auth/logout
router.post("/logout", (_req, res) => {
  clearSession(res);
  res.json({ ok: true });
});

export default router;
