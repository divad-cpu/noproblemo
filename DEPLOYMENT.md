# Deployment

## Platform

NoProblemo deploys to Vercel.

## Environment Variables

Production environment variables are configured in Vercel. Local values belong in `.env.local`, which is ignored by git.

Required placeholder variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Do not place secret service keys in public variables.

## Build Commands

Use the package scripts:

```bash
npm run lint
npm run typecheck
npm run build
```

## Phase 1 Deployment Scope

The deployed app is a static foundation page. It does not connect to Supabase at runtime and does not include login, payments, email, AI, or scheduled jobs.

## Release Checklist

- Git status reviewed.
- No `.env.local` or secret values in the diff.
- Lint passes.
- Typecheck passes.
- Build passes.
