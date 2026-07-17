# Current State

Last updated: 2026-07-17

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

The focused application repair release was merged through PR #2, recorded in `main` as `91cac6d`, deployed and promoted to `noproblemo.tech`, and production-verified with three disposable accounts. Payments, AI, email automation, Resend, and Vercel Cron remain future phases.

The production Supabase security migration `20260716120000_full_application_audit_security_repairs.sql` was manually applied and verified on 2026-07-16. Its source SHA-256 is `a3a4c87061a845a04529e3cc0c328df386ad79b49de1b31b90559648fcd05c53`; all six migrations align locally and remotely, and the post-apply linked dry run reports no pending migrations. All six migrations were applied before the later PR #4 application release, and PR #4 contained no migration. See `docs/qa/SECURITY_MIGRATION_PRODUCTION_VERIFICATION.md`.

A focused auth/settings verification fix was completed after Phase 11 to improve email-confirmation fallback handling, password recovery, route language switching, and dashboard usability.

A focused Supabase keepalive health endpoint is implemented locally. Its migration is one of the six migrations now aligned with production; Vercel secret configuration, endpoint deployment, and endpoint production verification remain separate work.

The group-creation hotfix was initially isolated and verified on a non-production Vercel Preview on 2026-07-16. Its generated-ID, separate owner verification, and trigger-owned membership behavior is now present in production application commit `91cac6d`, where group creation and role boundaries passed three-account verification. No database migration was required. See `docs/qa/GROUP_CREATION_HOTFIX.md`.

The production application repair release on `91cac6d` was verified with the three disposable accounts. Authenticated redirects and protected deep-link restoration, pending/duplicate-submit protection, trigger-owned friend and group-invitation acceptance, safe notification destinations, inert/native-disabled viewer controls, editor persistence with RLS denial of viewer mutation, group creation and role boundaries, message and notification privacy, and ordinary-user admin denial all passed. See `docs/qa/PRODUCTION_UX_REPAIRS.md`.

The focused pending-invitation RPC consumer and bounded challenge-section conflict recovery were merged through PR #4 in application commit `264a435`, deployed to production, and verified on 2026-07-17. Vercel deployment `dpl_Bfo7GChwmpZh2oUeYvC1pXJNZKc7` was `Ready` with target `production`; the production domains and immutable deployment URL redirected to `/en` as expected, aliases remained unchanged, and no Vercel errors were found. Pending-invitation identity/privacy, accept/decline and accepted-member listing, concurrent and sequential section saves, regression coverage, and supported cleanup passed. PR #4 contained no migration because all six Supabase migrations, including the RPC and uniqueness guarantee it consumes, were already applied. See `docs/qa/PENDING_INVITATION_SECTION_SAVE_FOLLOWUP.md`.

A focused group-invitation cancellation repair is prepared on `fix/group-invitation-cancellation`. Pending invitations may be canceled by their original inviter or a currently accepted group owner/admin; accept and decline remain invitee-only. The server action checks the exact pending row, verifies manager membership explicitly, performs a pending-only update, and verifies the returned final status. The group-detail manager UI retains its cancellation control and now disables it while submission is pending. Static inspection also found that the existing RLS update policy did not restrict the old row to `pending`, so additive migration `20260717120000_group_invitation_cancellation_authorization.sql` is required to make accepted, declined, and canceled rows immutable at the database boundary. This migration has not been applied to any local or remote database.

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
- Server-side account deletion from the protected settings page, guarded by explicit confirmation and a server-only Supabase admin helper
- Guest draft import from localStorage to Supabase challenges and challenge sections
- Profile display name and preferred locale updates
- Seven-step saved challenge workflow
- Editable challenge details and status
- Editable challenge sections
- Possible solution create/edit/delete with pros, cons, risk, effort, impact, resources, and priority
- Task/action create/edit/delete with completion, responsible person, deadline, and position
- Markdown copy/download export for saved challenges
- Compact browser print-based PDF export for saved challenges through a protected print-only report route at `/[locale]/app/challenges/[id]/print`; users choose Save to PDF from the print dialog. The report omits empty sections and editing controls where practical.
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
- Bearer-protected, non-cacheable `/api/health/supabase` Route Handler using anon credentials and no user session or service-role key
- Supabase migration `20260714120000_supabase_health_check.sql` for the minimal invoker `noproblemo_health_check()` RPC with `anon`-only execution
- Production-aligned Supabase migration `20260716120000_full_application_audit_security_repairs.sql` for least-privilege table/function access, the minimal pending-invitation RPC, ownership protections, and challenge-section uniqueness
- Authenticated pending-invitation UI consumption of `pending_group_invitations()` without pending-invitee base `groups` access
- One bounded, exact-key challenge-section recovery update after a concurrent first-insert `23505`, with returned-row verification
- Focused local pgTAP regression coverage for the production-aligned security migration
- Focused structural, pgTAP, and explicitly gated Playwright coverage for group-invitation cancellation authorization
- Notification/activity triggers for friend requests, group invitations, group/member events, group challenge links, and messages
- Phase 10 local migration for admin helper functions, admin audit log, admin-only RPCs, profile role hardening, and admin profile read policy
- Google and Apple OAuth start actions remain prepared for future use, but visible login/signup UI currently shows email auth only.
- Refreshed visual direction uses a light, modern, minimal palette with blue primary actions, green success accents, soft orange highlights, white surfaces, dark readable text, and subtle digital-grid texture.
- Auth callback handling writes session cookies on the final redirect response and shows localized success/error states for email confirmation and recovery flows
- Email confirmation fallback now avoids false invalid-link errors when Supabase confirms the account but the callback session exchange fails; users are sent to login with a clear "email may already be confirmed" state.
- Password recovery links now target `/[locale]/reset-password` directly. Forgot/reset password use an isolated browser-only Supabase recovery client so password recovery can establish a browser session before updating the password.
- Forgot-password submit now keeps a stable form reference across async Supabase work, so a successful reset-email request can clear the form without a client crash.
- Password reset failure UI now keeps the generic invalid/expired-link message and adds a localized same-browser/profile hint for Supabase PKCE recovery links.
- Shared language switcher and footer
- Compact select-based language switcher that preserves the current route while replacing the locale segment
- Focused i18n cleanup for dashboard challenge statuses, workspace Markdown export status, admin profile roles, and notification titles/bodies so those visible system labels render through message keys instead of raw database values.
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
- Group-linked challenge read/edit access is represented in RLS. The workspace reads challenges through RLS; viewers receive a clear read-only presentation with mutation forms inert, controls native-disabled, and no active server actions, while owner/admin/member editors retain intended controls.
- Group challenge linking currently links a user's own challenges to a group. Linking challenges owned by another group member remains future refinement.
- Supabase Realtime is documented as future work; Phase 9 uses server-rendered refresh/revalidation after message actions.
- Admin user management is read-only in Phase 10. Role changing, moderation, and system setting mutations remain future work.
- Admin audit logging storage exists in `admin_audit_log`; Phase 10 has no sensitive admin mutations to log yet.
- Phase 11 reviewed migrations and documented required manual Supabase/Vercel production checks, but did not perform live Supabase verification.
- Google and Apple OAuth actions exist for future use, but buttons are temporarily hidden from the public auth UI while email login/signup is the active method.
- The original six Supabase migrations align with the live production migration history. The 2026-07-16 security migration passed production verification; the new local cancellation-authorization migration remains unapplied, and broader application workflow verification remains tracked separately.
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
- `app/[locale]/reset-password/page.tsx`: password reset completion page that establishes the recovery session in the browser before updating the password.
- `app/[locale]/auth/actions.ts`: Supabase Auth server actions.
- `app/[locale]/auth/callback/route.ts`: Supabase auth callback handler.
- `app/[locale]/auth/logout/route.ts`: logout handler.
- `app/[locale]/app/layout.tsx`: protected app layout with server-side auth check and app navigation.
- `app/[locale]/app/page.tsx`: logged-in dashboard with challenge lists and guest import prompt.
- `app/[locale]/app/actions.ts`: server actions for challenge creation, guest import, and profile updates.
- `lib/supabase/admin.ts`: server-only Supabase admin helper for current-user account deletion.
- `app/api/health/supabase/route.ts`: server-only keepalive endpoint for a trusted cron client.
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
- `supabase/migrations/20260714120000_supabase_health_check.sql`: minimal Supabase reachability RPC with invoker security and anon-only execution.
- `supabase/migrations/20260716120000_full_application_audit_security_repairs.sql`: byte-identical record of the production-applied security migration.
- `supabase/migrations/20260717120000_group_invitation_cancellation_authorization.sql`: pending-only group-invitation transition policy; locally prepared and not applied remotely.
- `supabase/tests/database/security_migration_production_alignment.test.sql`: focused pgTAP regression coverage for the production-applied security guarantees.
- `supabase/tests/database/group_invitation_cancellation_authorization.test.sql`: transaction-wrapped role and terminal-state cancellation policy coverage.
- `docs/qa/SECURITY_MIGRATION_PRODUCTION_VERIFICATION.md`: durable production application, checksum, history-alignment, and follow-up record.
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

- The original six migrations remain applied and aligned in production. The new local cancellation-authorization migration is intentionally unapplied and requires a separate approved database workflow before release.
- The health-check endpoint still needs Vercel Production secret configuration and endpoint production verification; its database migration is already applied.
- Ordinary-user authentication, collaboration, viewer/editor authorization, message/notification privacy, and admin denial were production-verified with three disposable accounts. Deliberately configured administrator-positive testing of admin routes, RPCs, audit-log RLS, and profile-role hardening remains outstanding.
- Supabase CLI 2.109.0 is installed. On 2026-07-16, local database lint passed, linked history showed all six migrations aligned, and the linked push dry run reported the remote database up to date; no remote write was run.
- Remaining operational verification includes the health endpoint secret/deployment, Google/Apple OAuth provider setup, and the support mailbox or alias.
- `npm audit` reports moderate PostCSS advisories through Next.js 16.2.10's dependency tree. The suggested `npm audit fix --force` would install `next@9.3.3`, a breaking downgrade, so it was not applied.
- Google and Apple OAuth require provider configuration in Supabase, Google Cloud, and Apple Developer.
- Email authentication and redirect behavior were production-verified; Google and Apple provider configuration still needs manual setup and verification.
- Account deletion requires `SUPABASE_SERVICE_ROLE_KEY` to be configured server-side in the deployment environment.
- Supabase Auth redirect URLs must include locale-specific `/[locale]/auth/callback` routes for email confirmation and OAuth.
- Supabase Auth redirect URLs must also include locale-specific `/[locale]/reset-password` routes for password recovery.
- Password reset recovery is isolated from the main SSR Supabase client because the SSR/cookie-oriented client was not reliably preserving the PKCE verifier for local recovery links and produced `verifier-missing-or-expired`.
- Reset links requested before the isolated browser recovery fix may need to be resent.
- Supabase Auth reset email requests can be rate-limited during testing, including `over_email_send_rate_limit` / 429 responses from the built-in email provider. Avoid repeated reset tests, wait for the provider limit to clear, and use a configured SMTP provider for serious testing or production.
- Saved challenge PDF export no longer prints from hidden same-page workspace DOM. The dedicated print route avoids Firefox blank pages caused by hidden app layout preserving print height.
- Non-English translation quality still needs native review even though key parity is maintained.
- Guest drafts are browser-local and can be lost if localStorage is cleared.
- Non-English translations need human review.
- Supabase `.temp` files exist from linking/local CLI state; do not print their contents.
- `npm run build` may fail inside the sandbox because Turbopack needs to bind a local port. Rerun with approved escalation if that exact sandbox error occurs.

## Current Risks

- Future agents must not add payments, AI, email automation, Resend, or Vercel Cron before explicitly scoped.
- Future agents might use service role keys in frontend code; do not do this.
- The production-applied security migration has focused local pgTAP coverage and passed production verification. Its pending-invitation consumer and bounded challenge-section `23505` recovery also passed focused production verification in application commit `264a435`. The new cancellation-authorization migration remains locally prepared and unapplied.
- User-generated problem content may be sensitive; privacy must be designed into auth and dashboard phases.
- Feature expansion could overload the minimal UI if not kept incremental.

## Next Recommended Phase

Focused application and operational follow-ups.

Recommended scope:

- Run deliberately configured administrator-positive verification without weakening ordinary-user denial.
- Complete Google/Apple OAuth provider setup, health endpoint secret/deployment verification, and support mailbox or alias setup.
- Obtain fluent human translation review and run targeted locale/device checks without claiming every possible production workflow is covered.
- Record release-specific results in `docs/LAUNCH_READINESS_REPORT.md` and `CURRENT_STATE.md`.

Do not add unrelated product features or another migration during these follow-ups.

## Validation Commands

Run after changes:

```bash
npm run lint
npm run typecheck
npm run build
```

Validation for the focused group-invitation cancellation repair on 2026-07-17:

- `git diff --check`: passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run test:security`: passed, including the new focused structural suite and the existing acceptance and bounded `23505` recovery checks.
- `npm run build`: passed with non-secret localhost Supabase placeholders after the sandboxed attempt was unable to bind Turbopack's internal port and the first unrestricted attempt lacked public Supabase build variables.
- Focused Playwright discovery (`--list`): passed. Runtime execution is blocked because no explicitly configured isolated local/Preview URL and six disposable accounts are available; the test rejects `noproblemo.tech` and requires an explicit gate.
- Focused pgTAP runtime: blocked because no local Supabase database container is running. No database was started, reset, linked, or modified.
- No production application, database record, migration history, environment file, deployment, or external service was modified.

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

Validation for auth callback/recovery/language/dashboard follow-up:

- Message JSON validity check: passed on 2026-07-04.
- Message key parity check across all 11 locales: passed on 2026-07-04.
- `npm run lint`: passed on 2026-07-04.
- `npm run typecheck`: passed on 2026-07-04.
- `npm run build`: passed on 2026-07-04.

Validation for MVP blocker fix:

- Message JSON validity check: passed on 2026-07-04.
- Message key parity check across all 11 locales: passed on 2026-07-04.
- `npm run lint`: passed on 2026-07-04.
- `npm run typecheck`: passed on 2026-07-04.
- `npm run build`: passed on 2026-07-04.
- `git diff --check`: passed on 2026-07-04.

Hard i18n/reset-password MVP blocker follow-up:

- Locale routing remains `app/[locale]/...` with `next-intl`; route locale selects the message catalog.
- Hard i18n audit moved visible auth/password-reset controls to translations and tightened Norwegian Bokmål copy across landing, guest workspace, dashboard, protected navigation, settings, collaboration pages, notifications, and admin surfaces.
- All 11 locale message files keep matching keys. Non-English copy is intentionally simple and still needs native review before public launch.
- Forgot-password now requests Supabase recovery links from the browser client so PKCE verifier state remains in the same browser that opens `/[locale]/reset-password?code=...&source=recovery`.
- Reset-password exchanges recovery codes in the browser, shows a checking state before invalid-link errors, enables the form only after exchange/session readiness, updates the password through Supabase Auth, signs out, and redirects to localized login success.
- Password fields on login, signup, reset-password, and settings password change now include accessible show/hide controls.
- Account deletion remains server-only, derives the current user from the authenticated session, requires explicit confirmation, and uses `lib/supabase/admin.ts` with `server-only`.
- No remote Supabase migrations, Vercel changes, DNS changes, deployments, or env changes were made.

Validation for hard i18n/reset-password MVP blocker follow-up:

- Message JSON validity check: passed on 2026-07-04.
- Message key parity check across all 11 locales: passed on 2026-07-04.
- Hardcoded screenshot string check in `app/`: passed on 2026-07-04.
- `npm run lint`: passed on 2026-07-04.
- `npm run typecheck`: passed on 2026-07-04.
- `npm run build`: passed on 2026-07-04.
- `git diff --check`: passed on 2026-07-04.

Final auth diagnostics and locale cleanup follow-up:

- Forgot-password reset requests are confirmed to use the browser Supabase client. The reset redirect is exactly `/<locale>/reset-password` on the current origin and does not include the user's email in the URL.
- Password reset request failures now map to privacy-safe categories: rate limit, provider/SMTP, invalid email format, redirect URL not allowed, and generic send failure. Development warnings log only those labels.
- Rate-limit responses now show a clearer localized message and hold a short client-side cooldown to prevent repeated clicks. This does not bypass Supabase email limits.
- If reset email sending still fails after this code path, likely remaining causes are Supabase-side: SMTP/provider configuration, Auth rate limits, redirect URL allow-list, Site URL mismatch, or Supabase Auth email template/provider errors.
- Non-English locale files received a machine-quality cleanup pass to remove obvious English fallback values. Native review is still required before public launch.
- Reset links requested before the latest reset-password fixes may need to be resent.
- No remote Supabase Auth settings, remote migrations, Vercel settings, DNS, deployments, or env values were changed.

Supabase keepalive health-check validation:

- Local dummy RPC branch checks passed on 2026-07-14 for missing secret configuration, missing authorization, invalid Bearer token, successful RPC, failed RPC, no-store headers, and secret/internal error non-disclosure.
- Migration inspection confirmed `SECURITY INVOKER`, empty `search_path`, `select true` only, revoked `PUBLIC`/`authenticated`/`service_role` execution, and `anon` execution.
- `npm run lint`: passed on 2026-07-14.
- `npm run typecheck`: passed on 2026-07-14.
- `npm run build`: passed on 2026-07-14; the build classified `/api/health/supabase` as dynamic.
- `git diff --check` and focused service-role/session/table-access/secret-tracking checks: passed on 2026-07-14.
- No live Supabase project, Vercel environment, deployment, cron host, or real secret was changed or accessed.
