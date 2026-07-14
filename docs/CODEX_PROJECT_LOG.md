# Codex Project Log

## 2026-07-14

Supabase keepalive health check:

- Added the non-locale `GET /api/health/supabase` Route Handler for an external Linux cron client.
- Required a server-only `NOPROBLEMO_KEEPALIVE_SECRET` Bearer token, used constant-time digest comparison, and returned generic `401` or `503` failures with explicit no-store headers.
- Added `public.noproblemo_health_check()` through `20260714120000_supabase_health_check.sql` as a stable `SECURITY INVOKER` function with an empty `search_path`, no table access, revoked `PUBLIC` execution, and `anon`-only execution.
- Used a cookie-free typed Supabase client with public anon credentials. No authenticated user session, write, service-role key, remote migration, Vercel change, deployment, or real secret was used.
- Updated environment templates and the relevant security, deployment, production verification, Supabase verification, project map, current state, and changelog documentation.
- Local dummy-RPC branch checks, migration/security assertions, `npm run lint`, `npm run typecheck`, `npm run build`, and `git diff --check` passed. The production build classified the endpoint as dynamic.

## 2026-07-03

Phase 1 foundation work:

- Inspected the existing Next.js App Router project, package scripts, git status, ignore rules, app files, Supabase folder, and installed Next.js documentation.
- Confirmed a real `.env.local` file exists and did not read or print its contents.
- Added `typecheck` script.
- Verified `.gitignore` ignores real `.env*` files and added an exception for `.env.local.example`.
- Added safe `.env.local.example` placeholders.
- Updated README and AGENTS guidance for NoProblemo Phase 1.
- Added foundation documentation files.
- Replaced default scaffold homepage and metadata with a minimal NoProblemo Phase 1 page.
- Removed runtime dependency on Google font fetching from the root layout.
- Validation passed: `npm run lint`, `npm run typecheck`, and `npm run build`.

Phase 2 internationalization foundation:

- Inspected the existing Phase 1 project structure, package scripts, app layout/page, Next prompt, and installed Next.js internationalization docs.
- Installed `next-intl`.
- Added locale routing configuration, request configuration, navigation helpers, and `proxy.ts` middleware.
- Moved the public page under `app/[locale]/` and added locale-aware `html lang` and `dir` attributes.
- Added message catalogs for all supported locales.
- Added a simple language switcher.
- Preserved guest-mode documentation without building the guest workspace.
- Validation passed after fixing stale generated route types: `npm run lint`, `npm run typecheck`, and `npm run build`.

Phase 3 public landing page and guest mode:

- Inspected current project structure, package scripts, app routes, message files, language switcher, and Phase 3 prompt.
- Built a localized public landing page with guest start, login/signup placeholders, workflow preview, collaboration explanation, benefits, language switcher, and support footer.
- Added `/[locale]/solve` guest workspace with localStorage drafts, Markdown copy/export, and guarded account-required actions.
- Added `/[locale]/support` contact page with `david@fideli.no`.
- Added placeholder `/[locale]/login` and `/[locale]/signup` routes without implementing authentication.
- Kept guest data local to the browser and did not add Supabase migrations or cloud persistence.
- Validation passed: `npm run lint`, `npm run typecheck`, and `npm run build`.

Documentation and project orientation map:

- Inspected repository structure, package scripts, App Router routes, i18n files, Supabase folder, README, AGENTS, and existing project docs.
- Created `CURRENT_STATE.md` as the required first-read handoff file.
- Created `docs/CODEX_PROJECT_MAP.md` as the central durable map for routes, data model, security model, MVP state, and future work rules.
- Created `docs/PHASE_HANDOFF_TEMPLATE.md` for future phase prompts.
- Updated core docs to distinguish implemented Phase 1-3 work from planned auth, Supabase, dashboard, groups, invites, messaging, and admin/settings.
- Did not implement Phase 4 or change application features.
- Validation passed: `npm run lint`, `npm run typecheck`, and `npm run build`.

Phase 4 Supabase foundation:

- Inspected required handoff docs, package scripts, App Router routes, env templates, Supabase folder, schema/security docs, and installed Next.js docs.
- Installed `@supabase/supabase-js` and `@supabase/ssr`.
- Added `supabase/migrations/20260703190000_phase4_supabase_foundation.sql`.
- Added `profiles`, `challenges`, `challenge_sections`, `challenge_solutions`, and `challenge_tasks` schema.
- Added updated-at trigger function and triggers.
- Added auth user profile creation trigger.
- Enabled RLS and added owner-only policies for Phase 4 tables.
- Added Supabase browser/server helper scaffolding and manual database types under `lib/supabase/`.
- Updated env examples with site URL, support email, public Supabase keys, and server-only service role placeholder.
- Did not implement authentication UI, dashboard, guest import, groups, friends, messages, admin, email, cron, payments, or AI.
- Validation passed: `npm run lint`, `npm run typecheck`, and `npm run build`.

Phase 5 authentication:

- Inspected required handoff docs, package scripts, App Router routes, message files, Supabase helpers, Phase 4 migration state, and installed Next.js authentication/server action/route handler docs.
- Replaced placeholder login/signup pages with Supabase Auth email forms.
- Added Google and Apple OAuth provider start actions through Supabase Auth.
- Added Supabase auth callback route for exchanging auth codes into cookie-backed sessions.
- Added logout route.
- Added a minimal protected `/[locale]/app` route boundary with server-side session checks.
- Added auth-aware landing links for logged-in and logged-out users.
- Updated all eleven message catalogs with auth UI keys.
- Did not implement dashboard, guest import, cloud challenge saving, groups, friends, messages, admin, email, cron, payments, or AI.
- Validation passed: `npm run lint`, `npm run typecheck`, and `npm run build`.

Phase 6 dashboard and guest import:

- Inspected required handoff docs, package scripts, App Router routes, guest localStorage implementation, Supabase helpers/types, migration files, message catalogs, and installed Next.js server action/data fetching docs.
- Replaced the protected `/[locale]/app` placeholder with a logged-in dashboard.
- Added authenticated challenge reads from Supabase with active/latest lists, empty states, and error states.
- Added guest draft detection for `noproblemo.guestWorkspace.v1`.
- Added guest import from localStorage to Supabase `challenges` and `challenge_sections`.
- Added browser-local duplicate prevention by marking imported drafts with `importedChallengeId`.
- Added minimal protected challenge creation at `/[locale]/app/challenges/new`.
- Added minimal protected saved challenge continuation at `/[locale]/app/challenges/[id]`.
- Added protected profile/settings at `/[locale]/app/settings` for display name and preferred locale.
- Updated all eleven message catalogs with Phase 6 UI keys.
- Did not implement full challenge workspace, friends, groups, messaging, notifications, admin, payments, AI, email automation, Resend, or Vercel Cron.
- Validation passed: `npm run lint`, `npm run typecheck`, and `npm run build`.

Phase 7 challenge workspace:

- Inspected required handoff docs, package scripts, App Router routes, Supabase helpers/types, Phase 4 migration constraints, message catalogs, and installed Next.js server action/form docs.
- Upgraded `/[locale]/app/challenges/[id]` from continuation placeholder to protected saved challenge workspace.
- Added editable challenge details and status.
- Added seven-step problem-solving workflow UI.
- Added editable challenge sections saved through `challenge_sections`.
- Added possible solution create/edit/delete using `challenge_solutions`.
- Added pros, cons, risk, effort, impact, resources needed, and priority/ranking fields.
- Added task/action create/edit/delete using `challenge_tasks`.
- Added completed state, responsible person, deadline, and position fields.
- Added final recommendation and summary sections.
- Added client-side Markdown copy/download export.
- Updated all eleven message catalogs with Phase 7 UI keys.
- Did not implement friends, groups, messaging, notifications, admin, payments, AI, email automation, Resend, Vercel Cron, public sharing, comments, voting, or realtime collaboration.
- Validation passed: `npm run lint`, `npm run typecheck`, and `npm run build`.

Phase 8 friends and groups:

- Inspected required handoff docs, package scripts, App Router routes, Supabase helpers/types, Phase 4 and Phase 7 migration constraints, message catalogs, and installed Next.js server action/form docs.
- Added `supabase/migrations/20260703210000_phase8_friends_groups.sql`.
- Added `friend_requests`, `friendships`, `groups`, `group_members`, `group_invitations`, and `group_challenges`.
- Added helper functions for group roles, group challenge read/edit access, the 100-member group limit, owner membership creation, last-owner protection, and limited authenticated profile search.
- Added RLS policies for friend requests, friendships, groups, members, invitations, group challenge links, and linked challenge access.
- Updated manual database types for Phase 8 tables and search RPC.
- Added protected `/[locale]/app/friends` page.
- Added protected `/[locale]/app/groups`, `/[locale]/app/groups/new`, and `/[locale]/app/groups/[id]` pages.
- Added server actions for friend requests, friendship removal, group creation/settings, group invitations, member roles/removal, and group challenge linking/unlinking.
- Updated protected navigation and dashboard previews for friend requests, group invitations, and groups.
- Updated all eleven message catalogs with Phase 8 UI keys.
- Did not implement messaging, notifications, activity feed, admin, payments, AI, email automation, Resend, Vercel Cron, public sharing, voting, comments, or realtime collaboration.
- Validation passed: `npm run lint`, `npm run typecheck`, and `npm run build`.

Phase 9 messaging, notifications and activity:

- Inspected required handoff docs, package scripts, App Router routes, Supabase helpers/types, Phase 8 migration constraints, message catalogs, and installed Next.js server action/form/data security docs.
- Added `supabase/migrations/20260703220000_phase9_messaging_notifications_activity.sql`.
- Added `messages`, `notifications`, and `activity_events`.
- Added helper functions for challenge read/participation checks.
- Added database-triggered notifications for friend requests, group invitations, and messages.
- Added database-triggered activity for groups, group members, group challenge links, and messages.
- Added RLS policies for group messages, challenge messages, private notifications, and authorized activity visibility.
- Updated manual database types for Phase 9 tables.
- Added protected `/[locale]/app/notifications` page.
- Added group messages and activity to `/[locale]/app/groups/[id]`.
- Added challenge discussion messages and activity to `/[locale]/app/challenges/[id]`.
- Added server actions for sending messages, soft-deleting messages, and marking notifications read.
- Updated protected navigation and dashboard previews for notifications and recent activity.
- Updated all eleven message catalogs with Phase 9 UI keys.
- Did not implement admin, payments, AI, email automation, Resend, Vercel Cron, public sharing, voting, comments, attachments, read receipts, typing indicators, reactions, threads, calendar integration, PDF export, or realtime subscriptions.
- Validation passed: `npm run lint`, `npm run typecheck`, and `npm run build`.

## 2026-07-04

Phase 10 admin/settings and local project logs:

- Phase completed: Phase 10 Admin/settings and local project logs.
- Features added: protected admin overview at `/[locale]/app/admin`, protected admin settings checklist at `/[locale]/app/admin/settings`, admin navigation visibility, aggregate admin counts, limited admin profile list, recent activity metadata, recent audit-log metadata, and local project-log handoff updates.
- Files created: `app/[locale]/app/admin/page.tsx`, `app/[locale]/app/admin/settings/page.tsx`, and `supabase/migrations/20260704090000_phase10_admin_settings_logs.sql`.
- Files changed: `app/[locale]/app/actions.ts`, `app/[locale]/app/layout.tsx`, `lib/supabase/types.ts`, all `messages/*.json`, core documentation, project map, project log, changelog, and next Codex prompt.
- Database/schema changes: added `public.is_admin(user_id)`, `admin_audit_log`, admin-only RPCs for overview counts/profile list/recent activity/recent audit log, profile role self-change trigger, and an admin profile read policy.
- Security/RLS changes: admin routes check the authenticated user and `profiles.role` server-side; admin RPCs check `public.is_admin(auth.uid())`; `admin_audit_log` is readable only by admins and has no authenticated write grant; normal profile updates no longer touch `profiles.role`; authenticated self role changes are blocked by trigger.
- UI/UX changes: added minimal, calm, responsive admin overview and admin settings checklist pages; admin link appears only for admin profiles; no message bodies, emails, `auth.users`, or private challenge content are shown in the admin overview.
- Bugs fixed: removed the normal profile settings upsert pattern that wrote `role: "user"` and could conflict with role protections or affect existing admin profiles.
- Known problems: Phase 4, Phase 8, Phase 9, and Phase 10 migrations still need to be applied and tested against a real Supabase project; admin role-changing and moderation actions remain future work; non-English admin copy is intentionally simple and should receive native review before launch.
- Validation results: `npm run lint`, `npm run typecheck`, and `npm run build` passed on 2026-07-04.
- Next recommended step: Phase 11 Polish, security review and deployment preparation.
- Explicitly not added: email automation, Resend, Vercel Cron, `CRON_SECRET`, payments, AI, billing, public admin signup, organization accounts, support tickets, moderation system, realtime collaboration, comments, voting, attachments, PDF export, or calendar integration.

Phase 11 polish, security review and deployment preparation:

- Phase completed: Phase 11 Polish, security review and deployment preparation.
- Features added: no large product features; added production verification handoff documentation only.
- Files created: none.
- Files changed: responsive/accessibility polish in protected navigation, dashboard, friends, groups, group detail, challenge workspace, notifications, settings, admin, guest workspace, global CSS, all message catalogs for new group settings labels, and core documentation.
- Database/schema changes: none.
- Security/RLS changes: no policy changes; performed local review of migration intent, RLS coverage, service-role usage, profile self-promotion hardening, guest-mode boundary, message rendering, profile search exposure, group challenge access, notification privacy, and admin protection.
- UI/UX changes: improved mobile/tablet navigation wrapping, dashboard/social grid balance, long text and ID wrapping, visible keyboard focus, admin table accessibility, guest login prompt dialog semantics, and accessible labels for dense group/workspace management forms.
- Bugs fixed: protected pages now ignore unknown `status`/`error` query values instead of attempting arbitrary translation-key lookups.
- Known problems: Supabase CLI is not installed in this environment; live Supabase migrations, RLS, admin RPCs, Auth redirect URLs, OAuth providers, Vercel env vars, Domeneshop DNS, support mailbox/alias, mobile/desktop browser QA, and native translation review remain manual production verification work.
- Validation results: `npm run lint`, `npm run typecheck`, and `npm run build` passed on 2026-07-04. `npm audit` completed with 2 moderate advisories through Next.js bundled PostCSS; the suggested force fix would install `next@9.3.3`, so no automatic fix was applied.
- Next recommended step: production verification and launch readiness.
- Explicitly not added: payments, AI, email automation, Resend, Vercel Cron, `CRON_SECRET`, public challenge sharing, organization accounts, voting, comments, attachments, read receipts, typing indicators, reactions, advanced chat threads, calendar integration, PDF export, complex realtime collaboration, enterprise analytics, moderation system, support ticket system, billing, or a large UI redesign.

Production verification preparation:

- Phase completed: production verification and launch readiness preparation.
- Features added: no product features; added verification/checklist documentation for controlled Supabase, Vercel, Domeneshop, Auth provider, RLS, multi-user manual testing, and launch readiness work.
- Files created: `docs/PRODUCTION_VERIFICATION.md`, `docs/SUPABASE_VERIFICATION.md`, `docs/MANUAL_TEST_PLAN.md`, and `docs/LAUNCH_READINESS_REPORT.md`.
- Files changed: `README.md`, `DEPLOYMENT.md`, `CURRENT_STATE.md`, `docs/CODEX_PROJECT_MAP.md`, `docs/NEXT_CODEX_PROMPT.md`, `docs/CODEX_PROJECT_LOG.md`, and `docs/CHANGELOG.md`.
- Database/schema changes: none.
- Security/RLS changes: none; documented required manual verification for migrations, profile self-promotion protection, challenge/group/message/notification/activity RLS, and admin RPCs.
- UI/UX changes: none.
- Bugs fixed: none.
- Known problems: real Supabase migrations/RLS/RPCs, Supabase Auth redirects, Google/Apple OAuth, Vercel env vars, `noproblemo.tech` DNS, support mailbox/alias, native translation QA, and production browser/device testing remain unverified.
- Validation results: `npm run lint`, `npm run typecheck`, and `npm run build` passed on 2026-07-04. `npm audit` completed with 2 moderate advisories through Next.js bundled PostCSS; the suggested force fix would install `next@9.3.3`, so no automatic fix was applied.
- Next recommended step: controlled Supabase/Vercel production verification with explicit approval before remote migrations, Vercel changes, DNS changes, or provider changes.
- Explicitly not added: payments, AI, email automation, Resend, Vercel Cron, `CRON_SECRET`, public challenge sharing, organization accounts, voting, comments, attachments, read receipts, typing indicators, reactions, advanced chat threads, calendar integration, PDF export, complex realtime collaboration, enterprise analytics, support tickets, billing, or a large UI redesign.

Auth/settings verification fix:

- Phase completed: focused auth/settings verification fix.
- Features added: no large product features; added robust email confirmation callback status handling, forgot-password and reset-password pages, logged-in password change in settings, and route-preserving language switching.
- Files created: `app/[locale]/forgot-password/page.tsx` and `app/[locale]/reset-password/page.tsx`.
- Files changed: auth actions/callback, settings, dashboard, login, protected layout, language switcher, Supabase server helper, all message catalogs, deployment/verification docs, security/current-state docs, changelog, and project log.
- Database/schema changes: none.
- Security/RLS changes: none; password changes and password resets use Supabase Auth with the authenticated anon-key session and do not store password values in application tables.
- UI/UX changes: signup check-email copy is clearer, dashboard shows email-confirmed/account-created success, login shows callback/reset states, settings includes password change and visible route-language switching.
- Bugs fixed: callback exchanges auth codes with a route-handler client that writes cookies to the final redirect response, then redirects to a safe localized internal path with status.
- Known problems: Supabase Auth redirect allow-list still must include locale-specific `/[locale]/auth/callback` URLs for local and production before email confirmation/password recovery can be relied on.
- Validation results: `npm run lint`, `npm run typecheck`, and `npm run build` passed on 2026-07-04.
- Next recommended step: manually test email confirmation, login, password change, forgot-password/reset-password, preferred-locale redirect, and route language switching locally and then in controlled production verification.

Auth callback, recovery, language, and dashboard follow-up:

- Phase completed: focused verification fix, not a new product phase.
- Features added: no large product features; improved email-confirmation fallback status, browser-client recovery-session handling on reset-password, route-preserving language switching, and a cleaner dashboard layout.
- Files created: `app/[locale]/reset-password/_components/reset-password-form.tsx`.
- Files changed: auth callback, auth actions, login, reset-password, language switcher, dashboard, all message catalogs, deployment/security/current-state/README/verification docs, changelog, and project log.
- Database/schema changes: none.
- Security/RLS changes: none; recovery uses Supabase Auth with the public anon client and does not log or store codes, tokens, sessions, cookies, or password values.
- UI/UX changes: login distinguishes "email may already be confirmed" from real callback errors; reset-password explains recovery readiness and failed reset links; dashboard sections are less cluttered; language switcher shows the current route language and preserves the current path where practical.
- Bugs fixed: email confirmation no longer presents a false invalid/expired-link message when the account may already be confirmed; password recovery no longer depends only on server-side PKCE callback exchange; language switching no longer depends on locale-aware link behavior that could keep users on the same locale.
- Known problems: Supabase Auth redirect allow-list still must include all locale-specific callback and reset-password URLs; non-English copy is simple and needs native review before production.
- Validation results: message JSON validity, message key parity, `npm run lint`, `npm run typecheck`, and `npm run build` passed on 2026-07-04.
- Next recommended step: retest signup confirmation, login, forgot-password/reset-password, route language switching, settings preferred locale redirect, and dashboard on local dev with the configured Supabase project.

MVP blocker fix for signup, header, dashboard, language, and account deletion:

- Phase completed: focused MVP blocker fix, not a new product phase.
- Features added: safe signup error classification, resend-confirmation form, compact select-based language switcher, protected app header cleanup, dashboard quick-action separation, and current-user account deletion from settings.
- Files created: `lib/supabase/admin.ts`.
- Files changed: auth actions, signup, login, protected layout, dashboard, settings, language switcher, all message catalogs, security/deployment/current-state/README/verification docs, project map, changelog, and project log.
- Database/schema changes: none.
- Security/RLS changes: no RLS changes; added a server-only Supabase admin helper using `SUPABASE_SERVICE_ROLE_KEY` only for deleting the current authenticated user. The delete action never accepts a client-provided user id.
- UI/UX changes: protected header no longer expands all 11 languages; dashboard has clearer welcome, quick actions, active challenges, pending requests, latest challenges, and activity hierarchy; settings includes a guarded danger zone.
- Bugs fixed: signup no longer collapses every provider outcome into one generic error; language switching uses a real select navigation control that replaces the locale segment and preserves path/search/hash where practical.
- Known problems: account deletion requires server-side `SUPABASE_SERVICE_ROLE_KEY` in the local/deployment environment; deletion cascade/anonymization behavior must be tested with disposable users in Supabase.
- Validation results: message JSON validity, message key parity, `npm run lint`, `npm run typecheck`, `npm run build`, and `git diff --check` passed on 2026-07-04.
- Next recommended step: retest signup/resend, language switching, header layout, dashboard layout, and account deletion locally with disposable accounts before controlled production verification.

Hard i18n audit, reset-password fix, and auth/account verification:

- Phase completed: focused MVP blocker follow-up, not a new product phase.
- Features added: no large product areas; added shared translated password visibility controls and browser-side Supabase password-reset request handling.
- Files created: `app/[locale]/_components/password-field.tsx` and `app/[locale]/forgot-password/_components/forgot-password-form.tsx`.
- Files changed: login, signup, forgot-password, reset-password, settings password fields, all message catalogs, security/deployment/current-state/README/verification docs, changelog, and project log.
- Database/schema changes: none.
- Security/RLS changes: none; recovery uses the public browser Supabase client and does not log or store recovery codes, tokens, sessions, cookies, or passwords. Account deletion remains current-user-only through the server-only admin helper.
- UI/UX changes: Norwegian Bokmål landing, guest workspace, dashboard, protected navigation, settings, collaboration, notification, and admin copy was tightened; password fields now expose accessible show/hide controls.
- Bugs fixed: reset links requested from the app now preserve browser PKCE verifier state; reset-password no longer shows invalid/expired before exchange failure; successful password reset redirects to localized login success.
- Known problems: recovery links requested before this fix may still fail; all non-English translations still need native review before launch.
- Validation results: message JSON validity, message key parity, hardcoded screenshot-string search in `app/`, `npm run lint`, `npm run typecheck`, `npm run build`, and `git diff --check` passed on 2026-07-04.
- Explicitly not added: deployments, remote migrations, Vercel settings, DNS changes, payments, AI, email automation, Resend, Vercel Cron, or new product areas.

Final auth diagnostics and full locale translation cleanup:

- Phase completed: focused MVP blocker follow-up before Vercel.
- Features added: no large product areas; added privacy-safe password-reset request diagnostics and user-facing reset email failure categories.
- Files changed: forgot-password form/page, auth reset fallback action, all message catalogs, security/deployment/current-state/README/verification docs, changelog, and project log.
- Auth changes: browser reset request now uses exactly `window.location.origin/<locale>/reset-password`; no email is added to redirect URLs; development warnings log only generic failure labels.
- i18n changes: non-English message files received a broad machine-quality cleanup pass for exact English fallbacks and the requested obvious English fallback phrase list.
- Known problems: reset email sending can still fail because of Supabase-side SMTP/provider setup, rate limits, redirect allow-list, Site URL, or Auth template/provider errors; native translation review remains required.
- Explicitly not changed: remote Supabase Auth settings, remote migrations, Vercel settings, DNS, deployments, or environment values.

Forgot-password crash and reset-link clarity follow-up:

- Phase completed: focused bugfix, not a new product phase.
- Features added: no product areas; added clearer localized reset-link recovery help.
- Files changed: forgot-password form, reset-password form/page, all message catalogs, security/deployment/current-state/README/verification docs, changelog, and project log.
- Bugs fixed: forgot-password success no longer crashes by reading `event.currentTarget` after async Supabase work; the form now captures the form element before awaits.
- Recovery behavior: reset-password still uses the browser Supabase client, keeps fields disabled until recovery is ready, and now explains that PKCE reset links should be opened in the same browser/profile used to request them.
- Known problems: links opened in another browser/profile can still fail by design because the Supabase PKCE verifier is browser-local; old reset links may need to be resent.
- Explicitly not changed: remote Supabase Auth settings, remote migrations, Vercel settings, DNS, deployments, or environment values.

Isolated browser password recovery follow-up:

- Phase completed: focused auth bugfix, not a new product phase.
- Files created: `lib/supabase/recovery-client.ts`.
- Files changed: forgot-password form, reset-password form, all message catalogs, security/deployment/current-state/README/verification docs, changelog, and project log.
- Root cause: same-browser recovery links still failed with `verifier-missing-or-expired`, indicating the main SSR/cookie-oriented Supabase browser client was not reliably preserving or reading the password recovery PKCE verifier locally.
- Fix: forgot/reset password now use a dedicated browser-only Supabase recovery client with implicit recovery handling. Hash tokens stay in the browser URL fragment, the reset page clears them after session setup, password update uses Supabase Auth, then the app signs out and redirects to localized login success.
- Security: no service-role key is used for reset and reset passwords are never stored in app database tables.
- Known problems: reset links created before this fix may fail; request a fresh reset link for testing.
- Explicitly not changed: email confirmation flow, remote Supabase Auth settings, remote migrations, Vercel settings, DNS, deployments, or environment values.

Design refresh, support email, email-only auth, and PDF export:

- Phase completed: focused MVP improvement, not a new product phase.
- Visual direction: added global light modern design tokens with blue primary actions, green success accents, soft orange highlights, white surfaces, dark readable text, and a subtle digital-grid background.
- Support: public support email changed to `david@fideli.no` in app UI, env examples, and docs.
- Auth UI: Google/Apple buttons were removed from visible login/signup pages; email login/signup remains active. OAuth actions remain future/planned in code.
- Export: saved challenge workspace now includes browser print-based Save as PDF alongside Markdown copy/download. The printable view uses already-authorized challenge data and no external PDF service.
- Known problems: Supabase reset email requests can be rate-limited during repeated testing; retest password reset later rather than changing remote Auth settings.
- Native review: non-English copy still needs fluent/native review before public launch.
- Explicitly not changed: remote Supabase Auth settings, remote migrations, Vercel settings, DNS, deployments, or environment values.

PDF export and reset rate-limit polish:

- Phase completed: focused MVP polish/fix, not a new product phase.
- Export: saved challenge Save as PDF now uses a compact print report layout with app chrome hidden, A4 margins, tighter typography, compact solution blocks, task table layout, and omitted empty sections where practical.
- Auth UX: forgot-password rate-limit failures now use clearer localized copy and a short client-side cooldown to reduce repeated clicks. Supabase `over_email_send_rate_limit` / 429 remains an external provider limit and is not bypassed.
- Recovery client: verified the password recovery Supabase client remains a browser singleton with the separate recovery storage key and public anon credentials only.
- Documentation: updated current state, README, security, deployment, production verification, changelog, and project log with compact PDF and Supabase email rate-limit guidance.
- Explicitly not changed: remote Supabase Auth settings, remote migrations, Vercel settings, DNS, deployments, or environment values.

PDF blank-page fix:

- Phase completed: focused PDF export bugfix, not a new product phase.
- Root cause: same-page print CSS used `visibility: hidden` on the normal challenge workspace. Firefox preserved the hidden workspace layout height, so the absolutely positioned report produced multiple blank trailing pages.
- Fix: Save as PDF now opens a protected print-only report route at `/[locale]/app/challenges/[id]/print`. The route renders only report content plus screen-only Back/Print controls, uses the authenticated Supabase server client, relies on RLS, and does not use service-role credentials.
- Print layout: app chrome and screen controls are hidden in print; the report uses A4 margins, compact typography, compact solution blocks, task table formatting, and omits empty fields where practical.
- Security: no external PDF service, no dependency, no migration, no deployment setting, and no remote Supabase setting changed.
