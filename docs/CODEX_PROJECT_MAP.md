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
- Group messages and challenge discussion messages.
- Private notifications page.
- Basic group/challenge activity lists.
- Protected admin overview.
- Protected admin settings checklist.
- Admin role protection using `profiles.role = 'admin'`.
- Admin audit-log storage and admin-only overview RPCs.
- Phase 11 responsive/accessibility/security/deployment polish.
- Google and Apple OAuth provider start actions prepared through Supabase Auth.
- Supabase migration for profiles and core challenge tables.
- Phase 8 migration for friends, groups, profile search, group challenge links, and group-aware RLS.
- Phase 9 migration for messages, notifications, activity events, triggers, and RLS.
- Supabase client/server helper scaffolding.
- Manual database types.

Not implemented:

- AI, payments, email sending, cron.

## Verification Documents

- `docs/PRODUCTION_VERIFICATION.md`: production verification checklist for Supabase, Vercel, Domeneshop, Auth providers, environment variables, support email, launch blockers, and post-launch monitoring.
- `docs/SUPABASE_VERIFICATION.md`: manual Supabase migration, RLS, trigger, RPC, group access, message/notification/activity, and admin verification checklist.
- `docs/MANUAL_TEST_PLAN.md`: three-user app test plan for guest mode, auth, dashboard, workspace, friends/groups, messages, notifications, activity, admin, locales, RTL, accessibility, and responsive layouts.
- `docs/LAUNCH_READINESS_REPORT.md`: current launch readiness status, implemented/not implemented scope, blockers, recommendations, and verification evidence target.

## Route Map

- `/`: redirected by `proxy.ts` to a locale route.
- `/[locale]`: landing page.
- `/[locale]/solve`: guest workspace.
- `/[locale]/support`: support/contact.
- `/[locale]/login`: email login and OAuth start.
- `/[locale]/signup`: email signup and OAuth start.
- `/[locale]/forgot-password`: password reset request.
- `/[locale]/reset-password`: password reset completion after callback recovery session exchange.
- `/[locale]/auth/callback`: Supabase auth callback.
- `/[locale]/auth/logout`: logout handler.
- `/[locale]/app`: protected dashboard.
- `/[locale]/app/challenges/new`: minimal protected challenge creation.
- `/[locale]/app/challenges/[id]`: protected saved challenge workspace.
- `/[locale]/app/friends`: protected friends page.
- `/[locale]/app/groups`: protected groups list and pending invitations.
- `/[locale]/app/groups/new`: protected group creation.
- `/[locale]/app/groups/[id]`: protected group detail, member management, invitations, and linked challenges.
- `/[locale]/app/notifications`: protected private notifications.
- `/[locale]/app/admin`: protected admin overview.
- `/[locale]/app/admin/settings`: protected admin readiness/settings checklist.
- `/[locale]/app/settings`: protected profile/settings.

## Data Model Map

Current:

- UI strings: `messages/*.json`.
- Guest draft: browser localStorage key `noproblemo.guestWorkspace.v1`.
- Supabase migration: `supabase/migrations/20260703190000_phase4_supabase_foundation.sql`.
- Supabase migration: `supabase/migrations/20260703210000_phase8_friends_groups.sql`.
- Supabase migration: `supabase/migrations/20260703220000_phase9_messaging_notifications_activity.sql`.
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
- Group and challenge messages use `messages`.
- Private user notifications use `notifications`.
- Basic group/challenge activity uses `activity_events`.
- Admin audit metadata uses `admin_audit_log`.
- Admin overview data uses admin-only RPCs for aggregate counts and limited metadata.

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
- `messages`
- `notifications`
- `activity_events`
- `admin_audit_log`

Planned data concepts:

- Organization/account records if later phases require them

See `DATABASE_SCHEMA.md` before any future migration work.

## Security Model Map

Current:

- Guest data is local-only.
- Supabase Auth email UI/actions exist.
- Google and Apple OAuth starts exist, but require provider setup before production use.
- Email confirmation, OAuth, and password recovery use locale-specific `/[locale]/auth/callback` routes.
- Password changes and reset completions use Supabase Auth and do not store password values in application tables.
- Account deletion uses a server-only Supabase admin helper and deletes only the current authenticated user after explicit confirmation.
- Dashboard, minimal create, profile update, and guest import use server-side session checks and RLS.
- Phase 4 migration enables RLS for `profiles`, `challenges`, `challenge_sections`, `challenge_solutions`, and `challenge_tasks`.
- Phase 8 migration enables RLS for friends/groups tables and extends challenge RLS for explicitly linked group challenges.
- Phase 9 migration enables RLS for messages, notifications, and activity events.
- Friendships alone do not grant challenge access.
- Group invitation acceptance is required before membership access is granted.
- Group challenge viewers should read but not edit linked challenges.
- Group messages are visible only to group members.
- Challenge messages are visible only to users with challenge read access.
- Notifications are visible only to recipients.
- Activity events are visible only through group/challenge access.
- Admin pages require authenticated users with `profiles.role = 'admin'`.
- Admin RPCs use `public.is_admin(auth.uid())`.
- `admin_audit_log` is readable only by admins and has no authenticated write grant.
- Normal users cannot self-promote through profile settings or authenticated self role updates.
- RLS migrations must still be verified in Supabase.
- `lib/supabase/admin.ts` is a server-only service-role helper used only for current-user account deletion. It must never be imported into Client Components.

Planned:

- Controlled Supabase/Vercel production verification with explicit approval before remote changes.
- Later admin actions beyond the read-only MVP.

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
8. Simple messaging: implemented locally.
9. Basic admin/settings: implemented locally.
10. Deployment: Vercel direction documented; controlled production verification remains required.

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
- During production verification, ask before applying remote migrations, changing Vercel settings, or changing DNS.

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
