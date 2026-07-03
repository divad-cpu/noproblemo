# Security

## Current Security Posture

Phase 3 has no real authentication, no cloud persistence, no Supabase migrations, and no app-side Supabase client. Guest challenge drafts are stored in browser localStorage only.

Security work must become stricter when Supabase Auth, saved challenges, groups, invites, and messaging are implemented.

## Authentication Security

Planned requirements:

- Use Supabase Auth for real login/signup when scoped.
- Never implement custom password storage.
- Keep auth callbacks and redirects locale-aware.
- Validate session state server-side before reading private data.
- Treat `/[locale]/login` and `/[locale]/signup` as placeholders until real auth is implemented.

## Supabase RLS Requirements

- Enable RLS on every application table.
- Write policies before exposing UI that reads or writes private data.
- Users must only access their own data and groups they belong to.
- Challenge access must be based on ownership, explicit collaborator grants, or accepted group membership.
- Service role keys must never be exposed to the browser.
- Avoid broad `select` policies that make private challenge content or messages public.

## User Ownership Rules

- A user can manage their own profile.
- A user can create challenges they own.
- A user can read/update/delete only their owned challenges unless collaborator/group policy allows access.
- Guest localStorage data has no server-side owner until a future explicit save/import flow is implemented.

## Group Access Rules

- Group invites must require accept/decline.
- Pending invites must not grant group access.
- Group membership must determine group visibility.
- Group owners/admins can manage membership only within their group.
- Users outside a group must not see group challenges, messages, or member details.

## Private Message Rules

- Private messages and challenge discussion must not be public.
- Direct messages should be visible only to sender and recipient.
- Group messages should be visible only to accepted group members.
- Challenge messages should be visible only to users with challenge access.

## Environment Variables

- Real `.env*` files are ignored by git.
- `.env.local` must never be read aloud, printed, committed, or copied into documentation.
- `.env.example` and `.env.local.example` contain placeholders only.
- Only variables prefixed with `NEXT_PUBLIC_` are intended for browser exposure.
- Supabase service role keys belong only in secure server environments and must not be used in client components.

## GDPR And Privacy-Aware Principles

Users may write personal, workplace, public-sector, or organizational problems. Treat challenge content as sensitive by default.

- Collect only what is needed.
- Keep private data private by default.
- Make sharing and group access explicit.
- Avoid logging sensitive challenge content.
- Provide clear export and deletion paths in future account phases.
- Do not automatically translate user-generated content.
- Do not send guest drafts to Supabase without explicit user action in a future scoped phase.

## Validation Requirements

- Validate all forms on client and server when server writes exist.
- Enforce length limits for text fields.
- Sanitize or safely render user-generated content.
- Check authorization for every server action or route handler.
- Rate limit sensitive endpoints when they are added.

## Deployment Security Checklist

- No secrets in git diff.
- Vercel environment variables configured with least privilege.
- Supabase RLS enabled and tested.
- Supabase anon key is the only browser key.
- Service role key unavailable to client bundles.
- Auth redirect URLs verified.
- HTTPS enabled.
- Domain/DNS configured intentionally.
- `npm run lint`, `npm run typecheck`, and `npm run build` pass.
