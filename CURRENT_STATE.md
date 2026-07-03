# Current State

Last updated: 2026-07-03

Future Codex sessions must read this file first, then `docs/CODEX_PROJECT_MAP.md`, before changing files.

## Current Project Status

NoProblemo has completed:

- Phase 1: project foundation
- Phase 2: internationalization foundation
- Phase 3: public landing page and guest mode
- Phase 4: Supabase foundation
- Phase 5: authentication
- Phase 6: dashboard and guest import

Phase 7 Challenge workspace is next. Friends, groups, messaging, notifications, admin, payments, AI, email automation, Resend, and Vercel Cron remain future phases.

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
- Email login and signup routes at `/[locale]/login` and `/[locale]/signup`
- Supabase auth callback route at `/[locale]/auth/callback`
- Logout route at `/[locale]/auth/logout`
- Logged-in dashboard at `/[locale]/app`
- Minimal cloud challenge creation at `/[locale]/app/challenges/new`
- Saved challenge continuation placeholder at `/[locale]/app/challenges/[id]`
- Profile/settings page at `/[locale]/app/settings`
- Guest draft import from localStorage to Supabase challenges and challenge sections
- Profile display name and preferred locale updates
- Google and Apple OAuth start actions prepared through Supabase Auth
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

- Problem-solving workflow exists as guest browser-local form fields, imported challenge sections, and planned full workspace tables. Full editable saved workspace is not implemented yet.
- Google and Apple login buttons are present, but they require Supabase provider setup and external provider configuration before they work in production.
- Supabase schema exists as a local migration but has not been verified against the live Supabase project in this task.
- Supabase helpers are used by auth actions, callback/logout handlers, auth-aware landing links, and the protected app layout.
- Deployment works on Vercel, but production hardening is ongoing.
- Translations currently include complete UI keys, but non-English content quality should be reviewed by fluent speakers before launch.

## Not Yet Implemented

- Full saved challenge workspace
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
- `app/[locale]/login/page.tsx`: email login form and OAuth provider start buttons.
- `app/[locale]/signup/page.tsx`: email signup form and OAuth provider start buttons.
- `app/[locale]/auth/actions.ts`: Supabase Auth server actions.
- `app/[locale]/auth/callback/route.ts`: Supabase auth callback handler.
- `app/[locale]/auth/logout/route.ts`: logout handler.
- `app/[locale]/app/layout.tsx`: protected app layout with server-side auth check and app navigation.
- `app/[locale]/app/page.tsx`: logged-in dashboard with challenge lists and guest import prompt.
- `app/[locale]/app/actions.ts`: server actions for challenge creation, guest import, and profile updates.
- `app/[locale]/app/_components/guest-import-card.tsx`: client-side localStorage detection and import UI.
- `app/[locale]/app/challenges/new/page.tsx`: minimal protected create challenge page.
- `app/[locale]/app/challenges/[id]/page.tsx`: minimal protected saved challenge continuation placeholder.
- `app/[locale]/app/settings/page.tsx`: protected profile/settings page.
- `app/[locale]/_components/auth-status.tsx`: auth-aware landing links.
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

- Full Phase 7 saved challenge workspace is not implemented yet.
- Phase 4 migration needs to be applied and tested in Supabase.
- RLS policies and profile trigger need verification with authenticated users.
- Google and Apple OAuth require provider configuration in Supabase, Google Cloud, and Apple Developer.
- Guest drafts are browser-local and can be lost if localStorage is cleared.
- Non-English translations need human review.
- Supabase `.temp` files exist from linking/local CLI state; do not print their contents.
- `npm run build` may fail inside the sandbox because Turbopack needs to bind a local port. Rerun with approved escalation if that exact sandbox error occurs.

## Current Risks

- Future agents might mistake the minimal challenge detail page for the full workspace; it is only a Phase 6 continuation placeholder.
- Future agents might use service role keys in frontend code; do not do this.
- RLS policies are written but still need live/local Supabase verification.
- User-generated problem content may be sensitive; privacy must be designed into auth and dashboard phases.
- Feature expansion could overload the minimal UI if not kept incremental.

## Next Recommended Phase

Phase 7: Challenge workspace.

Recommended scope:

- Seven-step problem-solving workflow
- Editable saved challenge sections
- Possible solutions
- Pros and cons
- Risk, effort, and impact
- Tasks/actions
- Final recommendation
- Markdown export

Do not implement friends, groups, messaging, notifications, or admin in Phase 7 unless explicitly scoped.

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

Validation for Phase 5:

- `npm run lint`: passed on 2026-07-03.
- `npm run typecheck`: passed on 2026-07-03.
- `npm run build`: passed on 2026-07-03 after rerunning with escalation for the known Turbopack sandbox port-bind issue.

Validation for Phase 6:

- `npm run lint`: passed on 2026-07-03.
- `npm run typecheck`: passed on 2026-07-03.
- `npm run build`: passed on 2026-07-03 after rerunning with escalation for the known Turbopack sandbox port-bind issue.
