import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { user as users } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import {
  sessionMiddleware,
  requireAuth,
  setSessionCookie,
  clearSessionCookie,
} from "../middleware/session.js";

const router = Router();

router.get("/me", sessionMiddleware, requireAuth, (req, res) => {
  const u = req.sessionUser!;
  res.json({ id: u.id, email: u.email, name: u.name });
});

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
    setSessionCookie(res, user);
    res.status(201).json({ id: user.id, email: user.email, name: user.name });
  } catch (err) {
    console.error("register error", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

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
    setSessionCookie(res, { id: user.id, email: user.email, name: user.name });
    res.json({ id: user.id, email: user.email, name: user.name });
  } catch (err) {
    console.error("login error", err);
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/logout", (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

export default router;
