# Deployment

## Intended Setup

- Hosting: Vercel or similar, with Vercel currently working for production.
- Backend: Supabase for future auth, database, and row-level security.
- Domain/DNS: Domeneshop mainly for domain registration and DNS management.

## Vercel Direction

- Connect the GitHub repository to Vercel.
- Use the standard Next.js build.
- Configure environment variables in Vercel project settings.
- Do not commit production secrets.
- Keep preview deployments useful for phase validation.
- Confirm the production build command is `npm run build`.
- Confirm the production site URL is set in `NEXT_PUBLIC_SITE_URL`.
- Add `noproblemo.tech` as a Vercel custom domain when DNS is ready.

## Supabase Environment Variables

Safe placeholders exist in `.env.example` and `.env.local.example`:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NOPROBLEMO_KEEPALIVE_SECRET=
NEXT_PUBLIC_SUPPORT_EMAIL=david@fideli.no
```

`SUPABASE_SERVICE_ROLE_KEY` and `NOPROBLEMO_KEEPALIVE_SECRET` are server-only. They must never be exposed to the browser, use a `NEXT_PUBLIC_` prefix, or be committed with real values. Configure `NOPROBLEMO_KEEPALIVE_SECRET` in Vercel Production and configure the cron client to send the same value as a Bearer token.

## Supabase Health Check

`GET /api/health/supabase` is intended for the trusted Linux cron client. It validates the server-only Bearer token and calls the harmless `public.noproblemo_health_check()` RPC with the public anon credentials. It does not use a user session or `SUPABASE_SERVICE_ROLE_KEY`, does not write data, and is explicitly non-cacheable.

Expected responses:

- `200`: the authorized RPC returned successfully.
- `401`: the Bearer token is missing or invalid.
- `503`: required server configuration is missing or Supabase is unavailable.

After setting placeholder-free local environment values and applying the migration to the intended Supabase project, start the app with `npm run dev`. Test locally without placing the token in shell history:

```bash
read -rsp "Keepalive secret: " NOPROBLEMO_KEEPALIVE_SECRET; printf '\n'
printf 'header = "Authorization: Bearer %s"\n' "$NOPROBLEMO_KEEPALIVE_SECRET" | curl --fail-with-body --silent --show-error --config - http://localhost:3000/api/health/supabase
unset NOPROBLEMO_KEEPALIVE_SECRET
```

Use the same pattern with the production HTTPS URL after an approved deployment. Do not enable shell tracing while testing. Never paste the real secret into documentation, commits, logs, screenshots, URLs, or command output. This endpoint is a narrow database reachability check, not a full monitoring or uptime guarantee.

## Auth Deployment Setup

Phase 5 uses Supabase Auth. Before relying on production login:

- Create or select the production Supabase project.
- Apply and verify the Phase 4, Phase 8, Phase 9, and Phase 10 Supabase migrations through an approved workflow.
- Confirm the profile creation trigger creates `profiles` rows after signup.
- Add local and production auth redirect URLs in Supabase.
- Ensure `NEXT_PUBLIC_SITE_URL` matches the deployed site URL in Vercel.
- Keep `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` configured in Vercel.
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` to client code.
- Configure `SUPABASE_SERVICE_ROLE_KEY` only as a server-side environment variable if account deletion is enabled.

## Admin Setup

Before relying on production admin pages:

- Apply and verify the Phase 10 Supabase migration.
- Assign the first admin manually in the Supabase SQL editor by a trusted project owner:

```sql
update public.profiles
set role = 'admin'
where id = '<trusted-user-uuid>';
```

- Confirm non-admin users receive no admin data from `/[locale]/app/admin`.
- Confirm admin RPCs return only aggregate counts and limited metadata.
- Confirm `admin_audit_log` is readable only by admins.
- Do not create public admin signup, admin-request, or self-promotion flows.

Google login preparation requires:

- Google Cloud OAuth app credentials.
- Supabase Google provider configuration.
- Authorized redirect URLs for local development and production.
- A manual login test on the production domain.

Apple login preparation requires:

- Apple Developer account.
- Services ID and domain verification.
- Supabase Apple provider configuration.
- Return URL matching the deployed site.
- A manual login test on the production domain.

## Domeneshop DNS Direction

When ready to attach the domain:

- Keep domain ownership and DNS in Domeneshop unless the user chooses otherwise.
- Point DNS records to Vercel according to Vercel's current instructions.
- Verify HTTPS after DNS propagation.
- Keep email/DNS records documented if support email setup changes.
- Use `david@fideli.no` as the public support mailbox outside the app.
- Do not add in-app email automation for support or project logs.

## Local Development Commands

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run build
```

For local env:

```bash
cp .env.local.example .env.local
```

Do not print `.env.local` values.

## Current Deployment Scope

Current app includes localized public pages, a guest localStorage workspace, Supabase helpers, local migrations, Supabase Auth UI/actions, protected dashboard, guest import, profile settings, cloud challenge creation, saved challenge workspace, friends, groups, invitations, roles, explicit group challenge links, group/challenge messages, private notifications, basic activity events, a read-only protected admin/settings foundation, and a secured endpoint that can be called by an external scheduler. It does not include an in-app scheduler, payments, email sending, AI, or realtime subscriptions.

## Production Checklist

- Complete `docs/PRODUCTION_VERIFICATION.md`.
- Complete `docs/SUPABASE_VERIFICATION.md`.
- Complete `docs/MANUAL_TEST_PLAN.md`.
- Update `docs/LAUNCH_READINESS_REPORT.md` with verification evidence.
- Git status reviewed.
- No `.env.local` or secret values in diff.
- `npm run lint` passes.
- `npm run typecheck` passes.
- `npm run build` passes.
- `npm audit` reviewed and documented.
- Vercel env vars are configured.
- Supabase project URL and anon key match the intended project.
- Supabase Auth site URL and redirect URLs match local and production routes.
- Supabase RLS policies are tested before any private data ships.
- Phase 4, Phase 8, Phase 9, Phase 10, and Supabase health-check migrations are applied in order.
- `NOPROBLEMO_KEEPALIVE_SECRET` is configured only in the required server environments, including Vercel Production.
- The authorized and unauthorized `/api/health/supabase` responses are verified without exposing the real secret.
- Profile creation trigger is tested after signup.
- First admin is assigned manually in trusted Supabase SQL.
- Guest mode is tested without login and confirmed local-only.
- Login, signup, auth callback, and logout are tested.
- Signup error states and resend-confirmation behavior are tested without exposing whether an email exists.
- Account deletion is tested with a disposable user and confirmed to remove only the current authenticated user.
- Dashboard challenge reads/writes and guest import are tested against Supabase RLS.
- Saved challenge workspace section, solution, task, export, and message flows are tested.
- Friend/group RLS, group invitation flows, group challenge access, and the 100-member limit are tested against Supabase.
- Message RLS, notification privacy, activity visibility, and message soft-delete are tested against Supabase.
- Admin route protection, admin RPCs, audit-log RLS, and profile role self-promotion prevention are tested against Supabase.
- Auth redirect URLs match production domain before real auth launches.
- Google and Apple OAuth remain planned/future; visible auth UI is email-only until provider setup is intentionally enabled.
- All 11 locales are smoke-tested.
- Arabic and Urdu RTL layouts are smoke-tested.
- Mobile and desktop layouts are smoke-tested.
- Support contact remains `david@fideli.no` unless intentionally changed.

## Required Supabase Redirect URLs

Supabase Auth must allow locale-specific callback URLs. Email confirmation and OAuth enter the app through `/[locale]/auth/callback`. Password recovery links should redirect directly to `/[locale]/reset-password` so the browser client can establish the recovery session before updating the password.

If an email confirmation callback cannot exchange the auth code for a session but the account was confirmed by Supabase, the app shows a calm login-required success state instead of saying the link is invalid. Password recovery callback failures still send the user to the reset page with instructions to request a new link.

Minimum redirect patterns that must be represented in Supabase Auth configuration:

- `http://localhost:3000/**`
- `http://localhost:3000/<locale>/auth/callback`
- `http://localhost:3000/<locale>/reset-password`
- `https://noproblemo.tech/**`
- `https://noproblemo.tech/<locale>/auth/callback`
- `https://noproblemo.tech/<locale>/reset-password`

Password reset links should be requested from the browser app. Forgot/reset password use an isolated browser-only Supabase recovery client. This avoids coupling the reset flow to the main SSR/cookie auth client, which was not reliably preserving the PKCE verifier locally and produced `verifier-missing-or-expired`.

For local testing, request a new reset link after this fix and open it in the same browser/profile where `/[locale]/forgot-password` requested it. The recovery flow may use browser hash tokens; those fragments stay in the browser and are not sent to the server. After password update, the app signs out and redirects to localized login success. Reset links requested before the isolated recovery fix may fail and should be resent.

If `/[locale]/forgot-password` reports that the reset email could not be sent, inspect Supabase Auth logs for provider/SMTP errors, rate limiting, redirect allow-list denial, and Site URL mismatch. Supabase Auth reset requests can return `over_email_send_rate_limit` / 429 during repeated local testing with the built-in email provider; wait, avoid repeated reset tests, and configure a custom SMTP provider for serious testing or production rather than changing app code. Do not log or paste user email addresses, auth codes, tokens, sessions, cookies, service-role values, or `.env.local` values while troubleshooting.

Saved challenge PDF export uses the protected `/[locale]/app/challenges/[id]/print` report route and the browser print dialog. Users click Save as PDF, open the clean report view, and choose Save to PDF locally; the app does not call an external PDF service or require deployment/provider settings.

Local development:

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

Production:

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

If Vercel preview auth is needed, add the specific preview redirect pattern approved for the Vercel team/account. Do not use broad production wildcards beyond the intended domain.

Project logs remain local repository documentation. Do not add Resend, Vercel Cron, CRON_SECRET, or email automation for Codex project logs.

## Current Phase 11 Review Notes

- Supabase CLI 2.109.1 is installed. CLI help was checked, but `supabase db lint`, migration listing, linking, and remote operations were not run.
- No live Supabase project was modified.
- No production Vercel settings or DNS records were changed.
- Manual production verification remains required before launch.

## Controlled Verification Rule

Production verification is the next step, but it is not automatic deployment permission. Apply remote Supabase migrations, change Vercel settings, change Domeneshop DNS records, or configure production auth providers only after explicit project-owner approval.
