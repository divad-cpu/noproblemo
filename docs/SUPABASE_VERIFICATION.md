# Supabase Verification

Last updated: 2026-07-14

## Purpose

This checklist verifies that NoProblemo's Supabase schema, RLS policies, triggers, and RPCs behave correctly in a real project. It is manual by design. Do not apply migrations to a remote Supabase project without explicit approval.

## Local Readiness

Migrations expected in `supabase/migrations/`:

- `20260703190000_phase4_supabase_foundation.sql`
- `20260703210000_phase8_friends_groups.sql`
- `20260703220000_phase9_messaging_notifications_activity.sql`
- `20260704090000_phase10_admin_settings_logs.sql`
- `20260714120000_supabase_health_check.sql`

Safe local commands if Supabase CLI is installed and configured:

```bash
supabase --version
supabase migration list
supabase db lint
```

Do not run `supabase db reset`, push to a remote database, or link to a remote project unless explicitly approved.

## Apply Migrations Safely

- Confirm the target Supabase project.
- Confirm no secrets or project tokens are printed.
- Confirm backups/snapshots as appropriate.
- Apply migrations in timestamp order through the approved workflow.
- Record any migration errors exactly, without exposing secrets.
- Confirm all five migration files are represented in the project migration history.

## Metadata Checks

Run only in a trusted Supabase SQL editor or approved SQL session. These examples do not contain secrets.

Confirm expected tables:

```sql
select tablename
from pg_tables
where schemaname = 'public'
  and tablename in (
    'profiles',
    'challenges',
    'challenge_sections',
    'challenge_solutions',
    'challenge_tasks',
    'friend_requests',
    'friendships',
    'groups',
    'group_members',
    'group_invitations',
    'group_challenges',
    'messages',
    'notifications',
    'activity_events',
    'admin_audit_log'
  )
order by tablename;
```

Confirm the health-check function is invoker security, stable, and configured with an empty search path:

```sql
select
  p.prosecdef as is_security_definer,
  p.provolatile as volatility,
  p.proconfig as runtime_settings
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'noproblemo_health_check'
  and p.pronargs = 0;
```

Expected: `is_security_definer = false`, `volatility = 's'`, and `runtime_settings` contains only the empty `search_path`. Inspect the function ACL and confirm default `PUBLIC` execution is absent, `anon` has `EXECUTE`, and neither `authenticated` nor `service_role` has execution. The function body must remain only `select true` and must not reference any application table.

Confirm RLS:

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'profiles',
    'challenges',
    'challenge_sections',
    'challenge_solutions',
    'challenge_tasks',
    'friend_requests',
    'friendships',
    'groups',
    'group_members',
    'group_invitations',
    'group_challenges',
    'messages',
    'notifications',
    'activity_events',
    'admin_audit_log'
  )
order by tablename;
```

Confirm key helper functions:

```sql
select proname
from pg_proc
join pg_namespace on pg_namespace.oid = pg_proc.pronamespace
where nspname = 'public'
  and proname in (
    'handle_new_user_profile',
    'group_role',
    'is_group_member',
    'can_manage_group',
    'can_read_group_challenge',
    'can_edit_group_challenge',
    'can_read_challenge',
    'can_participate_challenge',
    'is_admin',
    'admin_overview_counts',
    'admin_list_profiles',
    'admin_recent_activity',
    'admin_recent_audit_log'
  )
order by proname;
```

Confirm profile role constraint:

```sql
select conname
from pg_constraint
where conrelid = 'public.profiles'::regclass
  and conname = 'profiles_role_check';
```

## Profile Trigger Check

- Sign up as User A through the app.
- Confirm a `profiles` row exists for User A.
- Confirm `role = 'user'`.
- Confirm `preferred_locale` is populated with a supported locale or fallback.
- Repeat for User B and User C.

## Profile Self-Promotion Check

Use the app or an authenticated client session as User A, not a privileged SQL editor role.

- Update display name and preferred locale from `/en/app/settings`.
- Confirm those fields save.
- Attempt to update `profiles.role` to `admin` through an authenticated client request.
- Expected result: update fails or affects zero rows.
- Confirm User A remains `role = 'user'`.
- Confirm User A cannot access `/en/app/admin`.

## Private Challenge RLS Check

- User A creates a challenge.
- User A edits details, sections, solutions, and tasks.
- User B attempts to open User A's challenge URL.
- Expected result: not found or access denied without private content.
- User B attempts direct reads/writes through an authenticated client.
- Expected result: no private challenge data and no write access.

## Group Challenge Access Check

- User A creates a group.
- User A invites User B.
- User B accepts the invitation.
- User A links one of User A's challenges to the group.
- User B can read the linked challenge.
- A user outside the group cannot read the linked challenge.
- Remove the `group_challenges` link.
- User B loses access to that challenge unless they own it.

## Friendship Does Not Grant Challenge Access

- User A and User B become friends.
- Do not add a group challenge link.
- User B attempts to access User A's private challenge.
- Expected result: denied.

## Viewer Read-Only Check

- Set User B as viewer in a group.
- Link a challenge to the group.
- User B can read the linked challenge.
- User B cannot edit challenge details, sections, solutions, tasks, or challenge messages that require edit participation.
- RLS/server actions should reject viewer writes even if UI controls are visible.

## Group Message Check

- Owner/admin/member can send group messages.
- Viewer can read group messages but cannot send them.
- Non-member cannot read group messages.
- Message bodies are rendered as plain text in the app.
- Soft-delete is limited to the sender or a group owner/admin.

## Challenge Message Check

- Challenge owner can send challenge messages.
- Authorized group collaborator can read/send according to role.
- Viewer cannot send if not permitted by RLS.
- Outside user cannot read challenge messages.
- Message side effects do not expose message bodies through admin overview.

## Notification Check

- User A sends User B a friend request.
- User B receives a private notification.
- User A cannot read User B's notification.
- Mark-read updates affect only the authenticated recipient.
- Group invitation and message notifications follow the same recipient-only rule.

## Activity Event Check

- Group creation, group membership, group challenge link, and messages create activity events.
- Group activity is visible only to group members.
- Challenge activity is visible only to users who can read the challenge.
- Outside users cannot read unrelated activity events.

## Admin RPC And Admin Data Check

- Assign User C as first admin using trusted SQL:

```sql
update public.profiles
set role = 'admin'
where id = '<trusted-user-uuid>';
```

- User C can call:
  - `admin_overview_counts`
  - `admin_list_profiles`
  - `admin_recent_activity`
  - `admin_recent_audit_log`
- User A and User B cannot call those RPCs.
- User C can read `admin_audit_log`.
- User A and User B cannot read or write `admin_audit_log`.
- Admin overview does not expose emails, `auth.users`, message bodies, or private challenge content.

## Keepalive RPC Check

- Call `noproblemo_health_check` with the anon key in a trusted test and confirm it returns only `true`.
- Confirm an authenticated API role has no broader grant added for this RPC.
- Confirm the call creates no rows and reads no private application table.
- Confirm the Route Handler converts RPC failure to a generic `503` and never returns the Supabase error.

## First Admin Assignment Process

- Create User C normally.
- Confirm User C profile exists.
- Assign `role = 'admin'` only in trusted Supabase SQL.
- Confirm User C can access admin routes.
- Confirm no public admin signup, admin request, or self-promotion path exists.

## Verification Evidence To Record

- Supabase project target confirmed without printing project secrets.
- Migration application method and date.
- Migration versions applied.
- RLS metadata check results.
- Profile trigger test result.
- Multi-user RLS test results.
- Admin RPC test results.
- Keepalive RPC function security, ACL, and Route Handler results.
- Any failures and follow-up actions.
