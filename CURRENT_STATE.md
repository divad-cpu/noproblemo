# Current State

Last updated: 2026-07-04

Future Codex sessions must read this file first, then `docs/CODEX_PROJECT_MAP.md`, before changing files.

## Current Project Status

NoProblemo has completed:

- Phase 1: project foundation
- Phase 2: internationalization foundation
- Phase 3: public landing page and guest mode
- Phase 4: Supabase foundation
- Phase 5: authentication
- Phase 6: dashboard and guest import
- Phase 7: challenge workspace
- Phase 8: friends and groups
- Phase 9: messaging, notifications and activity
- Phase 10: admin/settings and local project logs
- Phase 11: polish, security review and deployment preparation

Production verification preparation is complete. Controlled Supabase/Vercel production verification is next. Payments, AI, email automation, Resend, and Vercel Cron remain future phases.

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
- Forgot-password and reset-password routes at `/[locale]/forgot-password` and `/[locale]/reset-password`
- Logout route at `/[locale]/auth/logout`
- Logged-in dashboard at `/[locale]/app`
- Minimal cloud challenge creation at `/[locale]/app/challenges/new`
- Saved challenge workspace at `/[locale]/app/challenges/[id]`
- Profile/settings page at `/[locale]/app/settings`
- Logged-in password change from the protected settings page
- Guest draft import from localStorage to Supabase challenges and challenge sections
- Profile display name and preferred locale updates
- Seven-step saved challenge workflow
- Editable challenge details and status
- Editable challenge sections
- Possible solution create/edit/delete with pros, cons, risk, effort, impact, resources, and priority
- Task/action create/edit/delete with completion, responsible person, deadline, and position
- Markdown copy/download export for saved challenges
- Protected friends page at `/[locale]/app/friends`
- Friend request send, accept, decline, cancel, and remove friend actions
- Protected groups pages at `/[locale]/app/groups`, `/[locale]/app/groups/new`, and `/[locale]/app/groups/[id]`
- Group creation, group settings, invitations, accept/decline/cancel flows, member roles, member removal, and group challenge linking
- Phase 8 local migration for friends, friendships, groups, memberships, invitations, group challenge links, group access helpers, and RLS policies
- Authenticated limited profile search RPC that exposes only `id`, `display_name`, and `avatar_url`
- Phase 9 local migration for messages, notifications, activity events, helper functions, triggers, and RLS policies
- Group messages on `/[locale]/app/groups/[id]`
- Challenge discussion messages on `/[locale]/app/challenges/[id]`
- Protected notifications page at `/[locale]/app/notifications`
- Protected admin overview at `/[locale]/app/admin`
- Protected admin settings checklist at `/[locale]/app/admin/settings`
- Basic activity lists on dashboard, group detail, and challenge workspace
- Basic admin overview with aggregate counts, limited profile metadata, recent activity metadata, and recent audit-log entries
- Admin role protection based on `profiles.role = 'admin'`
- Admin navigation link shown only to admin profiles
- Phase 11 mobile/tablet navigation polish, dashboard grid polish, long-text wrapping, visible keyboard focus, dialog semantics, and safer query feedback handling
- Phase 11 i18n key parity and RTL configuration checks
- Phase 11 security/deployment documentation review
- Production verification preparation docs for Supabase, Vercel, Domeneshop DNS, Auth providers, RLS, multi-user manual testing, and launch readiness
- Notification/activity triggers for friend requests, group invitations, group/member events, group challenge links, and messages
- Phase 10 local migration for admin helper functions, admin audit log, admin-only RPCs, profile role hardening, and admin profile read policy
- Google and Apple OAuth start actions prepared through Supabase Auth
- Auth callback handling writes session cookies on the final redirect response and shows localized success/error states for email confirmation and recovery flows
- Shared language switcher and footer
- Guest localStorage draft persistence under `noproblemo.guestWorkspace.v1`
- Markdown copy/export for guest drafts
- Login prompt for save/collaboration actions
- Supabase CLI folder with config and seed file
- Supabase migration `20260703190000_phase4_supabase_foundation.sql`
- Tables in migration: `profiles`, `challenges`, `challenge_sections`, `challenge_solutions`, `challenge_tasks`
- Updated-at trigger function and triggers
- Auth user profile creation trigger
- Owner-only RLS policies for Phase 4 tables, extended in Phase 8 for explicitly linked group challenges
- Supabase browser/server helper scaffolding in `lib/supabase/`
- Manual database types in `lib/supabase/types.ts`
- Documentation baseline and project map

## Partially Implemented

- Problem-solving workflow exists as guest browser-local form fields and as an editable saved workspace for authenticated challenge owners.
- Group-linked challenge read/edit access is represented in RLS. The workspace now reads challenges through RLS, but viewer read-only UX is still mostly enforced by server/RLS failures rather than fully hiding every edit control.
- Group challenge linking currently links a user's own challenges to a group. Linking challenges owned by another group member remains future refinement.
- Supabase Realtime is documented as future work; Phase 9 uses server-rendered refresh/revalidation after message actions.
- Admin user management is read-only in Phase 10. Role changing, moderation, and system setting mutations remain future work.
- Admin audit logging storage exists in `admin_audit_log`; Phase 10 has no sensitive admin mutations to log yet.
- Phase 11 reviewed migrations and documented required manual Supabase/Vercel production checks, but did not perform live Supabase verification.
- Google and Apple login buttons are present, but they require Supabase provider setup and external provider configuration before they work in production.
- Supabase schema exists as local migrations but has not been verified against the live Supabase project in this task.
- Supabase helpers are used by auth actions, callback/logout handlers, auth-aware landing links, and the protected app layout.
- Deployment works on Vercel, but production hardening is ongoing.
- Translations currently include complete UI keys, but non-English content quality should be reviewed by fluent speakers before launch.

## Not Yet Implemented

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
- `app/[locale]/forgot-password/page.tsx`: public password reset request page.
- `app/[locale]/reset-password/page.tsx`: password reset completion page after callback recovery session exchange.
- `app/[locale]/auth/actions.ts`: Supabase Auth server actions.
- `app/[locale]/auth/callback/route.ts`: Supabase auth callback handler.
- `app/[locale]/auth/logout/route.ts`: logout handler.
- `app/[locale]/app/layout.tsx`: protected app layout with server-side auth check and app navigation.
- `app/[locale]/app/page.tsx`: logged-in dashboard with challenge lists and guest import prompt.
- `app/[locale]/app/actions.ts`: server actions for challenge creation, guest import, and profile updates.
- `app/[locale]/app/friends/page.tsx`: protected friend request and friendship management page.
- `app/[locale]/app/groups/page.tsx`: protected groups list and pending group invitations page.
- `app/[locale]/app/groups/new/page.tsx`: protected group creation page.
- `app/[locale]/app/groups/[id]/page.tsx`: protected group detail, member, invitation, and linked challenge page.
- `app/[locale]/app/notifications/page.tsx`: protected private notifications page.
- `app/[locale]/app/admin/page.tsx`: protected admin overview.
- `app/[locale]/app/admin/settings/page.tsx`: protected admin readiness/settings checklist.
- `app/[locale]/app/_components/guest-import-card.tsx`: client-side localStorage detection and import UI.
- `app/[locale]/app/challenges/new/page.tsx`: minimal protected create challenge page.
- `app/[locale]/app/challenges/[id]/page.tsx`: protected saved challenge workspace.
- `app/[locale]/app/_components/challenge-markdown-export.tsx`: client-side Markdown copy/download export.
- `app/[locale]/app/settings/page.tsx`: protected profile/settings page.
- `app/[locale]/_components/auth-status.tsx`: auth-aware landing links.
- `i18n/routing.ts`: supported locales and RTL logic.
- `messages/*.json`: UI messages.
- `proxy.ts`: locale middleware.
- `lib/supabase/client.ts`: browser Supabase anon client helper.
- `lib/supabase/server.ts`: server Supabase cookie-aware helper scaffold.
- `lib/supabase/types.ts`: manual Phase 4 database types.
- `supabase/migrations/20260703210000_phase8_friends_groups.sql`: Phase 8 friends, groups, group challenge access, helper functions, and RLS migration.
- `supabase/migrations/20260703220000_phase9_messaging_notifications_activity.sql`: Phase 9 messages, notifications, activity events, triggers, and RLS migration.
- `supabase/migrations/20260704090000_phase10_admin_settings_logs.sql`: Phase 10 admin helpers, audit log, admin RPCs, and profile role hardening migration.
- `supabase/config.toml`: Supabase CLI config.
- `supabase/seed.sql`: empty seed file.
- `supabase/migrations/20260703190000_phase4_supabase_foundation.sql`: Phase 4 schema and RLS migration.
- `docs/CODEX_PROJECT_MAP.md`: central durable project map.
- `docs/PHASE_HANDOFF_TEMPLATE.md`: reusable future prompt template.
- `docs/PRODUCTION_VERIFICATION.md`: production verification checklist.
- `docs/SUPABASE_VERIFICATION.md`: Supabase manual verification checklist.
- `docs/MANUAL_TEST_PLAN.md`: multi-user app manual test plan.
- `docs/LAUNCH_READINESS_REPORT.md`: launch readiness status and blocker report.

## Known Issues

- Phase 4 migration needs to be applied and tested in Supabase.
- Phase 8 migration needs to be applied and tested in Supabase.
- Phase 9 migration needs to be applied and tested in Supabase.
- Phase 10 migration needs to be applied and tested in Supabase.
- RLS policies, profile trigger, workspace writes, friend/group writes, group challenge access, message writes, notification privacy, and activity visibility need verification with authenticated users.
- Admin role checks, admin RPCs, admin audit log RLS, and profile role hardening need verification with authenticated admin and non-admin users.
- Supabase CLI is not installed in this environment, so Supabase CLI lint/list checks were not run.
- Production Vercel environment variables, Supabase Auth redirect URLs, Domeneshop DNS, and support mailbox/alias setup still need manual verification.
- Production verification preparation did not change real Supabase, Vercel, Domeneshop, DNS, or support mailbox settings.
- `npm audit` reports moderate PostCSS advisories through Next.js 16.2.10's dependency tree. The suggested `npm audit fix --force` would install `next@9.3.3`, a breaking downgrade, so it was not applied.
- Google and Apple OAuth require provider configuration in Supabase, Google Cloud, and Apple Developer.
- Supabase Auth redirect URLs must include locale-specific `/[locale]/auth/callback` routes for email confirmation, OAuth, and password recovery.
- Guest drafts are browser-local and can be lost if localStorage is cleared.
- Non-English translations need human review.
- Supabase `.temp` files exist from linking/local CLI state; do not print their contents.
- `npm run build` may fail inside the sandbox because Turbopack needs to bind a local port. Rerun with approved escalation if that exact sandbox error occurs.

## Current Risks

- Future agents must not add payments, AI, email automation, Resend, or Vercel Cron before explicitly scoped.
- Future agents might use service role keys in frontend code; do not do this.
- RLS policies are written but still need live/local Supabase verification.
- User-generated problem content may be sensitive; privacy must be designed into auth and dashboard phases.
- Feature expansion could overload the minimal UI if not kept incremental.

## Next Recommended Phase

Controlled Supabase/Vercel production verification.

Recommended scope:

- Apply migrations to a real Supabase project only with explicit approval.
- Verify RLS with multiple test users.
- Configure Supabase Auth redirect URLs and OAuth providers.
- Configure Vercel environment variables and custom domain.
- Configure Domeneshop DNS and the support mailbox or alias.
- Manually test all core app flows on mobile, desktop, and all supported locales.
- Record results in `docs/LAUNCH_READINESS_REPORT.md` and `CURRENT_STATE.md`.

Do not add unrelated product features during production verification.

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

Validation for Phase 7:

- `npm run lint`: passed on 2026-07-03.
- `npm run typecheck`: passed on 2026-07-03.
- `npm run build`: passed on 2026-07-03.

Validation for Phase 8:

- `npm run lint`: passed on 2026-07-03.
- `npm run typecheck`: passed on 2026-07-03.
- `npm run build`: passed on 2026-07-03.

Validation for Phase 9:

- `npm run lint`: passed on 2026-07-03.
- `npm run typecheck`: passed on 2026-07-03.
- `npm run build`: passed on 2026-07-03.

Validation for Phase 10:

- `npm run lint`: passed on 2026-07-04.
- `npm run typecheck`: passed on 2026-07-04.
- `npm run build`: passed on 2026-07-04.

Validation for Phase 11:

- `npm run lint`: passed on 2026-07-04.
- `npm run typecheck`: passed on 2026-07-04.
- `npm run build`: passed on 2026-07-04.
- `npm audit`: completed on 2026-07-04 and reported 2 moderate advisories via Next.js bundled PostCSS; no automatic fix was applied because the suggested force fix is a breaking Next downgrade.

Validation for production verification preparation:

- `npm run lint`: passed on 2026-07-04.
- `npm run typecheck`: passed on 2026-07-04.
- `npm run build`: passed on 2026-07-04.
- `npm audit`: completed on 2026-07-04 and reported 2 moderate advisories via Next.js bundled PostCSS; no automatic fix was applied because the suggested force fix is a breaking Next downgrade.

Validation for auth/settings verification fix:

- `npm run lint`: passed on 2026-07-04.
- `npm run typecheck`: passed on 2026-07-04.
- `npm run build`: passed on 2026-07-04.
