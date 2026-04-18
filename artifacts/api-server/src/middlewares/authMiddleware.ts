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

const defaultUser: SessionUser = { userId: 1, name: "Guest", email: "guest@planora.app" };

export function setSession(_res: Response, _user: SessionUser) {}
export function clearSession(_res: Response) {}
export function parseSession(_req: Request): SessionUser { return defaultUser; }
export function sessionMiddleware(req: Request, _res: Response, next: NextFunction) {
  req.sessionUser = defaultUser;
  next();
}
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  req.sessionUser = defaultUser;
  next();
}
