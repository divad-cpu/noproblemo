# Production Verification

Last updated: 2026-07-05

## Purpose

This document prepares NoProblemo for controlled production verification. It is a checklist and evidence log for Supabase, Vercel, Domeneshop DNS, Auth providers, RLS, manual app flows, and launch readiness.

Do not use this document as permission to deploy, apply remote migrations, change DNS, or change Vercel settings. Those actions require explicit approval from the project owner.

## Current Readiness Status

- Phase 1 through Phase 11 are complete in the repository.
- Local validation previously passed for lint, typecheck, and build.
- Production verification preparation is documented.
- Real Supabase migrations, RLS, RPCs, Auth redirects, OAuth providers, Vercel environment variables, custom domain, Domeneshop DNS, and support mailbox/alias are still unverified.
- Public launch is blocked until real production verification is complete.
- Controlled internal testing can begin after migrations and environment configuration are verified.

## Prerequisites

- Clean or intentionally understood git working tree.
- Access to the GitHub repository.
- Access to the intended Vercel project.
- Access to the intended Supabase project.
- Access to Domeneshop DNS for `noproblemo.tech`.
- Access to Google Cloud OAuth configuration if Google login is enabled in a later phase.
- Access to Apple Developer configuration if Apple login is enabled in a later phase.
- Access to the public support mailbox `david@fideli.no`.
- Three test users:
  - User A: normal user.
  - User B: normal user.
  - User C: admin user.

## Required Accounts

- GitHub account with repository access.
- Vercel account with project access.
- Supabase account with project owner or admin access.
- Domeneshop account with DNS access.
- Google Cloud account for OAuth credentials.
- Apple Developer account for Apple OAuth.
- Email provider account for `david@fideli.no`.

## Supabase Checklist

- Create or confirm the production Supabase project.
- Confirm the project URL matches `NEXT_PUBLIC_SUPABASE_URL`.
- Confirm the anon key matches `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Keep the service role key server-only and out of frontend code.
- Apply migrations in chronological order only through an approved workflow.
- Confirm all expected tables exist.
- Confirm RLS is enabled on private tables.
- Confirm helper functions and triggers exist.
- Confirm the profile creation trigger works after signup.
- Confirm signup failures show safe categories without exposing provider details.
- Confirm resend confirmation does not reveal whether an email exists.
- Confirm `profiles.role` supports only `user` and `admin`.
- Confirm normal users cannot self-promote to admin.
- Confirm admin RPCs reject non-admin users.
- Confirm `admin_audit_log` is readable only by admins.
- Confirm no app code queries `auth.users` from the frontend.

## Vercel Checklist

- Connect the GitHub repository to Vercel.
- Confirm the framework preset is Next.js.
- Confirm the build command is `npm run build`.
- Configure production environment variables without exposing values in logs or docs.
- Configure preview environment variables separately if previews are used.
- Confirm `NEXT_PUBLIC_SITE_URL` matches the production URL.
- Deploy only after local validation passes.
- Smoke-test the deployed URL before adding the custom domain.
- Add `noproblemo.tech` only after explicit approval.
- Confirm HTTPS after DNS propagation.

## Domeneshop DNS Checklist

- Confirm the domain owner and active DNS zone for `noproblemo.tech`.
- Add only the DNS records requested by Vercel.
- Preserve existing required email records if a support mailbox or alias is already configured.
- Do not remove MX, SPF, DKIM, or DMARC records without explicit approval.
- Wait for propagation.
- Verify `https://noproblemo.tech`.
- Verify any `www` behavior chosen for the project.

## Auth Redirect URL Checklist

- Configure Supabase Site URL to the production site URL.
- Add local redirect URLs for development.
- Add production callback URLs for locale-aware auth callback routes.
- Add locale-aware reset-password URLs because password recovery links should open `/[locale]/reset-password` directly and let the isolated browser recovery client establish the recovery session.
- During local reset-password testing, request a fresh link after the isolated recovery fix and open it in the same browser/profile where the request was made.
- Reset links requested before the isolated browser recovery fix may need to be resent.
- The reset flow does not use `SUPABASE_SERVICE_ROLE_KEY` and does not store reset passwords in app database tables.
- Confirm email confirmation shows either `email-confirmed` in the app or a login-required success state if Supabase confirmed the account but the server callback could not exchange the PKCE code.
- Confirm login, signup, callback, and logout on production.
- Confirm visible login/signup UI is email-only until Google/Apple providers are intentionally enabled later.
- Confirm account deletion with a disposable user only after `SUPABASE_SERVICE_ROLE_KEY` is configured server-side.
- Confirm failed auth attempts return calm error states.
- Confirm `NEXT_PUBLIC_SITE_URL` in Vercel matches the deployed domain.

Required local callback URLs:

- `http://localhost:3000/**`
- `http://localhost:3000/en/auth/callback`
- `http://localhost:3000/zh-CN/auth/callback`
- `http://localhost:3000/hi/auth/callback`
- `http://localhost:3000/es/auth/callback`
- `http://localhost:3000/ar/auth/callback`
- `http://localhost:3000/fr/auth/callback`
- `http://localhost:3000/bn/auth/callback`
- `http://localhost:3000/pt-BR/auth/callback`
- `http://localhost:3000/id/auth/callback`
- `http://localhost:3000/ur/auth/callback`
- `http://localhost:3000/nb/auth/callback`
- `http://localhost:3000/en/reset-password`
- `http://localhost:3000/zh-CN/reset-password`
- `http://localhost:3000/hi/reset-password`
- `http://localhost:3000/es/reset-password`
- `http://localhost:3000/ar/reset-password`
- `http://localhost:3000/fr/reset-password`
- `http://localhost:3000/bn/reset-password`
- `http://localhost:3000/pt-BR/reset-password`
- `http://localhost:3000/id/reset-password`
- `http://localhost:3000/ur/reset-password`
- `http://localhost:3000/nb/reset-password`

Required production callback URLs:

- `https://noproblemo.tech/**`
- `https://noproblemo.tech/en/auth/callback`
- `https://noproblemo.tech/zh-CN/auth/callback`
- `https://noproblemo.tech/hi/auth/callback`
- `https://noproblemo.tech/es/auth/callback`
- `https://noproblemo.tech/ar/auth/callback`
- `https://noproblemo.tech/fr/auth/callback`
- `https://noproblemo.tech/bn/auth/callback`
- `https://noproblemo.tech/pt-BR/auth/callback`
- `https://noproblemo.tech/id/auth/callback`
- `https://noproblemo.tech/ur/auth/callback`
- `https://noproblemo.tech/nb/auth/callback`
- `https://noproblemo.tech/en/reset-password`
- `https://noproblemo.tech/zh-CN/reset-password`
- `https://noproblemo.tech/hi/reset-password`
- `https://noproblemo.tech/es/reset-password`
- `https://noproblemo.tech/ar/reset-password`
- `https://noproblemo.tech/fr/reset-password`
- `https://noproblemo.tech/bn/reset-password`
- `https://noproblemo.tech/pt-BR/reset-password`
- `https://noproblemo.tech/id/reset-password`
- `https://noproblemo.tech/ur/reset-password`
- `https://noproblemo.tech/nb/reset-password`

## Google OAuth Checklist

- Create or confirm the Google Cloud OAuth app.
- Configure authorized JavaScript origins for local and production domains.
- Configure authorized redirect URLs required by Supabase.
- Enable the Google provider in Supabase.
- Store Google client secret only in Supabase/provider settings.
- Keep Google login treated as planned/future until the UI and provider setup are intentionally enabled.
- Test Google login with a non-admin user only after that future enablement.
- Confirm profile creation and dashboard access after login.

## Apple OAuth Checklist

- Confirm Apple Developer account access.
- Configure Services ID and verified domain.
- Configure the return URL required by Supabase.
- Enable the Apple provider in Supabase.
- Store Apple private key/secret only in Supabase/provider settings.
- Keep Apple login treated as planned/future until the UI and provider setup are intentionally enabled.
- Test Apple login with a non-admin user only after that future enablement.
- Confirm profile creation and dashboard access after login.

## Support Email Checklist

- Use `david@fideli.no` as the public support mailbox outside the app.
- Verify inbound delivery.
- Verify reply/send behavior.
- Confirm DNS records required by the email provider.
- Confirm the public app references `david@fideli.no`.
- Do not add Resend, email automation, Vercel Cron, or project-log email reporting.

## PDF Export Checklist

- Open a saved challenge.
- Click Save as PDF in the export panel.
- Confirm a protected `/[locale]/app/challenges/[id]/print` report view opens.
- Click Print or save as PDF.
- Confirm the browser print dialog opens.
- Choose Save to PDF.
- Confirm the print preview uses the compact report layout rather than the normal app page.
- Confirm navigation, forms, buttons, messages, status banners, language switcher, and private app chrome are hidden from the print output.
- Confirm empty challenge sections are omitted where practical and no repeated placeholder text fills the PDF.
- Confirm Firefox print preview does not create blank trailing pages.
- Confirm the PDF includes challenge title, description, status, sections, solutions, scores, resources, priority, tasks, recommendation, and summary from the already-authorized page data.
- Confirm no external PDF service is called.

## Environment Variable Checklist

Required names:

```bash
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPPORT_EMAIL=david@fideli.no
```

Rules:

- Do not print real values in logs or docs.
- Do not commit `.env.local`.
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only.
- Do not add `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `WEEKLY_LOG_TO_EMAIL`, or `CRON_SECRET`.
- Do not use service-role credentials in `app/` or `lib/` client-facing code.
- Confirm `lib/supabase/admin.ts` is imported only from server code and is used only for current-user account deletion.

## Migration Application Checklist

- Review `supabase/migrations/` locally.
- Back up or snapshot the target Supabase project if applicable.
- Confirm the target project is not a production database with unknown existing schema.
- Apply migrations only after explicit approval.
- Apply migrations in timestamp order:
  - `20260703190000_phase4_supabase_foundation.sql`
  - `20260703210000_phase8_friends_groups.sql`
  - `20260703220000_phase9_messaging_notifications_activity.sql`
  - `20260704090000_phase10_admin_settings_logs.sql`
- Check for migration errors.
- Record applied migration versions.
- Run manual RLS tests with separate users.

## First Admin Assignment Checklist

- Create User C through normal signup or OAuth.
- Confirm the profile row exists.
- In trusted Supabase SQL, assign admin role:

```sql
update public.profiles
set role = 'admin'
where id = '<trusted-user-uuid>';
```

- Confirm User C can access `/en/app/admin`.
- Confirm User A and User B receive no admin data.
- Do not build a public admin signup or request flow.

## RLS Verification Checklist

- Normal users can read and update only their own profile.
- Normal users cannot change `profiles.role`.
- Users can read, create, update, and delete only their own private challenges.
- Friendship alone does not grant challenge access.
- Group challenge access requires a `group_challenges` row.
- Group viewers can read linked challenges but cannot edit them.
- Group owners/admins/members can collaborate on linked group challenges.
- Users outside a group cannot read group messages or linked challenge content.
- Notifications are visible only to recipients.
- Activity events are visible only to users with group/challenge access.
- Admin RPCs and audit-log reads are admin-only.

## Multi-User Manual Test Plan

Use `docs/MANUAL_TEST_PLAN.md` as the detailed script. At minimum, verify:

- User A creates private challenge content.
- User B cannot access User A's private challenge.
- User A and User B become friends without sharing private challenges automatically.
- User A creates a group and invites User B.
- User B accepts the group invitation.
- User A links a challenge to the group.
- User B can access the linked challenge according to group role.
- Viewer role is read-only.
- Group messages are member-scoped.
- Challenge messages are challenge-access-scoped.
- User C admin can access admin overview.
- User A and User B cannot access admin overview.

## Mobile, Tablet, And Desktop Manual Test Plan

- Test landing, guest workspace, login, signup, dashboard, challenge workspace, friends, groups, group detail, notifications, settings, admin, and admin settings.
- Test at small mobile width, tablet width, and desktop width.
- Check wrapping, overflow, form readability, navigation usability, and button spacing.
- Confirm long user-generated text does not break layout.
- Confirm protected pages remain usable with empty data and populated data.

## i18n And RTL Manual Test Plan

- Smoke-test all locale roots:
  - `/en`
  - `/zh-CN`
  - `/hi`
  - `/es`
  - `/ar`
  - `/fr`
  - `/bn`
  - `/pt-BR`
  - `/id`
  - `/ur`
  - `/nb`
- Confirm Arabic and Urdu render with RTL direction.
- Confirm other locales render LTR.
- Confirm visible UI strings are translated.
- Confirm user-generated content is not automatically translated.
- Schedule native review for non-English copy before public launch.

Hard i18n audit notes:

- Verify `/nb`, `/nb/solve`, `/nb/login`, `/nb/signup`, `/nb/reset-password`, `/nb/app`, `/nb/app/settings`, `/nb/app/friends`, `/nb/app/groups`, `/nb/app/notifications`, and `/nb/app/admin` show normal UI in Norwegian Bokmål.
- Verify `/en/...` shows English for the same routes.
- Verify all other supported locale routes load without visible translation keys or missing messages.
- Verify language switching preserves the current path, query string, and route context.

## Password Reset Manual Test Plan

- Request a new password reset link from the browser page for the target locale.
- Confirm the redirect configured by the browser request is `/<locale>/reset-password`, without email query parameters.
- Open the email link in the same browser profile.
- Confirm `/[locale]/reset-password?code=...&source=recovery` first shows a checking state.
- Confirm the password fields enable only after recovery exchange succeeds.
- Confirm show/hide password controls work on both password fields.
- Set a new password, confirm the app signs out, and confirm redirect to localized login success.
- Confirm an expired or old link shows the invalid/expired message and offers a new link request.
- Do not log or copy recovery codes, tokens, sessions, cookies, emails, or passwords into docs or issue trackers.
- If the email is not sent, check Supabase Auth logs for rate limit, provider/SMTP, redirect URL, Site URL, or template errors. Supabase built-in email sending can return `over_email_send_rate_limit` / 429 during repeated testing; avoid repeated reset tests, wait for the limit to clear, or configure custom SMTP for serious testing. Keep troubleshooting notes free of email addresses and secrets.

Required Supabase redirect URL coverage:

- `http://localhost:3000/**`
- `http://localhost:3000/<locale>/auth/callback`
- `http://localhost:3000/<locale>/reset-password`
- `https://noproblemo.tech/**`
- `https://noproblemo.tech/<locale>/auth/callback`
- `https://noproblemo.tech/<locale>/reset-password`

Reset links requested before the latest reset-password fixes may need to be resent.

## Launch Blockers

- Real Supabase migrations/RLS/RPC behavior not verified.
- Production Auth redirect URLs not verified.
- Google and Apple providers not verified.
- Vercel environment variables not verified.
- Custom domain and Domeneshop DNS not verified.
- `david@fideli.no` mailbox or alias not verified.
- Native translation QA not complete.
- `npm audit` reports moderate PostCSS advisories via Next.js bundled dependency tree.

## Post-Launch Monitoring Checklist

- Monitor Vercel build and runtime logs.
- Monitor Supabase Auth errors.
- Monitor Supabase database errors and RLS denials.
- Monitor support mailbox.
- Track failed login and callback reports.
- Track unexpected admin access denials.
- Track user reports about challenge saves, group access, messages, and notifications.
- Review audit-log use before adding future admin mutations.
