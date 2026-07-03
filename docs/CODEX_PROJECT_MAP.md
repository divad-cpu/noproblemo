# Codex Project Map

## Project Identity

NoProblemo is a minimalistic, secure, modern web application for structured problem-solving, alone or in groups. It should help users define problems, understand context, collaborate, organize ideas and tasks, and produce final recommendations or action plans.

## Current Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- `next-intl`
- Supabase Auth/Postgres/RLS foundation
- Vercel deployment
- Domeneshop planned for domain/DNS

## Current Implemented State

Implemented:

- Locale-prefixed public app.
- Supported locales: `en`, `zh-CN`, `hi`, `es`, `ar`, `fr`, `bn`, `pt-BR`, `id`, `ur`, `nb`.
- RTL for `ar` and `ur`.
- Landing page.
- Guest solve workspace with localStorage persistence.
- Markdown copy/export for guest summary.
- Login prompt for unavailable guest save/collaboration actions.
- Support page.
- Email login/signup pages.
- Supabase auth callback and logout routes.
- Protected dashboard at `/[locale]/app`.
- Minimal challenge creation at `/[locale]/app/challenges/new`.
- Minimal saved challenge continuation page at `/[locale]/app/challenges/[id]`.
- Profile/settings page at `/[locale]/app/settings`.
- Guest import from `noproblemo.guestWorkspace.v1` to Supabase `challenges` and `challenge_sections`.
- Display name and preferred locale profile settings.
- Google and Apple OAuth provider start actions prepared through Supabase Auth.
- Supabase migration for profiles and core challenge tables.
- Owner-only RLS policies for Phase 4 tables.
- Supabase client/server helper scaffolding.
- Manual database types.

Not implemented:

- Full saved challenge workspace.
- Friends, invites, groups, messaging.
- Admin/settings.
- AI, payments, email sending, cron.

## Route Map

- `/`: redirected by `proxy.ts` to a locale route.
- `/[locale]`: landing page.
- `/[locale]/solve`: guest workspace.
- `/[locale]/support`: support/contact.
- `/[locale]/login`: email login and OAuth start.
- `/[locale]/signup`: email signup and OAuth start.
- `/[locale]/auth/callback`: Supabase auth callback.
- `/[locale]/auth/logout`: logout handler.
- `/[locale]/app`: protected dashboard.
- `/[locale]/app/challenges/new`: minimal protected challenge creation.
- `/[locale]/app/challenges/[id]`: protected continuation placeholder; full workspace is not implemented.
- `/[locale]/app/settings`: protected profile/settings.

## Data Model Map

Current:

- UI strings: `messages/*.json`.
- Guest draft: browser localStorage key `noproblemo.guestWorkspace.v1`.
- Supabase migration: `supabase/migrations/20260703190000_phase4_supabase_foundation.sql`.
- Typed helpers: `lib/supabase/`.
- Dashboard reads/writes use the authenticated Supabase session and Phase 4 tables.
- Guest import maps `problem`, `context`, `outcome`, `options`, and `nextStep` into `challenge_sections`.

Implemented Phase 4 tables:

- `profiles`
- `challenges`
- `challenge_sections`
- `challenge_solutions`
- `challenge_tasks`

Planned data concepts:

- `friendships`
- `groups`
- `group_memberships`
- `group_invites`
- `challenge_collaborators`
- `messages`

See `DATABASE_SCHEMA.md` before any future migration work.

## Security Model Map

Current:

- Guest data is local-only.
- Supabase Auth email UI/actions exist.
- Google and Apple OAuth starts exist, but require provider setup before production use.
- Dashboard, minimal create, profile update, and guest import use server-side session checks and RLS.
- Phase 4 migration enables RLS for `profiles`, `challenges`, `challenge_sections`, `challenge_solutions`, and `challenge_tasks`.
- Phase 4 RLS is owner-only and must still be verified in Supabase.
- No service-role helper exists.

Planned:

- Phase 7 full challenge workspace.
- Later group/friend/message policies.

Rules:

- Users can access only owned challenges in the Phase 4 schema.
- Group invites must require accept/decline when implemented.
- Private messages and challenge content must not be public.
- Service role key never reaches browser code.

See `SECURITY.md` before implementing auth, database writes, or messaging.

## MVP Map

1. Landing page: implemented.
2. Authentication: implemented.
3. Dashboard: implemented.
4. Create and save a challenge: minimal create/list/import implemented; full workspace planned.
5. Basic challenge workspace: guest-only implemented; saved workspace planned for Phase 7.
6. Friends/invites: planned.
7. Groups: planned.
8. Simple messaging: planned.
9. Basic admin/settings: planned.
10. Deployment: Vercel works; security hardening ongoing.

## Future Feature Map

- AI-assisted problem analysis
- Solution scoring
- Templates
- PDF/export reports
- Real-time collaboration
- Comments
- Public/private challenge settings
- Organization accounts
- Voting
- Task assignment
- Calendar/deadlines
- Knowledge library

## Rules For Future Codex Work

- Read `CURRENT_STATE.md` and this file first.
- Inspect before editing.
- Implement only the named phase.
- Do not rebuild from scratch.
- Do not duplicate existing files/routes.
- Keep changes small and verifiable.
- Preserve stack and visual direction.
- Protect secrets and private data.
- Keep planned features marked as planned until code exists.
- Update `CURRENT_STATE.md` after each phase.
- Run validation and report changed files.

## Recommended Prompt Pattern

Use this shape:

```text
You are continuing NoProblemo.

Read CURRENT_STATE.md and docs/CODEX_PROJECT_MAP.md first.

Implement Phase X only: [phase name].

Before changing files:
1. Inspect the current repo.
2. Report what exists.
3. Report what is missing for this phase.
4. Then implement only this phase.

In scope:
- ...

Out of scope:
- ...

Update docs:
- CURRENT_STATE.md
- docs/CODEX_PROJECT_LOG.md
- docs/CHANGELOG.md

Run:
npm run lint
npm run typecheck
npm run build

Finish with changed files, validation results, security impact, and remaining unknowns.
```
