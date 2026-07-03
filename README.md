# NoProblemo

NoProblemo is a Next.js App Router project prepared for incremental product development. Phase 5 adds Supabase authentication foundation before dashboard, guest import, and cloud saving.

## Current Phase

Phase 5 is complete when email auth, OAuth provider starts, logout, a protected route boundary, documentation, linting, type checking, and production build all pass. Dashboard, guest import, and cloud-saving UI remain intentionally deferred.

Not included in Phase 5:

- Dashboard
- Guest import after login
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
- Supabase Auth and database/RLS foundation
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
- `/[locale]/login` email login and Google/Apple OAuth start route
- `/[locale]/signup` email signup and Google/Apple OAuth start route
- `/[locale]/auth/callback` Supabase auth callback
- `/[locale]/auth/logout` logout handler
- `/[locale]/app` protected placeholder route, not the full dashboard

## Guest Mode

Guest users can start a problem-solving session without login. Drafts are stored in local browser storage under `noproblemo.guestWorkspace.v1` and are not sent to Supabase. Guests can copy or export a Markdown summary.

Actions that require cloud saving or collaboration show a login prompt instead of performing the action.

## Authentication

Email login/signup uses Supabase Auth. Google and Apple login buttons are prepared through Supabase OAuth, but they require provider configuration in Supabase, Google Cloud, and Apple Developer before production use.

The Phase 4 database trigger is expected to create `profiles` rows after signup, but it still needs verification after the migration is applied to the real Supabase project.

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

- `CURRENT_STATE.md`
- `PROJECT_BRIEF.md`
- `ARCHITECTURE.md`
- `DATABASE_SCHEMA.md`
- `SECURITY.md`
- `UX_UI_GUIDE.md`
- `ROADMAP.md`
- `DEPLOYMENT.md`
- `AI_READY.md`
- `docs/CODEX_PROJECT_MAP.md`
- `docs/PHASE_HANDOFF_TEMPLATE.md`
- `docs/CODEX_PROJECT_LOG.md`
- `docs/NEXT_CODEX_PROMPT.md`
- `docs/CHANGELOG.md`

## Repository Hygiene

- Keep `.env*` files ignored except committed templates.
- Read `CURRENT_STATE.md`, `docs/CODEX_PROJECT_MAP.md`, and `AGENTS.md` before making code changes.
- Read the installed Next.js docs in `node_modules/next/dist/docs/` before using Next APIs.
- Keep the next phase limited to the explicitly requested scope.
