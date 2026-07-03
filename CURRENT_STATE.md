# Current State

Last updated: 2026-07-03

Future Codex sessions must read this file first, then `docs/CODEX_PROJECT_MAP.md`, before changing files.

## Current Project Status

NoProblemo has completed:

- Phase 1: project foundation
- Phase 2: internationalization foundation
- Phase 3: public landing page and guest mode
- Phase 4: Supabase foundation

Phase 5 Authentication is next. Dashboard and guest import belong to Phase 6. Friends, groups, messaging, notifications, admin, payments, AI, email automation, Resend, and Vercel Cron remain future phases.

## Already Implemented

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- `next-intl`
- Locale routing for `en`, `zh-CN`, `hi`, `es`, `ar`, `fr`, `bn`, `pt-BR`, `id`, `ur`, `nb`
- RTL document direction for `ar` and `ur`
- Public landing page at `/[locale]`
- Guest workspace at `/[locale]/solve`
- Support/contact page at `/[locale]/support`
- Placeholder auth routes at `/[locale]/login` and `/[locale]/signup`
- Shared language switcher and footer
- Guest localStorage draft persistence under `noproblemo.guestWorkspace.v1`
- Markdown copy/export for guest drafts
- Login prompt for save/collaboration actions
- Supabase CLI folder with config and seed file
- Supabase migration `20260703190000_phase4_supabase_foundation.sql`
- Tables in migration: `profiles`, `challenges`, `challenge_sections`, `challenge_solutions`, `challenge_tasks`
- Updated-at trigger function and triggers
- Auth user profile creation trigger
- Owner-only RLS policies for Phase 4 tables
- Supabase browser/server helper scaffolding in `lib/supabase/`
- Manual database types in `lib/supabase/types.ts`
- Documentation baseline and project map

## Partially Implemented

- Problem-solving workflow exists as guest browser-local form fields and as planned database tables, but no UI writes to Supabase yet.
- Login/signup routes exist only as placeholders.
- Supabase schema exists as a local migration but has not been verified against the live Supabase project in this task.
- Supabase helpers exist but are not used by app routes yet.
- Deployment works on Vercel, but production hardening is ongoing.
- Translations currently include complete UI keys, but non-English content quality should be reviewed by fluent speakers before launch.

## Not Yet Implemented

- Real authentication UI/actions
- Auth callback routes
- Google OAuth UI
- Apple OAuth UI
- Protected app layout
- Dashboard
- Guest import after login
- Saved cloud challenge UI
- Friends/invites
- Groups
- Simple messaging
- Admin/settings
- Real-time collaboration
- AI features
- Payments
- Resend email
- Vercel Cron

## Important Files And Folders

- `app/[locale]/layout.tsx`: locale layout, metadata, RTL/LTR.
- `app/[locale]/page.tsx`: public landing page.
- `app/[locale]/solve/_components/guest-workspace.tsx`: guest localStorage workspace.
- `app/[locale]/support/page.tsx`: support page.
- `app/[locale]/login/page.tsx`: login placeholder.
- `app/[locale]/signup/page.tsx`: signup placeholder.
- `i18n/routing.ts`: supported locales and RTL logic.
- `messages/*.json`: UI messages.
- `proxy.ts`: locale middleware.
- `lib/supabase/client.ts`: browser Supabase anon client helper.
- `lib/supabase/server.ts`: server Supabase cookie-aware helper scaffold.
- `lib/supabase/types.ts`: manual Phase 4 database types.
- `supabase/config.toml`: Supabase CLI config.
- `supabase/seed.sql`: empty seed file.
- `supabase/migrations/20260703190000_phase4_supabase_foundation.sql`: Phase 4 schema and RLS migration.
- `docs/CODEX_PROJECT_MAP.md`: central durable project map.
- `docs/PHASE_HANDOFF_TEMPLATE.md`: reusable future prompt template.

## Known Issues

- No real auth or cloud saving UI exists yet.
- Phase 4 migration needs to be applied and tested in Supabase.
- RLS policies need verification with authenticated users.
- Guest drafts are browser-local and can be lost if localStorage is cleared.
- Non-English translations need human review.
- Supabase `.temp` files exist from linking/local CLI state; do not print their contents.
- `npm run build` may fail inside the sandbox because Turbopack needs to bind a local port. Rerun with approved escalation if that exact sandbox error occurs.

## Current Risks

- Future agents might mistake placeholder auth routes for real authentication.
- Future agents might use service role keys in frontend code; do not do this.
- RLS policies are written but still need live/local Supabase verification.
- User-generated problem content may be sensitive; privacy must be designed into auth and dashboard phases.
- Feature expansion could overload the minimal UI if not kept incremental.

## Next Recommended Phase

Phase 5: Authentication.

Recommended scope:

- Email login
- Signup
- Logout
- Protected app layout
- Profile creation verification after signup
- Prepare Google login
- Prepare Apple login
- Auth documentation

Do not implement full dashboard or guest import in Phase 5 unless explicitly required as minimal placeholders.

## Validation Commands

Run after changes:

```bash
npm run lint
npm run typecheck
npm run build
```

Validation for Phase 4:

- `npm run lint`: passed on 2026-07-03.
- `npm run typecheck`: passed on 2026-07-03.
- `npm run build`: passed on 2026-07-03 after rerunning with escalation for the known Turbopack sandbox port-bind issue.
