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

- Apply and verify the Phase 4 Supabase migration.
- Confirm the profile creation trigger creates `profiles` rows after signup.
- Add local and production auth redirect URLs in Supabase.
- Ensure `NEXT_PUBLIC_SITE_URL` matches the deployed site URL in Vercel.
- Keep `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` configured in Vercel.
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` to client code.

Google login preparation requires:

- Google Cloud OAuth app credentials.
- Supabase Google provider configuration.
- Authorized redirect URLs for local development and production.

Apple login preparation requires:

- Apple Developer account.
- Services ID and domain verification.
- Supabase Apple provider configuration.
- Return URL matching the deployed site.

## Domeneshop DNS Direction

When ready to attach the domain:

- Keep domain ownership and DNS in Domeneshop unless the user chooses otherwise.
- Point DNS records to Vercel according to Vercel's current instructions.
- Verify HTTPS after DNS propagation.
- Keep email/DNS records documented if support email setup changes.

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

Current app includes localized public pages, a guest localStorage workspace, Supabase helpers, a local migration, and Supabase Auth UI/actions. It does not include dashboard, guest import, saved cloud projects, payments, email sending, AI, or scheduled jobs.

## Production Checklist

- Git status reviewed.
- No `.env.local` or secret values in diff.
- `npm run lint` passes.
- `npm run typecheck` passes.
- `npm run build` passes.
- Vercel env vars are configured.
- Supabase RLS policies are tested before any private data ships.
- Auth redirect URLs match production domain before real auth launches.
- Support contact remains `support@noproblemo.tech` unless intentionally changed.
