# Security

## Current Security Posture

Phase 11 completed an MVP polish, security, i18n/RTL, and deployment-readiness review on top of the Phase 10 admin/settings foundation.

The application repair release was merged through PR #2 as `91cac6d`, deployed and promoted to `noproblemo.tech`, and production-verified with three disposable ordinary-user accounts. Verified boundaries include authenticated redirects and protected deep links, pending-submit protection, trigger-owned friendship and group-membership acceptance, safe notification destinations, group creation and roles, editor persistence, RLS denial of viewer mutation, message/notification privacy, and ordinary-user admin denial. Deliberately configured administrator-positive testing and the OAuth, health-endpoint, support-mailbox, and translation/locale operational checks remain separate.

PR #4 added the pending-invitation RPC consumer and bounded exact-key challenge-section conflict recovery without a migration. Application commit `264a435` was deployed and production-verified on 2026-07-17 through Vercel deployment `dpl_Bfo7GChwmpZh2oUeYvC1pXJNZKc7`. Verification confirmed pending-invitee identity privacy and caller isolation, deterministic concurrent and sequential section saves with one row per challenge/section key, ordinary-user admin denial, and the existing authentication, collaboration, viewer/editor, and notification regression boundaries. All six Supabase migrations had already been applied before this application release; this focused evidence does not claim every workflow or locale was verified.

**VERIFIED — database policy.** Migration `20260717120000_group_invitation_cancellation_authorization.sql` was subsequently applied as the only pending migration and inspected on production project `jxjoyugkozbldwimqjuw`. Local and production histories now align across seven versions. The resulting `group_invitations_update_related` policy matches the approved pending-only authorization matrix and makes accepted, declined, and canceled invitation states immutable. The migration used no service-role access, required no history repair, and did not directly mutate application records.

**DEPLOYED, NOT YET INDEPENDENTLY EXERCISED IN PRODUCTION — application flow.** PR #6 was squash-merged as `dc91a671` and its matching manager-cancellation server authorization and UI are deployed. Vercel production deployment `dpl_936NXseFjYk7vkwE5uk5Kdd1BNpb`, immutable URL `https://noproblemo-h7dycjrml-no-problemo.vercel.app`, reached `READY` at `2026-07-17T03:49:01.696Z` from commit `dc91a6710b1c6e2d583fa38a1649ca7fa73080d1`. The production aliases route to `/en`, `/en` returns 200, and verification found no localhost redirect, 5xx response, filtered Vercel error-level entry, or HTTP 500 entry. The deployed policy and application implementation agree, but the authenticated mutating cancellation workflow has not been independently replayed in production and no broad production workflow claim is made.

Guest challenge drafts remain in browser localStorage until an authenticated user explicitly imports them from the dashboard.

## Authentication Security

Implemented in Phase 5:

- Email signup and login use Supabase Auth.
- Signup failures are mapped to safe user-facing categories and development-only warnings without logging email addresses, passwords, tokens, sessions, cookies, or environment values.
- No custom password storage exists in app code.
- Auth callbacks and redirects are locale-aware.
- Auth callback code exchange writes Supabase session cookies onto the final route-handler redirect response.
- Email confirmation callback failures caused by PKCE/session exchange limits do not expose raw provider details and redirect to a login-required success state because Supabase may already have confirmed the account.
- `/[locale]/app` checks Supabase session state server-side before rendering.
- Logout is handled by a route handler that signs out through Supabase.
- Logged-in users can change passwords through Supabase Auth `updateUser({ password })`; password values are not stored in profile tables.
- Logged-in users can delete their own account from settings after explicit confirmation. The server action derives the user id from the authenticated session and never accepts a user id from the client.
- Password reset requests use Supabase Auth reset links and locale-specific `/[locale]/reset-password` URLs; the browser client establishes the recovery session before calling `updateUser({ password })`.
- Google and Apple OAuth start actions are prepared, but provider configuration is still required.
- Profile creation relies on the applied Phase 4 database trigger.

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

These policies and the later security-repair and cancellation-authorization migrations are applied in production. The seven-migration history aligns locally and remotely, and the focused database verification passed; broader application workflows remain subject to release-specific testing.

## Phase 8 Friends And Groups Security

Migration:

- `supabase/migrations/20260703210000_phase8_friends_groups.sql`
- `supabase/migrations/20260717120000_group_invitation_cancellation_authorization.sql` (production-applied and policy-verified)

RLS is enabled on:

- `friend_requests`
- `friendships`
- `groups`
- `group_members`
- `group_invitations`
- `group_challenges`

Current access model:

- Users can see friend requests only when they are the sender or receiver.
- Users can create friend requests only as themselves.
- Receivers can accept or decline pending requests; senders can cancel pending requests.
- Accepting a pending friend request creates the friendship through a database trigger.
- Users can see and remove friendships involving themselves.
- Friendship alone never grants access to private challenges.
- Users can see only groups they belong to.
- Group owners/admins can manage group settings, regular members, and invitations.
- A pending group invitation may be canceled only by its original inviter or a currently accepted group owner/admin. Ordinary members, viewers, unrelated authenticated users, invitees acting through cancellation, and unauthenticated users have no cancellation authority.
- Group invitation accept/decline remains invitee-only. Accepted, declined, and already canceled rows are immutable at the database boundary through the production-applied pending-only update policy. The deployed PR #6 server action applies the matching pending-only authorization and update verification.
- Invited users must accept before membership is created.
- Accepting a pending group invitation creates the group membership through a database trigger.
- Pending invitations do not grant group access.
- Groups are private; no public groups are implemented.
- Group membership is limited to 100 members by database trigger.
- `group_challenges` creates explicit challenge access for a group.
- Group viewers can read linked challenges through an inert, native-disabled workspace; RLS denies viewer mutations.
- Group owners/admins/members can collaborate on linked challenges through RLS.
- Users outside the group cannot read group content or linked group challenges.

Profile discovery uses the authenticated `search_profiles(search_term)` RPC and returns only `id`, `display_name`, and `avatar_url`. It does not expose email addresses, `auth.users`, profile role, or support/private profile fields.

Production verification confirmed that viewer mutation controls are inert and native-disabled, editor changes persist, and RLS remains authoritative by denying viewer mutation attempts.

The cancellation repair uses the authenticated anon/session client only; it does not use service-role access. Cancellation remains a status update with `responded_at`, not a row deletion. Existing notification triggers still notify only invitation creation and accepted/declined responses, and cancellation adds no activity event. The production policy matches the approved migration, and both the policy and manager-cancellation server authorization are deployed. Local database validation passed 10/10 focused pgTAP assertions plus 45/45 related regressions, for 55/55 combined assertions; all SQL tests rolled back and left no fixture or Docker/runtime state. Structural security tests passed 4/4. Focused Playwright discovery passed, but runtime execution remains blocked pending an isolated local/Preview Supabase environment with six disposable accounts. Live mutating workflow verification remains pending, and broader group workflows were not all retested.

## Phase 9 Messaging, Notifications And Activity Security

Migration:

- `supabase/migrations/20260703220000_phase9_messaging_notifications_activity.sql`

RLS is enabled on:

- `messages`
- `notifications`
- `activity_events`

Current access model:

- Group messages are visible only to accepted members of that group.
- Group messages can be inserted only by group owner/admin/member roles.
- Group viewers can read messages but cannot send them.
- Challenge messages are visible only to users who can read the challenge.
- Challenge messages can be inserted only by challenge owners or group collaborators with edit/collaboration access.
- Message soft-delete is limited to the sender or a group owner/admin for group messages.
- Notifications are visible only to `notifications.user_id = auth.uid()`.
- Notification updates are limited to marking the recipient's own notifications as read.
- Activity events are visible only to authorized members of the related group or users who can read the related challenge.
- Notification creation for cross-user events is handled by database triggers, not arbitrary client inserts.
- Activity creation is handled by database triggers and limited authenticated app actions.

Realtime subscriptions are not implemented in Phase 9. Message actions use server action redirects and route revalidation.

## Phase 10 Admin Security

Migration:

- `supabase/migrations/20260704090000_phase10_admin_settings_logs.sql`

Current access model:

- Admin role source is `profiles.role = 'admin'`.
- Admin routes check the authenticated Supabase user and the profile role server-side before rendering.
- The protected app navigation shows the Admin link only to admin profiles, but route protection does not rely on hidden navigation.
- Non-admin users attempting `/[locale]/app/admin` or `/[locale]/app/admin/settings` receive a not-found response without admin data.
- `public.is_admin(user_id)` is a database helper used by admin policies/RPCs.
- `admin_overview_counts`, `admin_list_profiles`, `admin_recent_activity`, and `admin_recent_audit_log` are security-definer RPCs that raise an authorization error for non-admin users.
- The admin overview exposes aggregate counts, limited profile metadata, recent activity metadata, and audit-log metadata only.
- The admin overview does not expose `auth.users`, email addresses, message bodies, or private challenge content.
- `admin_audit_log` is readable only by admins through RLS.
- Authenticated users do not have table insert/update/delete grants on `admin_audit_log`; future trusted admin mutations should write audit entries without storing secrets or unnecessary private content.
- A Phase 10 trigger prevents authenticated users from changing their own `profiles.role`, and normal profile settings update only `display_name` and `preferred_locale`.

First admin assignment must be manual and trusted, for example in the Supabase SQL editor:

```sql
update public.profiles
set role = 'admin'
where id = '<trusted-user-uuid>';
```

Do not build public admin signup, admin requests, or self-service role promotion.

## Supabase Keepalive Health Check

`GET /api/health/supabase` is a server-side operational endpoint for a trusted cron client. It requires `Authorization: Bearer <NOPROBLEMO_KEEPALIVE_SECRET>` and returns only a generic reachability state and timestamp. Missing or invalid authorization returns `401`; missing configuration or an unsuccessful Supabase RPC returns `503` without provider or database details.

The endpoint uses the public Supabase URL and anon key without cookies or a user session. It never imports the service-role helper, writes to the database, or returns table data. Migration `supabase/migrations/20260714120000_supabase_health_check.sql` adds `public.noproblemo_health_check()` as a `SECURITY INVOKER` SQL function with an empty `search_path`, revokes default `PUBLIC` execution, and grants execution only to `anon`. The function performs only `select true` and has no access to private application tables.

`NOPROBLEMO_KEEPALIVE_SECRET` is server-only and must never use the `NEXT_PUBLIC_` prefix. A strong unique value must be configured in Vercel Production and supplied by the cron client as a Bearer token. The real value must never appear in documentation, commits, logs, screenshots, URLs, or command output.

This check confirms that one Vercel request can authenticate to the endpoint and complete a harmless PostgreSQL RPC. It is not a full uptime, latency, application-flow, Auth, RLS, or monitoring guarantee.

## Not Implemented Yet

- Admin role-changing actions
- Moderation actions
- Organization account policies

## Phase 11 Security Review Notes

Reviewed locally in Phase 11:

- `SUPABASE_SERVICE_ROLE_KEY` is used only in the server-only `lib/supabase/admin.ts` helper for current-user account deletion; the app reference outside server actions is an admin checklist variable name.
- `.env.example` and `.env.local.example` contain placeholders only.
- `.env.local` was not read or printed.
- `david@fideli.no` is the public support address.
- `da.jernaes@gmail.com` was not found in public app files.
- Protected app routes and admin routes continue to check authenticated Supabase users server-side.
- Admin routes continue to check `profiles.role = 'admin'` server-side.
- Profile settings do not update `profiles.role`.
- Guest mode remains browser-local unless imported by a logged-in user.
- Message bodies render as plain React text and no dangerous HTML rendering was introduced.
- Profile search continues to expose only `id`, `display_name`, and `avatar_url`.
- Group challenge access remains tied to explicit `group_challenges` links.
- Friendships alone do not grant challenge access.
- Notifications remain recipient-scoped in the documented RLS model.
- Activity remains group/challenge-scoped in the documented RLS model.

Not verified during the historical Phase 11 review:

- Live Supabase RLS behavior with multiple authenticated users.
- Supabase RPC behavior against a real project.
- Supabase Auth provider and redirect behavior in production.
- Vercel production environment and domain configuration.

Those Phase 11 gaps were subsequently narrowed by production verification of ordinary-user Auth/RLS/RPC behavior and the now-aligned seven-migration chain. The cancellation policy and PR #6 application implementation are deployed and consistent, but the authenticated mutating cancellation flow has not been independently exercised in production. Deliberately configured administrator-positive testing, Google/Apple provider setup, health endpoint secret/deployment verification, support mailbox setup, and fluent translation review remain current gaps.

## User Ownership Rules

- A user can manage their own profile.
- A user can create challenges they own.
- A user can access their own private challenge records.
- A group member can access only challenges explicitly linked to their group through `group_challenges`, subject to their role.
- Friendship alone does not grant access to challenge records.
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
- Profile updates do not update `profiles.role`; missing profiles may be inserted only with `role = 'user'`.
- Password updates use the authenticated Supabase session only and do not use a service-role key.
- Account deletion uses `lib/supabase/admin.ts`, which imports `server-only` and uses `SUPABASE_SERVICE_ROLE_KEY` only on the server to call Supabase Auth admin delete for the current authenticated user.

## Challenge Workspace Security

Phase 7 workspace operations use `lib/supabase/server.ts`, the public Supabase anon key, and request cookies. No service-role key is used.

- The workspace page fetches `challenges` by `id` through the authenticated Supabase session and relies on RLS for owner or explicit group access.
- Missing or inaccessible challenges render a not-found state without revealing whether another user's challenge exists.
- Every workspace server action re-checks the authenticated user and fetches the challenge through RLS before writing.
- Challenge details update only title, short description, and allowed status values.
- Section saves use the existing `challenge_sections` table and create missing rows without deleting existing content unexpectedly.
- Solution writes validate 1-to-5 risk, effort, and impact scores.
- Task writes keep responsible person as plain text and do not assign real users.
- Markdown export runs in the browser from already-authorized page data and does not call privileged APIs.
- PDF export uses the browser print dialog from a protected print-only report route. The route uses the authenticated Supabase server client and RLS, renders a compact report from already-authorized challenge data, omits empty sections where practical, does not call external PDF services, and does not use service-role credentials.

## Group Access Rules

Implemented Phase 8 rules:

- Group invites require accept/decline.
- Pending invites do not grant group access.
- Group membership determines group visibility.
- Group owners/admins can manage membership only within their group.
- Group challenge access requires an explicit `group_challenges` row.
- Private challenges remain private until explicitly linked.
- Users outside a group must not see group challenges or member details.

Future rules:

- Blocking, abuse handling, and detailed audit events are not implemented yet.

## Private Message Rules

Implemented Phase 9 rules:

- Private messages and challenge discussion must not be public.
- Group messages should be visible only to accepted group members.
- Challenge messages should be visible only to users with challenge access.
- Direct one-to-one messages are not implemented.

Future rules:

- Direct messages should be visible only to sender and recipient if implemented.
- Read receipts, typing indicators, reactions, attachments, and threads are not implemented.

## Environment Variables

Templates include:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NOPROBLEMO_KEEPALIVE_SECRET=
NEXT_PUBLIC_SUPPORT_EMAIL=david@fideli.no
```

Rules:

- Real `.env*` files are ignored by git.
- `.env.local` must never be read aloud, printed, committed, or copied into documentation.
- `.env.example` and `.env.local.example` contain placeholders only.
- Only variables prefixed with `NEXT_PUBLIC_` are intended for browser exposure.
- `SUPABASE_SERVICE_ROLE_KEY` must never be used in frontend/client code.
- `NOPROBLEMO_KEEPALIVE_SECRET` must remain server-only, must not use a `NEXT_PUBLIC_` prefix, and must be configured in Vercel Production without exposing its value.

## Supabase Helper Security

- `lib/supabase/client.ts` uses only public Supabase URL and anon key.
- `lib/supabase/server.ts` uses the public URL and anon key with request cookies for server-side auth actions and route checks.
- `lib/supabase/admin.ts` is server-only and exists only for current-user account deletion. It must never be imported by Client Components or exposed to browser bundles.

## Password Recovery And Account Deletion

- Password reset requests are initiated from an isolated browser-only Supabase recovery client using the public URL and anon key only.
- `/[locale]/reset-password` supports both recovery `code` exchange and browser hash-token recovery. It does not log codes/tokens/sessions/cookies/passwords and only enables password update after recovery session readiness.
- Reset links should be opened in the same browser/profile where the reset request was made. If a recovery exchange fails because the verifier/session is missing or expired, the UI shows a generic request-new-link message plus a same-browser/profile instruction.
- The recovery client is intentionally separate from the main SSR Supabase client. Local password recovery was producing `verifier-missing-or-expired` with the SSR/cookie-oriented client, so reset now uses a browser-only implicit recovery flow where hash tokens stay in the browser URL fragment and are cleared after session setup.
- Password reset request diagnostics must not log email addresses, codes, tokens, sessions, cookies, full URLs, or env values. Development logs may include only generic labels such as rate-limit, provider-or-smtp, redirect-url, invalid-email, or unknown.
- Password reset exchange diagnostics must not log auth codes, tokens, sessions, cookies, URLs, passwords, or email addresses. Development logs may include only generic labels such as verifier-missing-or-expired, expired-link, or unknown.
- Supabase built-in reset email sending can return `over_email_send_rate_limit` / 429 during repeated testing. The UI must show a privacy-safe rate-limit message and must not attempt to bypass provider limits.
- If reset email sending fails, check Supabase Auth logs and provider/SMTP settings before changing app code.
- Old recovery links requested before this browser-client flow may still fail; users should request a fresh reset link.
- Password reset uses Supabase Auth `updateUser({ password })`; reset passwords are never stored in application database tables.
- Login, signup, email confirmation, forgot-password, reset-password, settings password change, logout, and account deletion must be tested with disposable accounts before launch.
- Account deletion must only delete the current authenticated user. The action must never accept arbitrary `user_id` values from the client.
- `SUPABASE_SERVICE_ROLE_KEY` is only for server-only admin operations and must never appear in Client Components or browser bundles.

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
- Supabase migrations applied in order.
- RLS policies tested with authenticated users.
- Admin RPCs and profile role hardening tested with admin and non-admin users.
- Message RLS, notification privacy, and activity visibility tested with authenticated users.
- Admin route protection, admin RPC authorization, audit-log RLS, and profile role hardening tested with admin and non-admin users.
- Supabase anon key is the only browser key.
- Service role key unavailable to client bundles.
- Auth redirect URLs verified.
- HTTPS enabled.
- Domain/DNS configured intentionally.
- `npm run lint`, `npm run typecheck`, and `npm run build` pass.
