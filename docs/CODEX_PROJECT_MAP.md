# Codex Project Map

## Project Identity

NoProblemo is a minimalistic, secure, modern web application for structured problem-solving, alone or in groups. It should help users define problems, understand context, collaborate, organize ideas and tasks, and produce final recommendations or action plans.

## Current Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- `next-intl`
- Supabase planned for auth/database/RLS
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
- Placeholder login/signup pages.

Not implemented:

- Real authentication.
- Dashboard.
- Supabase migrations or app data access.
- Cloud saved challenges.
- Friends, invites, groups, messaging.
- Admin/settings.
- AI, payments, email sending, cron.

## Route Map

- `/`: redirected by `proxy.ts` to a locale route.
- `/[locale]`: landing page.
- `/[locale]/solve`: guest workspace.
- `/[locale]/support`: support/contact.
- `/[locale]/login`: login placeholder.
- `/[locale]/signup`: account placeholder.

## Data Model Map

Current:

- UI strings: `messages/*.json`.
- Guest draft: browser localStorage key `noproblemo.guestWorkspace.v1`.
- Supabase: config exists, no application tables.

Planned data concepts:

- `profiles`
- `challenges`
- `challenge_sections`
- `challenge_solutions`
- `tasks`
- `friendships`
- `groups`
- `group_memberships`
- `group_invites`
- `challenge_collaborators`
- `messages`

See `DATABASE_SCHEMA.md` before any migration work.

## Security Model Map

Current:

- No private cloud data exists.
- Guest data is local-only.
- No real auth exists.

Planned:

- Supabase Auth.
- RLS on every application table.
- Users can access only owned challenges or challenges shared through accepted memberships/collaborator grants.
- Group invites require accept/decline.
- Private messages and challenge content are not public.
- Service role key never reaches browser code.

See `SECURITY.md` before implementing auth, database, or messaging.

## MVP Map

1. Landing page: implemented.
2. Authentication: planned.
3. Dashboard: planned.
4. Create and save a challenge: planned.
5. Basic challenge workspace: guest-only implemented; saved workspace planned.
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
