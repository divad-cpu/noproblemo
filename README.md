# NoProblemo

NoProblemo is a Next.js App Router project prepared for incremental product development. Phase 1 establishes the project foundation only: documentation, scripts, environment templates, and a minimal public page.

## Current Phase

Phase 1 is complete when the repository has a clean foundation and validates with linting, type checking, and production build. Feature work is intentionally deferred.

Not included in Phase 1:

- Authentication or login UI
- Supabase database migrations
- Google or Apple login
- Payments
- AI features
- Resend email
- Vercel Cron
- Internationalization packages such as `next-intl`

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase project folder for future backend work
- Vercel deployment

## Local Setup

Install dependencies:

```bash
npm install
```

Create local environment variables from the safe template:

```bash
cp .env.local.example .env.local
```

Do not commit `.env.local` or any real secret values.

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Validation

Run these before merging changes:

```bash
npm run lint
npm run typecheck
npm run build
```

## Project Documents

- `PROJECT_BRIEF.md`
- `ARCHITECTURE.md`
- `DATABASE_SCHEMA.md`
- `SECURITY.md`
- `UX_UI_GUIDE.md`
- `ROADMAP.md`
- `DEPLOYMENT.md`
- `AI_READY.md`
- `docs/CODEX_PROJECT_LOG.md`
- `docs/NEXT_CODEX_PROMPT.md`
- `docs/CHANGELOG.md`

## Repository Hygiene

- Keep `.env*` files ignored except committed templates.
- Read `AGENTS.md` before making code changes.
- Read the installed Next.js docs in `node_modules/next/dist/docs/` before using Next APIs.
- Keep Phase 1 changes limited to foundation work.
