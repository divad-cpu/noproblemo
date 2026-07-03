# NoProblemo

NoProblemo is a Next.js App Router project prepared for incremental product development. Phase 2 establishes internationalization foundation only: locale routing, message files, translated UI text, and RTL handling.

## Current Phase

Phase 2 is complete when the repository has locale-prefixed routes and validates with linting, type checking, and production build. Feature work is intentionally deferred.

Not included in Phase 2:

- Authentication or login UI
- Supabase database migrations
- Google or Apple login
- Payments
- AI features
- Resend email
- Vercel Cron
- Full guest workspace

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- `next-intl`
- Supabase project folder for future backend work
- Vercel deployment

## Internationalization

Supported locales:

- `en`
- `zh-CN`
- `hi`
- `es`
- `ar`
- `fr`
- `bn`
- `pt-BR`
- `id`
- `ur`
- `nb`

Routes are locale-prefixed, for example `/en`, `/nb`, `/es`, `/fr`, `/ar`, and `/ur`. The root route `/` redirects to a locale using `next-intl` middleware detection with `en` as the fallback.

Arabic (`ar`) and Urdu (`ur`) render with `dir="rtl"`. All other supported locales render with `dir="ltr"`.

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
- Keep the next phase limited to the explicitly requested scope.
