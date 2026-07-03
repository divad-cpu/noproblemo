# NoProblemo

NoProblemo is a Next.js App Router project prepared for incremental product development. Phase 7 adds the protected saved challenge workspace.

## Current Phase

Phase 7 is complete when the protected challenge workspace, section editing, solution editing, task editing, Markdown export, documentation, linting, type checking, and production build all pass.

Not included in Phase 7:

- Friends and groups
- Messaging
- Notifications
- Admin
- Payments
- AI features
- Resend email
- Vercel Cron
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
- `/[locale]/app` protected dashboard
- `/[locale]/app/challenges/new` minimal protected challenge creation
- `/[locale]/app/challenges/[id]` protected saved challenge workspace
- `/[locale]/app/settings` protected profile/settings page

## Guest Mode

Guest users can start a problem-solving session without login. Drafts are stored in local browser storage under `noproblemo.guestWorkspace.v1`. Guests can copy or export a Markdown summary.

Actions that require cloud saving or collaboration show a login prompt instead of performing the action.

Logged-in users can import the current guest draft from the dashboard. Import creates a private draft challenge and related challenge sections through the authenticated Supabase session, then marks the local draft with `importedChallengeId` to avoid repeated imports from the same browser draft.

## Authentication

Email login/signup uses Supabase Auth. Google and Apple login buttons are prepared through Supabase OAuth, but they require provider configuration in Supabase, Google Cloud, and Apple Developer before production use.

The Phase 4 database trigger is expected to create `profiles` rows after signup, but it still needs verification after the migration is applied to the real Supabase project.

## Dashboard, Workspace And Settings

The dashboard lists the authenticated user's saved challenges through Supabase RLS, shows empty/error states, and provides a minimal create challenge action.

The saved challenge workspace supports the seven-step problem-solving workflow, editable challenge sections, possible solutions, pros/cons, risk/effort/impact scoring, tasks/actions, final recommendation, summary, and Markdown copy/download export.

Profile settings can update `display_name` and `preferred_locale`. The preferred locale is saved to `profiles.preferred_locale`; current route language still follows the URL until routing preference sync is added later.

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
