# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Apps

- **Planora** (`artifacts/idea-journal`) — React/Vite web app at `/` for planning ideas, tracking statuses, filtering the planning board, and writing progress notes.
- **API Server** (`artifacts/api-server`) — shared Express API mounted at `/api`.

## Idea Journal Data Model

- `ideas` — idea cards with title, description, status (`seed`, `planning`, `building`, `shared`), priority, category, next step, and timestamps.
- `progress_notes` — journal-style updates connected to ideas.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/idea-journal run dev` — run Idea Journal locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
