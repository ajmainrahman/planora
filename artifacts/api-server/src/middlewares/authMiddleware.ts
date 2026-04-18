import type { Request, Response, NextFunction } from "express";

export interface SessionUser {
  userId: number;
  name: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      sessionUser?: SessionUser;
    }
  }
}

const SESSION_COOKIE = "planora_session";

export function setSession(res: Response, user: SessionUser) {
  const payload = Buffer.from(JSON.stringify(user)).toString("base64");
  res.cookie(SESSION_COOKIE, payload, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

export function clearSession(res: Response) {
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}

export function parseSession(req: Request): SessionUser | null {
  try {
    const raw = req.cookies?.[SESSION_COOKIE];
    if (!raw) return null;
    return JSON.parse(Buffer.from(raw, "base64").toString("utf8")) as SessionUser;
  } catch {
    return null;
  }
}

export function sessionMiddleware(req: Request, _res: Response, next: NextFunction) {
  req.sessionUser = parseSession(req) ?? undefined;
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.sessionUser) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}
