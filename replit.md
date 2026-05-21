# AI Sales Assistant

A web app for small SaaS sales teams that manages prospects, organizes outreach campaigns, and drafts personalized emails using AI.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite + Tailwind + shadcn/ui + Wouter + React Query
- AI: OpenAI via Replit AI Integrations (falls back to template-based generation)

## Where things live

- OpenAPI spec: `lib/api-spec/openapi.yaml`
- DB schema: `lib/db/src/schema/` (prospects, campaigns, emails, activity)
- API routes: `artifacts/api-server/src/routes/` (prospects, campaigns, emails, stats, health)
- AI email helper: `artifacts/api-server/src/lib/ai.ts`
- Frontend pages: `artifacts/sales-assistant/src/pages/`
- Generated hooks: `lib/api-client-react/src/generated/api.ts`
- Generated Zod schemas: `lib/api-zod/src/generated/api.ts`

## Architecture decisions

- OpenAPI-first: all types generated from `lib/api-spec/openapi.yaml`; never hand-write what codegen produces
- AI email generation uses `gpt-5.2` via Replit AI Integrations; gracefully falls back to tone-matched templates if unavailable
- Activity log table records all key events (prospect created, email sent, status changed) for the activity feed
- Sending an email auto-advances prospect status from "new" to "contacted"
- Email list endpoint joins prospect name/email/company at query time (denormalized in response for UI convenience)

## Product

- **Dashboard**: Stats overview (prospects, emails sent, open rate, drafts), recent activity feed, prospects by status chart
- **Prospects**: Full CRUD with status pipeline (new/contacted/replied/qualified/unqualified), AI email generation with tone selector
- **Campaigns**: Organize outreach with goals and status tracking; shows prospect count and emails sent per campaign
- **Emails**: View/edit drafts and sent emails across all campaigns; one-click send action

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `lib/api-spec/openapi.yaml`
- Always run `pnpm run typecheck:libs` after changing `lib/db/src/schema/` to rebuild the db package before typechecking server routes
- `UpdateProspectBody` / `UpdateCampaignBody` / `UpdateEmailBody` are the Zod validator names for PATCH bodies (not `ProspectUpdate` etc.)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
