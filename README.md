# NoProblemo

NoProblemo is a minimal, secure, multilingual problem-solving workspace for turning messy challenges into clearer decisions, action plans, and group discussions. It is built as a Next.js App Router MVP with Supabase Auth/Postgres/RLS.

## Current Phase

Phase 11 is complete. Production verification preparation is documented. The next step is controlled Supabase/Vercel production verification, with explicit approval required before applying remote migrations or changing production services.

Not included in the current MVP:

- Payments
- AI features
- Resend email
- Vercel Cron
- Email automation
- Advanced realtime collaboration

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- `next-intl`
- Supabase Auth and database/RLS foundation
- Vercel deployment

## MVP State

Implemented locally:

- Public landing, support, login, signup, and guest solve routes.
- Guest workspace stored only in browser localStorage.
- Supabase email auth and prepared Google/Apple OAuth starts.
- Protected dashboard, profile settings, saved challenge creation, saved challenge workspace, and guest import.
- Friends, groups, group invitations, group roles, and explicit group challenge links.
- Group messages, challenge discussion messages, private notifications, and scoped activity events.
- Protected read-only admin overview and admin settings checklist.
- Local Codex project logs in repository docs.

Still requiring real Supabase/Vercel verification:

- Applying all migrations to a real Supabase project.
- RLS behavior with multiple authenticated users.
- Supabase Auth email/OAuth provider configuration and redirect URLs.
- Vercel environment variables, custom domain, and Domeneshop DNS.
- Production manual testing across mobile, desktop, all 11 locales, and Arabic/Urdu RTL.
- Support mailbox or alias setup for `support@noproblemo.tech`.

## Internationalization

Supported locales:

- `en`
- `zh-CN`
- `hi`
- `es`
- `ar`
- `fr`
- `bn`
- `pt-BR`
- `id`
- `ur`
- `nb`

Routes are locale-prefixed, for example `/en`, `/nb`, `/es`, `/fr`, `/ar`, and `/ur`. The root route `/` redirects to a locale using `next-intl` middleware detection with `en` as the fallback.

Arabic (`ar`) and Urdu (`ur`) render with `dir="rtl"`. All other supported locales render with `dir="ltr"`.

## Public Routes

- `/[locale]` public landing page
- `/[locale]/solve` guest problem-solving workspace
- `/[locale]/support` support/contact page
- `/[locale]/login` email login and Google/Apple OAuth start route
- `/[locale]/signup` email signup and Google/Apple OAuth start route
- `/[locale]/forgot-password` password reset request route
- `/[locale]/reset-password` password reset completion route
- `/[locale]/auth/callback` Supabase auth callback
- `/[locale]/auth/logout` logout handler
- `/[locale]/app` protected dashboard
- `/[locale]/app/challenges/new` minimal protected challenge creation
- `/[locale]/app/challenges/[id]` protected saved challenge workspace
- `/[locale]/app/friends` protected friends page
- `/[locale]/app/groups` protected groups list
- `/[locale]/app/groups/new` protected group creation
- `/[locale]/app/groups/[id]` protected group detail, invitations, members, and linked challenges
- `/[locale]/app/notifications` protected private notifications page
- `/[locale]/app/admin` protected admin overview
- `/[locale]/app/admin/settings` protected admin readiness/settings checklist
- `/[locale]/app/settings` protected profile/settings page

## Guest Mode

Guest users can start a problem-solving session without login. Drafts are stored in local browser storage under `noproblemo.guestWorkspace.v1`. Guests can copy or export a Markdown summary.

Actions that require cloud saving or collaboration show a login prompt instead of performing the action.

Logged-in users can import the current guest draft from the dashboard. Import creates a private draft challenge and related challenge sections through the authenticated Supabase session, then marks the local draft with `importedChallengeId` to avoid repeated imports from the same browser draft.

## Authentication

Email login/signup uses Supabase Auth. Signup failures are mapped to safe categories such as invalid email, weak password, rate limit, pending confirmation, provider configuration, or generic failure without exposing raw provider details. Google and Apple login buttons are prepared through Supabase OAuth, but they require provider configuration in Supabase, Google Cloud, and Apple Developer before production use.

Email confirmation and OAuth use locale-specific `/[locale]/auth/callback` routes. If Supabase confirms an email but the server callback cannot exchange the PKCE code for a session, the login page shows a calm "email may already be confirmed" state instead of a false invalid-link error.

Password recovery links should open `/[locale]/reset-password` directly. Forgot/reset password use an isolated browser-only Supabase recovery client to establish the recovery session and then update the password through Supabase Auth. This reset flow uses only the public Supabase URL and anon key, and it does not use the service-role key.

For local password-reset testing, request a fresh reset email after the latest recovery fix and open the link in the same browser/profile that requested it. The isolated recovery flow can use browser URL hash tokens, which stay in the browser and are cleared after session setup. Old reset links may need to be resent after recovery-flow fixes.

The Phase 4 database trigger is expected to create `profiles` rows after signup, but it still needs verification after the migration is applied to the real Supabase project.

## Dashboard, Workspace And Settings

The dashboard lists the authenticated user's saved challenges through Supabase RLS, shows empty/error states, keeps pending friend/group/notification items separate, and provides minimal quick actions.

The saved challenge workspace supports the seven-step problem-solving workflow, editable challenge sections, possible solutions, pros/cons, risk/effort/impact scoring, tasks/actions, final recommendation, summary, and Markdown copy/download export.

Profile settings can update `display_name` and `preferred_locale`. The preferred locale is saved to `profiles.preferred_locale`, then the settings page reopens in the selected locale. Logged-in users can also change their password through Supabase Auth.

Settings also include account deletion. The delete action requires a checkbox plus typing `DELETE`, verifies the current authenticated user server-side, and uses a server-only Supabase admin helper with `SUPABASE_SERVICE_ROLE_KEY`. The key must be configured only in the server environment and never exposed to the browser.

## Friends And Groups

Logged-in users can send friend requests, accept or decline incoming requests, cancel outgoing requests, view friends, and remove friendships. Friendship alone does not grant challenge access.

Logged-in users can create private groups, invite users, accept or decline group invitations, manage basic roles, and link selected owned challenges to a group. Group challenge access is explicit through `group_challenges` and protected by Supabase RLS. The 100-member group limit is enforced in the Phase 8 migration.

The limited profile search RPC returns only `id`, `display_name`, and `avatar_url`; it does not expose emails or `auth.users`.

## Messaging, Notifications And Activity

Logged-in group members can read group messages. Group owners, admins, and members can send group messages; viewers are read-only. Logged-in challenge owners and allowed group collaborators can read and send challenge discussion messages according to RLS.

Notifications are private to the recipient and appear under `/[locale]/app/notifications`. Activity events are visible only to users who can access the related group or challenge. Phase 9 uses server-rendered refresh after message actions; Supabase Realtime remains a future enhancement.

## Admin

Admins are identified by `profiles.role = 'admin'`. Admin routes check the authenticated Supabase session and the database profile role server-side before rendering. Non-admin users receive a not-found response and do not receive admin data.

The Phase 10 admin overview shows aggregate counts, limited profile metadata, recent activity metadata, and recent admin audit-log entries. It does not query `auth.users`, expose emails, or show private message bodies or challenge content.

The first admin should be assigned manually in the Supabase SQL editor by a trusted project owner, for example:

```sql
update public.profiles
set role = 'admin'
where id = '<trusted-user-uuid>';
```

Do not build a public admin signup flow. Normal users cannot self-promote through the app.

## Local Setup

Install dependencies:

```bash
npm install
```

Create local environment variables from the safe template:

```bash
cp .env.local.example .env.local
```

Do not commit `.env.local` or any real secret values.

Required local variables are listed in `.env.local.example`. Use real values only in local `.env.local` and Vercel project settings:

```bash
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPPORT_EMAIL=support@noproblemo.tech
```

`SUPABASE_SERVICE_ROLE_KEY` is server-only and is used by `lib/supabase/admin.ts` for current-user account deletion. It is not used by the frontend and must never be exposed to the browser.

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Validation

Run these before merging changes:

```bash
npm run lint
npm run typecheck
npm run build
npm audit
```

Do not run broad automatic `npm audit fix` changes without reviewing dependency impact.

## Supabase Migration Notes

Local migrations live in `supabase/migrations/`:

- Phase 4: profiles and core challenge tables.
- Phase 8: friends, groups, invitations, group links, and group-aware RLS.
- Phase 9: messages, notifications, activity events, and related triggers.
- Phase 10: admin helpers, admin audit log, admin-only RPCs, and profile role hardening.

Before production, apply migrations to a real Supabase project only through an approved deployment workflow, then test RLS with separate normal and admin users.

The first admin must be assigned manually by a trusted project owner in Supabase SQL:

```sql
update public.profiles
set role = 'admin'
where id = '<trusted-user-uuid>';
```

Do not build public admin signup or self-service admin promotion.

## Deployment Direction

Use GitHub plus Vercel for the app and Supabase for Auth/Postgres/RLS. Configure `noproblemo.tech` as a Vercel custom domain, point DNS from Domeneshop according to Vercel's current instructions, and configure `support@noproblemo.tech` as a mailbox or alias outside the app.

Use these verification documents before public launch:

- `docs/PRODUCTION_VERIFICATION.md`
- `docs/SUPABASE_VERIFICATION.md`
- `docs/MANUAL_TEST_PLAN.md`
- `docs/LAUNCH_READINESS_REPORT.md`

Production readiness requires manual verification of guest mode, login/signup/logout, dashboard, challenge saving, guest import, friends/groups, group challenge access, messages, notifications, admin access, all 11 languages, Arabic/Urdu RTL, mobile, and desktop.

## Security Warnings

- Do not read, print, commit, or expose `.env.local`.
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` in frontend/client code.
- Do not query `auth.users` from frontend code.
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only. It is used only by `lib/supabase/admin.ts` for current-user account deletion.
- Keep private challenge/message/group/notification/activity access behind Supabase Auth and RLS.
- Guest drafts remain browser-local unless explicitly imported by a logged-in user.
- Message bodies render as plain React text, not raw HTML.
- Non-English translations are simple and need native review before launch.

## Auth And i18n Notes

- Locale-prefixed routes control visible UI language through `next-intl` message files.
- The language switcher preserves the current route while replacing the locale segment.
- Password reset is a browser-client Supabase recovery flow; old reset emails requested before the latest fixes may need a fresh reset link.
- Reset email failures are mapped to safe categories. If sending still fails, check Supabase Auth logs, SMTP/provider configuration, rate limits, and redirect URL allow-list settings.
- Required Supabase Auth redirects include local and production wildcard routes plus every locale-specific `/auth/callback` and `/reset-password` URL.
- Account deletion is guarded by explicit confirmation, uses a server-only service-role helper, and must be tested only with disposable accounts.
- Non-English translations are machine-quality and need native review before public launch.

## Known Limitations

- Supabase migrations/RLS/RPC behavior still need live verification.
- Google and Apple OAuth require provider setup.
- Realtime subscriptions are not implemented.
- Admin user management is read-only.
- Group-linked viewer read-only UX is still mostly enforced by RLS/server failures rather than hiding every edit control.
- Guest drafts can be lost if browser storage is cleared.

## Project Documents

- `CURRENT_STATE.md`
- `PROJECT_BRIEF.md`
- `ARCHITECTURE.md`
- `DATABASE_SCHEMA.md`
- `SECURITY.md`
- `UX_UI_GUIDE.md`
- `ROADMAP.md`
- `DEPLOYMENT.md`
- `AI_READY.md`
- `docs/CODEX_PROJECT_MAP.md`
- `docs/PHASE_HANDOFF_TEMPLATE.md`
- `docs/PRODUCTION_VERIFICATION.md`
- `docs/SUPABASE_VERIFICATION.md`
- `docs/MANUAL_TEST_PLAN.md`
- `docs/LAUNCH_READINESS_REPORT.md`
- `docs/CODEX_PROJECT_LOG.md`
- `docs/NEXT_CODEX_PROMPT.md`
- `docs/CHANGELOG.md`

Project logs are local repository documents only. No email automation, Resend integration, Vercel Cron job, or weekly email reporting is used for project logs.

## Repository Hygiene

- Keep `.env*` files ignored except committed templates.
- Read `CURRENT_STATE.md`, `docs/CODEX_PROJECT_MAP.md`, and `AGENTS.md` before making code changes.
- Read the installed Next.js docs in `node_modules/next/dist/docs/` before using Next APIs.
- Keep the next phase limited to the explicitly requested scope.
