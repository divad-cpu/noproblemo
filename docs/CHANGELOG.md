# Changelog

## Unreleased

### Added

- Added privacy-safe forgot-password failure categories for reset rate limits, provider/SMTP issues, invalid email format, redirect URL configuration, and generic send failure.
- Added localized same-browser/profile guidance for reset links that fail because Supabase PKCE verifier state is missing or expired.
- Added an isolated browser-only Supabase recovery client for forgot-password and reset-password.
- Added shared translated show/hide password controls for login, signup, reset-password, and settings password change.
- Added browser-side Supabase password-reset request handling so PKCE recovery links can be exchanged by `/[locale]/reset-password`.
- Added forgot-password and reset-password routes using Supabase Auth reset links.
- Added logged-in password change to protected settings.
- Added account-created, email-confirmed, password-reset, and password-updated UI states.
- Added protected admin overview at `/[locale]/app/admin`.
- Added protected admin settings checklist at `/[locale]/app/admin/settings`.
- Added Phase 10 Supabase migration for admin helpers, admin audit-log storage, admin-only overview RPCs, and profile role hardening.
- Added admin navigation visibility for profiles with `role = 'admin'`.
- Added local project-log documentation updates and a Phase 11 copy/paste handoff prompt.
- Added Phase 11 production verification and launch-readiness handoff documentation.
- Added production verification, Supabase verification, manual test plan, and launch readiness report documents.
- Added accessible dialog semantics for the guest login prompt.
- Added accessible labels for dense group/workspace management controls.
- Added a browser-client password recovery completion form for Supabase reset links.
- Added safe signup error classification and resend-confirmation handling.
- Added server-only current-user account deletion from settings.

### Changed

- Changed browser password-reset requests to use exactly `/<locale>/reset-password` on the current origin, without extra query parameters.
- Changed password reset recovery to use a dedicated implicit browser recovery flow instead of the main SSR/cookie-oriented client.
- Changed forgot-password help text to mention that local reset links should be opened in the same browser/profile where they were requested.
- Cleaned non-English locale files with machine-quality translations for exact English fallback values.
- Changed reset-password to show a checking state, enable fields only after recovery readiness, and redirect to localized login success after update.
- Tightened Norwegian Bokmål UI copy across landing, guest workspace, dashboard, protected navigation, settings, collaboration, notifications, and admin surfaces.
- Preserved matching message keys across all 11 locale catalogs and kept non-English copy ready for native review.
- Changed auth callback handling to attach Supabase session cookies to the final redirect response and add localized success status redirects.
- Changed email-confirmation callback failures to show a login-required success state when Supabase may already have confirmed the account.
- Changed password reset links to open `/[locale]/reset-password` directly instead of depending on server-side callback exchange.
- Changed the language switcher to preserve the current route when switching locales where practical.
- Changed the protected app header to use compact navigation and a single language dropdown.
- Changed preferred-locale profile save to reopen settings in the selected locale.
- Changed profile settings updates so normal profile edits no longer update `profiles.role`.
- Updated all locale message catalogs with admin UI keys.
- Updated project documentation to mark Phase 10 complete, Phase 11 complete, and production verification next.
- Polished protected navigation wrapping, dashboard/admin grid balance, long-text wrapping, and keyboard focus visibility.
- Updated README and deployment documentation for practical Supabase/Vercel/Domeneshop launch preparation.
- Updated handoff documentation to require controlled approval before remote Supabase, Vercel, Auth provider, or DNS changes.

### Fixed

- Fixed password reset links requested from the app by keeping Supabase PKCE recovery state in the browser client.
- Fixed local password recovery links that still failed with `verifier-missing-or-expired` by isolating reset recovery from the main SSR Supabase client.
- Fixed the forgot-password success crash by capturing the form element before async Supabase work and resetting that stable reference.
- Fixed reset-password invalid/expired text appearing before the recovery exchange had actually failed.
- Fixed the profile settings self-demotion/self-promotion risk from using an upsert that touched `role` during normal profile edits.
- Guarded status/error query feedback on protected pages so unknown query values do not cause missing translation lookups.
- Fixed password recovery links that could fail with the same generic callback error as email confirmation.
- Cleaned up the dashboard into overview, active challenges, pending requests, latest challenges, and recent activity sections.
- Fixed the protected header language list clutter by replacing expanded locale links with a select control.

### Security

- Added development-only reset request warnings that log only generic classification labels and never email addresses, auth codes, tokens, sessions, cookies, full URLs, or env values.
- Added development-only reset exchange warnings that log only generic classification labels and never auth codes, tokens, sessions, cookies, URLs, emails, passwords, or environment values.
- Documented that reset recovery uses no service-role key and never stores reset passwords in app database tables.
- Documented that account deletion remains current-user-only through a server-only service-role helper and must be tested only with disposable accounts.
- Confirmed no remote Supabase migrations, Vercel settings, DNS changes, deployments, or env changes were made for the hard i18n/reset follow-up.
- Added password update/reset flows through Supabase Auth without service-role usage or password storage in database tables.
- Added server-only service-role usage for current-user account deletion; no service-role key is used in frontend/client code.
- Documented required locale-specific Supabase Auth callback URLs for email confirmation, OAuth, and password recovery.
- Added `public.is_admin(user_id)` for database-backed admin checks.
- Added admin-only RLS for `admin_audit_log`.
- Added a trigger that blocks authenticated users from changing their own `profiles.role`.
- Added admin-only RPCs that return aggregate counts and limited metadata without emails, `auth.users`, message bodies, or private challenge content.
- Confirmed no Resend, email automation, Vercel Cron, `CRON_SECRET`, or frontend service-role usage was added.
- Reviewed MVP security boundaries, migration/RLS intent, i18n key parity, and RTL configuration for Phase 11.
- Documented that live Supabase RLS/RPC verification remains required.
- Documented `npm audit` moderate PostCSS advisories through Next.js and did not apply the breaking force fix.
- Documented production launch blockers and manual verification requirements without changing production services.

## 2026-07-03

- Established Phase 1 project foundation documentation.
- Added `.env.local.example` with placeholder-only Supabase public variables.
- Updated `.gitignore` to keep real `.env*` files ignored while allowing safe templates.
- Added `npm run typecheck`.
- Updated README and AGENTS project guidance.
- Replaced default Next.js scaffold content with a minimal NoProblemo foundation page.
- Confirmed lint, typecheck, and production build pass.

## 2026-07-03 Phase 2

- Installed and configured `next-intl`.
- Added locale-prefixed routing for all supported Phase 2 locales.
- Added message catalogs for `en`, `zh-CN`, `hi`, `es`, `ar`, `fr`, `bn`, `pt-BR`, `id`, `ur`, and `nb`.
- Added a simple language switcher.
- Added RTL document direction for Arabic and Urdu.
- Updated project documentation for the Phase 3 handoff.
- Confirmed lint, typecheck, and production build pass.

## 2026-07-03 Phase 3

- Added a localized public landing page.
- Added guest problem-solving workspace at `/[locale]/solve`.
- Added localStorage draft persistence for guest work.
- Added Markdown summary copy and export actions.
- Added login prompt for guest actions that require cloud saving or collaboration.
- Added support page at `/[locale]/support` with `support@noproblemo.tech`.
- Added placeholder login and signup routes without implementing authentication.
- Updated documentation for Phase 4 Supabase foundation handoff.
- Confirmed lint, typecheck, and production build pass.

## 2026-07-03 Project Map

- Added `CURRENT_STATE.md`.
- Added `docs/CODEX_PROJECT_MAP.md`.
- Added `docs/PHASE_HANDOFF_TEMPLATE.md`.
- Updated core project documentation for durable Codex handoff.
- Clarified implemented versus planned product areas.
- Confirmed lint, typecheck, and production build pass.

## 2026-07-03 Phase 4

- Added Supabase packages for browser/server helper scaffolding.
- Added Phase 4 Supabase migration for profiles and core challenge tables.
- Added updated-at triggers and profile creation trigger.
- Added owner-only RLS policies for profiles, challenges, sections, solutions, and tasks.
- Added manual database types and minimal Supabase helpers.
- Updated environment examples for Supabase and support variables.
- Updated documentation for Phase 5 authentication handoff.
- Confirmed lint, typecheck, and production build pass.

## 2026-07-03 Phase 5

- Replaced auth placeholder pages with Supabase Auth email login and signup.
- Added Google and Apple OAuth start actions using Supabase Auth providers.
- Added Supabase auth callback and logout route handlers.
- Added a minimal protected `/[locale]/app` route boundary.
- Added auth-aware landing page links for logged-in/logged-out states.
- Updated all locale message catalogs with auth UI keys.
- Updated documentation for Phase 6 dashboard and guest import handoff.
- Confirmed lint, typecheck, and production build pass.

## 2026-07-03 Phase 6

- Added protected dashboard at `/[locale]/app`.
- Added authenticated Supabase challenge lists with active/latest sections.
- Added guest draft detection for `noproblemo.guestWorkspace.v1`.
- Added guest import to `challenges` and `challenge_sections`.
- Added browser-local imported draft marking with `importedChallengeId`.
- Added minimal protected challenge creation route.
- Added minimal protected saved challenge continuation route.
- Added protected profile/settings page with display name and preferred locale saving.
- Updated all locale message catalogs with Phase 6 UI keys.
- Updated documentation for Phase 7 challenge workspace handoff.
- Confirmed lint, typecheck, and production build pass.

## 2026-07-03 Phase 7

- Upgraded saved challenge continuation route into a protected workspace.
- Added seven-step problem-solving workflow UI.
- Added challenge details and status editing.
- Added editable challenge sections saved to `challenge_sections`.
- Added possible solution create/edit/delete using `challenge_solutions`.
- Added task/action create/edit/delete using `challenge_tasks`.
- Added final recommendation and summary sections.
- Added Markdown copy/download export.
- Updated all locale message catalogs with Phase 7 UI keys.
- Updated documentation for Phase 8 friends and groups handoff.
- Confirmed lint, typecheck, and production build pass.

## 2026-07-03 Phase 8

- Added Phase 8 Supabase migration for friend requests, friendships, groups, group members, group invitations, and group challenge links.
- Added RLS helper functions and policies for friends, groups, group invitations, roles, 100-member group limit, and linked challenge access.
- Added limited authenticated profile search RPC that returns only `id`, `display_name`, and `avatar_url`.
- Added protected friends page with send, accept, decline, cancel, and remove friend flows.
- Added protected groups pages with create group, invite users, accept/decline invitations, manage roles, remove members, and link owned challenges.
- Updated challenge workspace access to read through RLS so linked group challenges can open for authorized group members.
- Updated dashboard and protected navigation for friends and groups.
- Updated all locale message catalogs with Phase 8 UI keys.
- Updated documentation for Phase 9 messaging, notifications, and activity handoff.
- Confirmed lint, typecheck, and production build pass.

## 2026-07-03 Phase 9

- Added Phase 9 Supabase migration for messages, notifications, and activity events.
- Added RLS helper functions and policies for group messages, challenge messages, private notifications, and activity visibility.
- Added database-triggered notification and activity side effects for key collaboration events.
- Added protected notifications page.
- Added group messages and group activity to group detail pages.
- Added challenge discussion messages and challenge activity to saved challenge workspaces.
- Added message send, soft-delete, mark notification read, and mark all notifications read server actions.
- Updated dashboard and protected navigation for notifications and recent activity.
- Updated all locale message catalogs with Phase 9 UI keys.
- Updated documentation for Phase 10 admin/settings and local project logs handoff.
- Confirmed lint, typecheck, and production build pass.
