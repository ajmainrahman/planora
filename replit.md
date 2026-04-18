# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Runs on Replit for development and deploys to production using PostgreSQL with Drizzle ORM.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9-compatible project packages
- **API framework**: Express 5
- **Authentication**: Custom session-based auth (bcryptjs password hashing, httpOnly cookie sessions). No Clerk.
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), generated from OpenAPI
- **Build**: esbuild (server bundle), Vite (frontend)

## Apps

- **Planora** (`artifacts/idea-journal`) — React/Vite web app. Public landing page at `/`, sign-in at `/sign-in`, sign-up at `/sign-up`, authenticated dashboard at `/dashboard`, idea detail at `/ideas/:id`, calendar at `/calendar`, weekly review at `/weekly-review`, public portfolio at `/share`.
- **API Server** (`artifacts/api-server`) — shared Express API mounted at `/api`, runs on port 8080 locally.

## Data Model

- `users` — id (serial), name, email (unique), password_hash, created_at
- `ideas` — idea cards with owner_id (text, the user's numeric ID as string), title, description, status (`seed`, `planning`, `building`, `shared`), priority, category, next step, optional due/reminder dates, recurrence fields, and timestamps.
- `progress_notes` — journal-style updates connected to ideas. Content stored as HTML (Tiptap). Has `tags text[]`, `mood`, and `prompt` fields.

## Auth Flow

- `POST /api/auth/register` — creates user, sets `planora_session` httpOnly cookie (base64-encoded JSON)
- `POST /api/auth/login` — verifies bcrypt password, sets session cookie
- `POST /api/auth/logout` — clears session cookie
- `GET /api/auth/me` — returns current user from session cookie
- Session middleware (`sessionMiddleware`) parses cookie on every request, sets `req.sessionUser`
- `requireAuth` middleware rejects unauthenticated requests with 401

## Key Features

- Public landing page with hero, step cards, sign-in/sign-up links
- Custom sign-in and sign-up pages (warm off-white background, teal button, PlanoraLogo icon)
- Authenticated dashboard: idea board, dashboard stats (streak, totals), activity feed
- Rich text editor (Tiptap) in progress journal with formatting toolbar
- Daily prompts in progress journal (rotates by day-of-month)
- Entry tagging (tags[]) and full-text search (`/api/search`, Cmd+K dialog)
- Journaling streak counter on dashboard
- Calendar view (`/calendar`) showing ideas by due date and progress notes by month
- Weekly review page (`/weekly-review`) with idea completion stats
- End-of-day review modal (accessible from dashboard header)
- Public portfolio (`/share`) for ideas marked `shared`
- Per-user data isolation through `owner_id` filtering

## PlanoraLogo Component

`artifacts/idea-journal/src/components/planora-logo.tsx` — teal (#2d7d6f) rounded rectangle with lightbulb SVG icon. Used in layout header and auth pages.

## Replit Development Configuration

- **Database**: Replit built-in PostgreSQL in dev; schema pushed with `pnpm --filter @workspace/db run push`.
- **API Server port**: 8080 (set via `PORT=8080` in workflow command)
- **Frontend port**: 20671 (set via `PORT=20671` in workflow command)
- **Vite proxy**: `/api/*` in dev proxied to `http://localhost:8080`
- **Workflows**:
  - `Start application` — runs `pnpm --filter @workspace/idea-journal run dev` on port 20671
  - `API Server` — runs `pnpm --filter @workspace/api-server run dev` on port 8080

## Key Commands

- `pnpm --filter @workspace/db run push` — push DB schema changes
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/idea-journal run dev` — run Planora locally
