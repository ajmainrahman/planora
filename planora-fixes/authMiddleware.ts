import type { Request, Response, NextFunction } from "express";
import { SignJWT, jwtVerify } from "jose";

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

const COOKIE_NAME = "planora_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET ?? "planora-dev-secret-change-in-production";
  return new TextEncoder().encode(secret);
}

export async function setSession(res: Response, user: SessionUser) {
  const secret = getSecret();
  const token = await new SignJWT({ userId: user.userId, name: user.name, email: user.email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE * 1000,
    path: "/",
  });
}

export function clearSession(res: Response) {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

export async function parseSession(req: Request): Promise<SessionUser | null> {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      userId: payload.userId as number,
      name: payload.name as string,
      email: payload.email as string,
    };
  } catch {
    return null;
  }
}

export async function sessionMiddleware(req: Request, _res: Response, next: NextFunction) {
  req.sessionUser = (await parseSession(req)) ?? undefined;
  next();
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = await parseSession(req);
  if (!user) {
    res.status(401).json({ error: "Not signed in." });
    return;
  }
  req.sessionUser = user;
  next();
}
