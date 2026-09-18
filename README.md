# Sales Outreach AI

Sales Outreach AI is a lightweight outreach workspace for SaaS sales teams. It combines prospect management, campaign tracking, AI-assisted email drafting, and SMTP delivery in one dashboard.

## What it does

The app helps a sales team move from a new prospect to a personalized outreach email:

1. Add and organize prospects in a status pipeline.
2. Group outreach work into campaigns.
3. Generate a personalized email draft with a selectable tone.
4. Review or edit the draft.
5. Send the message through an SMTP provider.
6. Track sent email activity and prospect status changes.

## Features

- **Dashboard** — Prospect, email, campaign, and activity summaries.
- **Prospect management** — Create, edit, delete, search, and filter prospects.
- **Prospect pipeline** — Track `new`, `contacted`, `replied`, `qualified`, and `unqualified` states.
- **AI email drafting** — Generate subject lines and plain-text email bodies from prospect details.
- **Tone selection** — Choose professional, friendly, concise, or persuasive copy.
- **Fallback email templates** — Continue drafting emails when the AI integration is unavailable.
- **Campaign management** — Organize outreach by goal and campaign status.
- **Email workspace** — Create, review, edit, and search email drafts and sent messages.
- **SMTP delivery** — Send emails through a configured SMTP provider such as Brevo.
- **Delivery state tracking** — Mark an email as `sent` only after SMTP delivery succeeds.
- **Activity feed** — Record prospect creation, email sends, and status changes.
- **Product catalog seeds** — Initialize Avion Outreach, Avion CRM, and Avion Analytics products on startup.
- **SQLite persistence** — Store application data locally in `avion.db`.

## Tech stack

- **Frontend:** React 19, Vite, TypeScript, Tailwind CSS, shadcn/ui, Wouter, TanStack React Query
- **Backend:** Node.js, Express 5, TypeScript
- **Database:** SQLite with `better-sqlite3`, Drizzle ORM, and Drizzle Kit
- **Validation:** Zod and generated OpenAPI schemas
- **API contracts:** OpenAPI with Orval-generated React Query hooks and Zod validators
- **Email:** Nodemailer over SMTP
- **AI:** OpenAI-compatible API through Replit AI Integrations, with local template fallback
- **Workspace:** pnpm monorepo

## Project structure

```text
artifacts/
  api-server/          Express API and SMTP delivery
  sales-assistant/     React web application
  mockup-sandbox/      Component preview and canvas workspace

lib/
  api-spec/            OpenAPI document and code generation
  api-client-react/    Generated typed React API client
  api-zod/             Generated request and response validators
  db/                  SQLite connection and Drizzle schemas

avion.db               Local SQLite database; ignored by Git
```

## Requirements

- Node.js 24 or a compatible current Node.js release
- pnpm
- SMTP credentials for sending real email
- Optional OpenAI-compatible AI integration credentials for AI-generated copy

## Run locally

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

The API requires a `PORT` value. SMTP variables are required only when you want to send real email.

```bash
export PORT=8080

# Required for email sending
export SMTP_HOST=smtp-relay.brevo.com
export SMTP_PORT=587
export SMTP_USER=your-smtp-username
export SMTP_PASS=your-smtp-password-or-key
```

For AI-assisted email generation, configure the OpenAI-compatible Replit integration variables when running outside the managed Replit environment:

```bash
export AI_INTEGRATIONS_OPENAI_BASE_URL=your-openai-compatible-base-url
export AI_INTEGRATIONS_OPENAI_API_KEY=your-api-key
```

Never commit credentials or put them in source control. Use the workspace Secrets manager or a local, ignored environment file.

### 3. Start the API server

```bash
pnpm --filter @workspace/api-server run dev
```

The API listens on `http://localhost:8080`. The health endpoint is:

```text
http://localhost:8080/api/healthz
```

The first startup creates the SQLite schema and seeds the product catalog. The local database is stored at the repository root as `avion.db`.

### 4. Start the web application

In a second terminal:

```bash
export PORT=23103
export BASE_PATH=/
pnpm --filter @workspace/sales-assistant run dev
```

The Vite development server listens on `http://localhost:23103`.

The managed Replit setup routes `/api` to the API artifact. When running the frontend outside Replit, place the frontend and API behind a local reverse proxy that forwards `/api/*` requests to `http://localhost:8080`, or use the API directly for backend development.

## Useful commands

Run the full typecheck:

```bash
pnpm run typecheck
```

Build all packages:

```bash
pnpm run build
```

Build the API:

```bash
pnpm --filter @workspace/api-server run build
```

Build the frontend:

```bash
pnpm --filter @workspace/sales-assistant run build
```

Regenerate the typed API client after changing the OpenAPI contract:

```bash
pnpm --filter @workspace/api-spec run codegen
```

Push SQLite schema changes during development:

```bash
pnpm --filter @workspace/db run push
```

Use `push-force` only when you intentionally accept the schema changes it applies:

```bash
pnpm --filter @workspace/db run push-force
```

## API areas

The API is served under `/api` and includes:

- `/api/healthz` — health check
- `/api/prospects` — prospect CRUD and AI email generation
- `/api/campaigns` — campaign CRUD and campaign metrics
- `/api/emails` — email draft and sent-message management
- `/api/stats` — dashboard statistics
- `/api/activity` — activity feed data

The source of truth for request and response shapes is `lib/api-spec/openapi.yaml`.

## Email delivery behavior

Sending an email follows this sequence:

1. Create or select an email draft.
2. Deliver it through the configured SMTP server.
3. Mark the database row as `sent` and record `sent_at` only after delivery succeeds.
4. Record the send in the activity feed.
5. Move a `new` prospect to `contacted`.

If SMTP configuration or delivery fails, the draft remains a draft and the API returns an error instead of reporting a successful send.

## Data and security notes

- `avion.db` is local application data and is ignored by Git.
- Do not commit SMTP passwords, API keys, or other credentials.
- The default product seed operation is idempotent.
- Generated API files should be regenerated from the OpenAPI specification rather than edited by hand.

## License

This project is licensed under the MIT License.