# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Runs on Replit for development and deploys to Vercel for production, using Neon PostgreSQL.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: Neon PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle for standalone server), Vite (frontend)

## Apps

- **Planora** (`artifacts/idea-journal`) — React/Vite web app at `/` for planning ideas, tracking statuses, filtering the planning board, and writing progress notes.
- **API Server** (`artifacts/api-server`) — shared Express API mounted at `/api`, runs on port 8080 locally.

## Idea Journal Data Model

- `ideas` — idea cards with title, description, status (`seed`, `planning`, `building`, `shared`), priority, category, next step, and timestamps.
- `progress_notes` — journal-style updates connected to ideas.

## Replit Development Configuration

- **Database**: Replit built-in PostgreSQL in dev, Neon in production.
- **API Server port**: 8080 (set via `PORT=8080` in workflow command)
- **Frontend port**: 20671 (set via `PORT=20671` in workflow command)
- **Vite proxy**: `/api/*` in dev is proxied to `http://localhost:8080` so both services appear on the same origin.
- **Workflows**:
  - `Start application` — runs `pnpm --filter @workspace/idea-journal run dev` on port 20671
  - `API Server` — runs `pnpm --filter @workspace/api-server run dev` on port 8080

## Vercel Deployment

- **`vercel.json`**: Routes `/api/*` to the `api/[...path].ts` serverless function, everything else to the static frontend build.
- **Serverless function**: `api/[...path].ts` exports the Express app directly.
- **Database pool**: `max: 1` in serverless environments (detected via `VERCEL=1`) to avoid exhausting Neon connections across concurrent function instances.
- **Logger**: Uses plain pino (no pino-pretty worker thread) in `NODE_ENV=production`.
- **Required Vercel env vars**: `DATABASE_URL` (Neon connection string) — already set via Neon–Vercel integration.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/idea-journal run dev` — run Idea Journal locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
