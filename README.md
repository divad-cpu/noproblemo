# NoProblemo

NoProblemo is a Next.js App Router project prepared for incremental product development. Phase 3 adds the public landing page, support page, and a local-only guest problem-solving workspace.

## Current Phase

Phase 3 is complete when public routes, guest mode, locale routing, linting, type checking, and production build all pass. Cloud persistence and authentication remain intentionally deferred.

Not included in Phase 3:

- Real authentication
- Supabase database migrations
- Google or Apple login
- Payments
- AI features
- Resend email
- Vercel Cron
- Cloud project saving
- Real collaboration

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

## Public Routes

- `/[locale]` public landing page
- `/[locale]/solve` guest problem-solving workspace
- `/[locale]/support` support/contact page
- `/[locale]/login` placeholder login route
- `/[locale]/signup` placeholder account route

## Guest Mode

Guest users can start a problem-solving session without login. Drafts are stored in local browser storage under `noproblemo.guestWorkspace.v1` and are not sent to Supabase. Guests can copy or export a Markdown summary.

Actions that require cloud saving or collaboration show a login prompt instead of performing the action.

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
