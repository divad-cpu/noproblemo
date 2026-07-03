# Security

## Current Security Posture

Phase 6 adds a protected dashboard, minimal cloud challenge creation, guest draft import, saved challenge continuation placeholder, and profile/settings updates on top of the Phase 5 auth foundation.

Guest challenge drafts remain in browser localStorage until an authenticated user explicitly imports them from the dashboard.

## Authentication Security

Implemented in Phase 5:

- Email signup and login use Supabase Auth.
- No custom password storage exists in app code.
- Auth callbacks and redirects are locale-aware.
- `/[locale]/app` checks Supabase session state server-side before rendering.
- Logout is handled by a route handler that signs out through Supabase.
- Google and Apple OAuth start actions are prepared, but provider configuration is still required.
- Profile creation relies on the Phase 4 database trigger and still needs verification after the migration is applied.

## Supabase RLS Implemented In Phase 4

Migration:

- `supabase/migrations/20260703190000_phase4_supabase_foundation.sql`

RLS is enabled on:

- `profiles`
- `challenges`
- `challenge_sections`
- `challenge_solutions`
- `challenge_tasks`

Current access model:

- Users can read and update only their own profile.
- Users can create their own profile.
- Users can create challenges only for themselves.
- Users can read, update, and delete only their own challenges.
- Users can read, create, update, and delete challenge sections only through a parent challenge they own.
- Users can read, create, update, and delete challenge solutions only through a parent challenge they own.
- Users can read, create, update, and delete challenge tasks only through a parent challenge they own.

These policies still need to be applied and tested in Supabase.

## Not Implemented Yet

- Group access policies
- Friend/invite policies
- Messaging policies
- Admin policies
- Organization account policies
- Full saved challenge workspace authorization checks
- Server actions for editing full challenge sections, solutions, and tasks

## User Ownership Rules

- A user can manage their own profile.
- A user can create challenges they own.
- A user can access only their own challenge records in the Phase 4 schema.
- Guest localStorage data has no server-side owner until an authenticated user imports it.
- Imported guest work is created with `owner_id = auth.uid()` through the authenticated Supabase session.

## Dashboard And Guest Import Security

Phase 6 dashboard operations use `lib/supabase/server.ts`, the public Supabase anon key, and request cookies. No service-role key is used.

- Dashboard challenge reads filter by the authenticated user's id and are still constrained by RLS.
- Challenge creation sets `owner_id` from the authenticated Supabase user, not from client-provided input.
- Guest import accepts only the existing localStorage draft shape from `noproblemo.guestWorkspace.v1`.
- Guest import creates a private draft challenge and related `challenge_sections`.
- The client marks an imported local draft with `importedChallengeId` to avoid repeated imports from the same browser draft.
- Duplicate prevention is browser-local in Phase 6 because no import fingerprint column exists in the Phase 4 schema.
- Profile updates validate the preferred locale against the supported locale list and update only basic profile fields.

## Group Access Rules

Groups are planned, not implemented.

Future rules:

- Group invites must require accept/decline.
- Pending invites must not grant group access.
- Group membership must determine group visibility.
- Group owners/admins can manage membership only within their group.
- Users outside a group must not see group challenges, messages, or member details.

## Private Message Rules

Messaging is planned, not implemented.

Future rules:

- Private messages and challenge discussion must not be public.
- Direct messages should be visible only to sender and recipient.
- Group messages should be visible only to accepted group members.
- Challenge messages should be visible only to users with challenge access.

## Environment Variables

Templates include:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPPORT_EMAIL=support@noproblemo.tech
```

Rules:

- Real `.env*` files are ignored by git.
- `.env.local` must never be read aloud, printed, committed, or copied into documentation.
- `.env.example` and `.env.local.example` contain placeholders only.
- Only variables prefixed with `NEXT_PUBLIC_` are intended for browser exposure.
- `SUPABASE_SERVICE_ROLE_KEY` must never be used in frontend/client code.

## Supabase Helper Security

- `lib/supabase/client.ts` uses only public Supabase URL and anon key.
- `lib/supabase/server.ts` uses the public URL and anon key with request cookies for server-side auth actions and route checks.
- No service-role helper was added in Phase 4.

## OAuth Provider Configuration

Google login requires:

- A Google Cloud OAuth app.
- Supabase Google provider enabled.
- Correct authorized redirect URLs for local and production domains.
- No Google client secret committed to git.

Apple login requires:

- An Apple Developer account.
- A Services ID and verified domain.
- Supabase Apple provider enabled.
- Correct return URL for local and production domains.
- No Apple private key or secret committed to git.

## GDPR And Privacy-Aware Principles

Users may write personal, workplace, public-sector, or organizational problems. Treat challenge content as sensitive by default.

- Collect only what is needed.
- Keep private data private by default.
- Make sharing and group access explicit.
- Avoid logging sensitive challenge content.
- Provide clear export and deletion paths in future account phases.
- Do not automatically translate user-generated content.
- Do not send guest drafts to Supabase without explicit authenticated user action.

## Validation Requirements

- Validate all forms on client and server when server writes exist.
- Enforce length limits for text fields.
- Safely render user-generated content.
- Check authorization for every server action or route handler.
- Rate limit sensitive endpoints when they are added.

## Deployment Security Checklist

- No secrets in git diff.
- Vercel environment variables configured with least privilege.
- Supabase migration applied.
- RLS policies tested with authenticated users.
- Supabase anon key is the only browser key.
- Service role key unavailable to client bundles.
- Auth redirect URLs verified.
- HTTPS enabled.
- Domain/DNS configured intentionally.
- `npm run lint`, `npm run typecheck`, and `npm run build` pass.
