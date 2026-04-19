import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const SECRET = process.env.SESSION_SECRET ?? "dev-secret-change-me";
const COOKIE = "planora_token";

export interface SessionUser {
  id: number;
  email: string;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      sessionUser?: SessionUser;
    }
  }
}

export function sessionMiddleware(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE];
  if (token) {
    try {
      const payload = jwt.verify(token, SECRET) as unknown as SessionUser;
      req.sessionUser = { id: payload.id, email: payload.email, name: payload.name };
    } catch {
      // invalid or expired — leave sessionUser undefined
    }
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.sessionUser) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

export function setSessionCookie(res: Response, user: SessionUser) {
  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    SECRET,
    { expiresIn: "7d" }
  );
  res.cookie(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(COOKIE);
}
