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
- Saved challenge workspace at `/[locale]/app/challenges/[id]`.
- Profile/settings page at `/[locale]/app/settings`.
- Guest import from `noproblemo.guestWorkspace.v1` to Supabase `challenges` and `challenge_sections`.
- Display name and preferred locale profile settings.
- Seven-step problem-solving workflow.
- Editable challenge sections, solutions, tasks, final recommendation, summary, and Markdown export.
- Friends page with request send, accept, decline, cancel, and remove friend actions.
- Groups pages with group creation, invitations, roles, member removal, and explicit group challenge links.
- Google and Apple OAuth provider start actions prepared through Supabase Auth.
- Supabase migration for profiles and core challenge tables.
- Phase 8 migration for friends, groups, profile search, group challenge links, and group-aware RLS.
- Supabase client/server helper scaffolding.
- Manual database types.

Not implemented:

- Messaging, notifications, and activity.
- Admin panel.
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
- `/[locale]/app/challenges/[id]`: protected saved challenge workspace.
- `/[locale]/app/friends`: protected friends page.
- `/[locale]/app/groups`: protected groups list and pending invitations.
- `/[locale]/app/groups/new`: protected group creation.
- `/[locale]/app/groups/[id]`: protected group detail, member management, invitations, and linked challenges.
- `/[locale]/app/settings`: protected profile/settings.

## Data Model Map

Current:

- UI strings: `messages/*.json`.
- Guest draft: browser localStorage key `noproblemo.guestWorkspace.v1`.
- Supabase migration: `supabase/migrations/20260703190000_phase4_supabase_foundation.sql`.
- Supabase migration: `supabase/migrations/20260703210000_phase8_friends_groups.sql`.
- Typed helpers: `lib/supabase/`.
- Dashboard reads/writes use the authenticated Supabase session and Phase 4 tables.
- Guest import maps `problem`, `context`, `outcome`, `options`, and `nextStep` into `challenge_sections`.
- Workspace saves challenge details to `challenges`.
- Workspace saves section text to `challenge_sections`.
- Workspace saves possible solutions to `challenge_solutions`.
- Workspace saves tasks/actions to `challenge_tasks`.
- Friend requests use `friend_requests`.
- Friendships use canonical rows in `friendships`.
- Groups use `groups`, `group_members`, and `group_invitations`.
- Group challenge access uses explicit `group_challenges` links.
- Profile discovery uses authenticated RPC `search_profiles(search_term)` and exposes only `id`, `display_name`, and `avatar_url`.

Implemented Phase 4 tables:

- `profiles`
- `challenges`
- `challenge_sections`
- `challenge_solutions`
- `challenge_tasks`
- `friend_requests`
- `friendships`
- `groups`
- `group_members`
- `group_invitations`
- `group_challenges`

Planned data concepts:

- `messages`
- `notifications`
- `activity_events`

See `DATABASE_SCHEMA.md` before any future migration work.

## Security Model Map

Current:

- Guest data is local-only.
- Supabase Auth email UI/actions exist.
- Google and Apple OAuth starts exist, but require provider setup before production use.
- Dashboard, minimal create, profile update, and guest import use server-side session checks and RLS.
- Phase 4 migration enables RLS for `profiles`, `challenges`, `challenge_sections`, `challenge_solutions`, and `challenge_tasks`.
- Phase 8 migration enables RLS for friends/groups tables and extends challenge RLS for explicitly linked group challenges.
- Friendships alone do not grant challenge access.
- Group invitation acceptance is required before membership access is granted.
- Group challenge viewers should read but not edit linked challenges.
- RLS migrations must still be verified in Supabase.
- No service-role helper exists.

Planned:

- Phase 9 messaging, notifications, and activity.
- Later admin policies.

Rules:

- Users can access owned private challenges and explicitly linked group challenges allowed by RLS.
- Group invites require accept/decline.
- Private messages and challenge content must not be public.
- Service role key never reaches browser code.

See `SECURITY.md` before implementing auth, database writes, or messaging.

## MVP Map

1. Landing page: implemented.
2. Authentication: implemented.
3. Dashboard: implemented.
4. Create and save a challenge: implemented.
5. Basic challenge workspace: implemented.
6. Friends/invites: implemented locally.
7. Groups: implemented locally.
8. Simple messaging: planned for Phase 9.
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
