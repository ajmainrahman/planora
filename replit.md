# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Runs on Replit for development and deploys to Vercel for production, using PostgreSQL with Drizzle ORM.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9-compatible project packages
- **API framework**: Express 5
- **Authentication**: Clerk-managed sign-in/sign-up with a production proxy mounted under `/api/__clerk`
- **Database**: PostgreSQL + Drizzle ORM; production is intended to use a Neon `DATABASE_URL`
- **Validation**: Zod (`zod/v4`), generated from OpenAPI
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (server bundle), Vite (frontend)

## Apps

- **Planora** (`artifacts/idea-journal`) — React/Vite web app at `/` with a public landing page, authenticated idea workspace at `/app`, auth pages at `/sign-in` and `/sign-up`, progress analytics, and public portfolio pages.
- **API Server** (`artifacts/api-server`) — shared Express API mounted at `/api`, runs on port 8080 locally.

## Idea Journal Data Model

- `ideas` — idea cards with a Clerk `owner_id`, title, description, status (`seed`, `planning`, `building`, `shared`), priority, category, next step, optional due/reminder dates, and timestamps.
- `progress_notes` — journal-style updates connected to ideas.

## Current Feature Surface

- Public landing page for signed-out visitors.
- Branded sign-in and sign-up pages.
- Authenticated dashboard with card-based idea tracking and clear stage sections.
- Per-user idea data isolation through `ideas.owner_id` filtering in private API routes.
- Daily and weekly progress summaries from real idea/progress activity (`/api/progress-summary`).
- Recent activity feed (`/api/activity`) and dashboard totals (`/api/dashboard`).
- Public portfolio page for ideas marked `shared` (`/share`, backed by `/api/share`).
- Public share page for a single shared idea (`/share/:id`, backed by `/api/share/:id`).
- Idea detail pages expose a public link once an idea is marked shared.

## Replit Development Configuration

- **Database**: Replit built-in PostgreSQL in dev; schema is pushed with `pnpm --filter @workspace/db run push`.
- **API Server port**: 8080 (set via `PORT=8080` in workflow command)
- **Frontend port**: 20671 (set via `PORT=20671` in workflow command)
- **Vite proxy**: `/api/*` in dev is proxied to `http://localhost:8080` so both services appear on the same origin.
- **Workflows**:
  - `Start application` — runs `pnpm --filter @workspace/idea-journal run dev` on port 20671
  - `API Server` — runs `pnpm --filter @workspace/api-server run dev` on port 8080

## Vercel + Neon Deployment

- **`vercel.json`**: Routes `/api/*` to the `api/[...path].ts` serverless function, everything else to the static frontend build.
- **Serverless function**: `api/[...path].ts` exports the Express app directly.
- **Database pool**: `max: 1` in serverless environments (detected via `VERCEL=1`) to avoid exhausting Neon connection limits across concurrent function instances.
- **Required production env vars in Vercel**: `DATABASE_URL`, `CLERK_SECRET_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_PUBLISHABLE_KEY`, and the automatically managed Clerk proxy URL if provided by the deployment environment.
- Run `pnpm --filter @workspace/db run push` against the Neon connection string before or during production setup so the `owner_id` column exists in Neon.

## Key Commands

- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/idea-journal run dev` — run Planora locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
