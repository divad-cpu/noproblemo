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
NEXT_PUBLIC_SUPPORT_EMAIL=support@noproblemo.tech
```

`SUPABASE_SERVICE_ROLE_KEY` is server-only. It must never be exposed to the browser and must never be committed.

## Auth Deployment Setup

Phase 5 uses Supabase Auth. Before relying on production login:

- Create or select the production Supabase project.
- Apply and verify the Phase 4, Phase 8, Phase 9, and Phase 10 Supabase migrations through an approved workflow.
- Confirm the profile creation trigger creates `profiles` rows after signup.
- Add local and production auth redirect URLs in Supabase.
- Ensure `NEXT_PUBLIC_SITE_URL` matches the deployed site URL in Vercel.
- Keep `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` configured in Vercel.
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` to client code.

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
- Configure `support@noproblemo.tech` as a mailbox or alias outside the app.
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

Current app includes localized public pages, a guest localStorage workspace, Supabase helpers, local migrations, Supabase Auth UI/actions, protected dashboard, guest import, profile settings, cloud challenge creation, saved challenge workspace, friends, groups, invitations, roles, explicit group challenge links, group/challenge messages, private notifications, basic activity events, and a read-only protected admin/settings foundation. It does not include payments, email sending, AI, scheduled jobs, or realtime subscriptions.

## Production Checklist

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
- Phase 4, Phase 8, Phase 9, and Phase 10 migrations are applied in order.
- Profile creation trigger is tested after signup.
- First admin is assigned manually in trusted Supabase SQL.
- Guest mode is tested without login and confirmed local-only.
- Login, signup, auth callback, and logout are tested.
- Dashboard challenge reads/writes and guest import are tested against Supabase RLS.
- Saved challenge workspace section, solution, task, export, and message flows are tested.
- Friend/group RLS, group invitation flows, group challenge access, and the 100-member limit are tested against Supabase.
- Message RLS, notification privacy, activity visibility, and message soft-delete are tested against Supabase.
- Admin route protection, admin RPCs, audit-log RLS, and profile role self-promotion prevention are tested against Supabase.
- Auth redirect URLs match production domain before real auth launches.
- Google and Apple OAuth provider starts are tested after provider setup.
- All 11 locales are smoke-tested.
- Arabic and Urdu RTL layouts are smoke-tested.
- Mobile and desktop layouts are smoke-tested.
- Support contact remains `support@noproblemo.tech` unless intentionally changed.

Project logs remain local repository documentation. Do not add Resend, Vercel Cron, CRON_SECRET, or email automation for Codex project logs.

## Current Phase 11 Review Notes

- Supabase CLI is not installed in this environment, so `supabase db lint` and migration-list checks were not run.
- No live Supabase project was modified.
- No production Vercel settings or DNS records were changed.
- Manual production verification remains required before launch.
