# Security

## Current Security Posture

Phase 11 completed an MVP polish, security, i18n/RTL, and deployment-readiness review on top of the Phase 10 admin/settings foundation.

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

## Phase 8 Friends And Groups Security

Migration:

- `supabase/migrations/20260703210000_phase8_friends_groups.sql`

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
- Invited users must accept before membership is created.
- Accepting a pending group invitation creates the group membership through a database trigger.
- Pending invitations do not grant group access.
- Groups are private; no public groups are implemented.
- Group membership is limited to 100 members by database trigger.
- `group_challenges` creates explicit challenge access for a group.
- Group viewers can read linked challenges but should not be able to edit them.
- Group owners/admins/members can collaborate on linked challenges through RLS.
- Users outside the group cannot read group content or linked group challenges.

Profile discovery uses the authenticated `search_profiles(search_term)` RPC and returns only `id`, `display_name`, and `avatar_url`. It does not expose email addresses, `auth.users`, profile role, or support/private profile fields.

Known MVP limitation: viewer read-only behavior is enforced by RLS and server-side write failures. The workspace UI may still render some edit controls for viewers until role-aware read-only rendering is added.

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

## Not Implemented Yet

- Admin role-changing actions
- Moderation actions
- Organization account policies

## Phase 11 Security Review Notes

Reviewed locally in Phase 11:

- `SUPABASE_SERVICE_ROLE_KEY` is not used in `app/` or `lib/`; the only app reference is an admin checklist variable name.
- `.env.example` and `.env.local.example` contain placeholders only.
- `.env.local` was not read or printed.
- `support@noproblemo.tech` remains the public support address.
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

Not verified in this environment:

- Live Supabase RLS behavior with multiple authenticated users.
- Supabase RPC behavior against a real project.
- Supabase Auth provider and redirect behavior in production.
- Vercel production environment and domain configuration.

Supabase CLI is not installed in this environment, so CLI database lint/list checks were not run.

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
