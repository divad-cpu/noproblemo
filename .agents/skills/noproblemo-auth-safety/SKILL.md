---
name: noproblemo-auth-safety
description: Use when changing NoProblemo signup, login, logout, email confirmation, password reset/change, account deletion, profile settings, sessions, Supabase auth helpers, or protected app/admin routes.
---

# NoProblemo Auth Safety

Use this skill for any auth, profile, session, protected-route, or account-deletion change in NoProblemo.

## Required Review

Before editing, inspect the relevant current files:

- `SECURITY.md`
- `DEPLOYMENT.md`
- `CURRENT_STATE.md`
- `app/[locale]/auth/actions.ts`
- `app/[locale]/auth/callback/route.ts`
- `app/[locale]/auth/logout/route.ts`
- `app/[locale]/login/page.tsx`
- `app/[locale]/signup/page.tsx`
- `app/[locale]/app/layout.tsx`
- `app/[locale]/app/settings/page.tsx`
- `app/[locale]/app/actions.ts`
- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `lib/supabase/admin.ts` if present
- Relevant `messages/*.json`

## Security Rules

- Keep Supabase browser, server, route-handler, and admin-client boundaries correct.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to client code.
- Import server-only admin helpers only from server code.
- Do not log email addresses, passwords, auth codes, tokens, sessions, cookies, or environment values.
- Validate redirects as internal localized paths when accepting `next`.
- Check cookie/session behavior for callback, logout, and password recovery flows.
- Protect app/admin routes with server-side auth checks. Hidden navigation is not a security boundary.
- Profile updates must not allow role self-promotion.

## Account Deletion

Treat delete-account logic as high risk:

- Require an authenticated user server-side.
- Delete only the current authenticated user.
- Never accept arbitrary `user_id` from client input.
- Require explicit UI confirmation.
- Use disposable test accounts for manual destructive testing.
- Document cascade/anonymization limits clearly.

## Validation

Run when code changes:

```bash
npm run lint
npm run typecheck
npm run build
```

Also run safe greps for:

- `SUPABASE_SERVICE_ROLE_KEY` usage in `app/` and `lib/`
- accidental `.env.local` tracking
- auth/password/token logging

## Final Response

Include:

- Auth/security behavior changed
- Service-role boundary explanation if relevant
- Validation results
- Manual test steps, especially for destructive auth flows
- Remaining Supabase/Auth configuration work
