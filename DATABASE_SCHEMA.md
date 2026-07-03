# Database Schema

## Current Implementation Status

Phase 4 Supabase foundation is implemented locally in migration:

- `supabase/migrations/20260703190000_phase4_supabase_foundation.sql`
- `supabase/migrations/20260703210000_phase8_friends_groups.sql`

The migrations have not been verified against the live Supabase project in this task. They should be applied and tested in Supabase before any production data depends on them.

## Implemented Tables

### `profiles`

Linked one-to-one to `auth.users`.

Fields:

- `id uuid primary key references auth.users(id) on delete cascade`
- `display_name text`
- `avatar_url text`
- `preferred_locale text default 'en'`
- `role text default 'user'`
- `support_contact_seen boolean default false`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

Constraints:

- `preferred_locale` allows only `en`, `zh-CN`, `hi`, `es`, `ar`, `fr`, `bn`, `pt-BR`, `id`, `ur`, `nb`.
- `role` allows only `user` and `admin`.

### `challenges`

Saved challenge root record.

Fields:

- `id uuid primary key default gen_random_uuid()`
- `owner_id uuid references auth.users(id) on delete cascade`
- `title text not null`
- `short_description text`
- `status text default 'draft'`
- `visibility text default 'private'`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

Constraints:

- `status` allows `draft`, `active`, `completed`, `archived`.
- `visibility` allows `private`, `group`.

### `challenge_sections`

Structured challenge content.

Fields:

- `id uuid primary key default gen_random_uuid()`
- `challenge_id uuid references challenges(id) on delete cascade`
- `section_key text not null`
- `content text`
- `position integer default 0`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

Implemented section keys:

- `problem_title`
- `short_description`
- `background_context`
- `who_is_affected`
- `why_it_matters`
- `possible_causes`
- `final_recommendation`
- `summary`

### `challenge_solutions`

Candidate solutions for a challenge.

Fields:

- `id uuid primary key default gen_random_uuid()`
- `challenge_id uuid references challenges(id) on delete cascade`
- `title text not null`
- `description text`
- `pros text`
- `cons text`
- `risk integer`
- `effort integer`
- `impact integer`
- `resources_needed text`
- `priority integer`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

Constraints:

- `risk`, `effort`, and `impact` must be null or between 1 and 5.

### `challenge_tasks`

Action items for a challenge.

Fields:

- `id uuid primary key default gen_random_uuid()`
- `challenge_id uuid references challenges(id) on delete cascade`
- `title text not null`
- `description text`
- `responsible_person text`
- `deadline date`
- `completed boolean default false`
- `position integer default 0`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### `friend_requests`

MVP request record between two users.

Fields:

- `id uuid primary key default gen_random_uuid()`
- `sender_id uuid references auth.users(id) on delete cascade`
- `receiver_id uuid references auth.users(id) on delete cascade`
- `status text default 'pending'`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`
- `responded_at timestamptz`

Constraints:

- `sender_id` and `receiver_id` must differ.
- `status` allows `pending`, `accepted`, `declined`, `canceled`.
- A partial unique index prevents duplicate pending requests for the same canonical user pair.

### `friendships`

Canonical friendship record. Friendship alone does not grant challenge access.

Fields:

- `id uuid primary key default gen_random_uuid()`
- `user_one_id uuid references auth.users(id) on delete cascade`
- `user_two_id uuid references auth.users(id) on delete cascade`
- `created_at timestamptz default now()`

Constraints:

- `user_one_id < user_two_id` keeps one canonical row per pair.
- Unique pair index prevents duplicate friendships.

### `groups`

Private group root record.

Fields:

- `id uuid primary key default gen_random_uuid()`
- `owner_id uuid references auth.users(id) on delete cascade`
- `name text not null`
- `description text`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### `group_members`

Accepted group membership and role.

Fields:

- `id uuid primary key default gen_random_uuid()`
- `group_id uuid references groups(id) on delete cascade`
- `user_id uuid references auth.users(id) on delete cascade`
- `role text not null`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

Constraints:

- Unique `group_id, user_id`.
- Role allows `owner`, `admin`, `member`, `viewer`.
- A trigger enforces a maximum of 100 members per group.
- A trigger prevents deleting the last owner.

### `group_invitations`

Pending or responded group invitations.

Fields:

- `id uuid primary key default gen_random_uuid()`
- `group_id uuid references groups(id) on delete cascade`
- `inviter_id uuid references auth.users(id) on delete cascade`
- `invitee_id uuid references auth.users(id) on delete cascade`
- `role text default 'member'`
- `status text default 'pending'`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`
- `responded_at timestamptz`

Constraints:

- `inviter_id` and `invitee_id` must differ.
- Role allows `admin`, `member`, `viewer`.
- Status allows `pending`, `accepted`, `declined`, `canceled`.
- A partial unique index prevents duplicate pending invitations for the same group and invitee.

### `group_challenges`

Explicit link between a group and a challenge.

Fields:

- `id uuid primary key default gen_random_uuid()`
- `group_id uuid references groups(id) on delete cascade`
- `challenge_id uuid references challenges(id) on delete cascade`
- `created_by uuid references auth.users(id) on delete set null`
- `created_at timestamptz default now()`

Constraints:

- Unique `group_id, challenge_id`.
- Friendship alone does not create or imply challenge access.

## Implemented Functions And Triggers

- `public.set_updated_at()` updates `updated_at` before row updates.
- `profiles_set_updated_at`
- `challenges_set_updated_at`
- `challenge_sections_set_updated_at`
- `challenge_solutions_set_updated_at`
- `challenge_tasks_set_updated_at`
- `public.handle_new_user_profile()` creates a basic profile after a new `auth.users` row is inserted.
- `auth_users_create_profile` trigger on `auth.users`.
- `public.group_role(group_id, user_id)` returns a group member role.
- `public.is_group_member(group_id, user_id)` checks accepted membership.
- `public.can_manage_group(group_id, user_id)` checks owner/admin group management rights.
- `public.can_read_group_challenge(challenge_id, user_id)` checks explicit linked challenge read access.
- `public.can_edit_group_challenge(challenge_id, user_id)` checks explicit linked challenge edit access for owner/admin/member roles.
- `public.check_group_member_limit()` enforces the 100-member group limit.
- `public.create_owner_group_member()` creates the owner membership after group creation.
- `public.prevent_group_without_owner()` prevents removing the last owner.
- `public.create_friendship_from_accepted_request()` creates a canonical friendship when a pending friend request is accepted.
- `public.create_group_member_from_accepted_invitation()` creates a group membership when a pending invitation is accepted.
- `public.search_profiles(search_term)` returns limited authenticated profile search results: `id`, `display_name`, and `avatar_url`.

## Implemented RLS Policies

RLS is enabled on:

- `profiles`
- `challenges`
- `challenge_sections`
- `challenge_solutions`
- `challenge_tasks`
- `friend_requests`
- `friendships`
- `groups`
- `group_members`
- `group_invitations`
- `group_challenges`

Policies:

- Users can select their own profile.
- Users can insert their own profile with `role = 'user'`.
- Users can update their own profile.
- Authenticated users are granted update only for profile fields `display_name`, `avatar_url`, `preferred_locale`, and `support_contact_seen`; `role` is not granted for normal profile updates.
- Users can create challenges only where `owner_id = auth.uid()`.
- Users can select, update, and delete only their own challenges.
- Users can select, insert, update, and delete sections only when they own the parent challenge.
- Users can select, insert, update, and delete solutions only when they own the parent challenge.
- Users can select, insert, update, and delete tasks only when they own the parent challenge.
- Users can see friend requests they sent or received.
- Users can insert friend requests only as themselves.
- Receivers can accept/decline pending friend requests; senders can cancel pending requests.
- Users can see and delete friendships involving themselves.
- Users can see groups they belong to.
- Authenticated users can create groups; a trigger creates the owner membership.
- Group owners/admins can manage group settings, regular members, and invitations.
- Invited users can see and respond to their own group invitations.
- Group members can read group challenge links for their groups.
- Group challenge read access is granted only through explicit `group_challenges` links.
- Group owner/admin/member roles can edit linked group challenges; viewer can read but not edit.
- `challenge_sections`, `challenge_solutions`, and `challenge_tasks` inherit group read/edit behavior through the parent challenge.

## Planned Tables Not Implemented Yet

- `messages`
- `notifications`
- `activity_events`
- Organization/account tables
- Audit/history tables

Messaging, notifications, activity, admin, and organization access policies are not implemented yet.

## TypeScript Types

Manual database types were added in `lib/supabase/types.ts`. They should be regenerated from Supabase once the project has a stable live schema and generation workflow.

## Phase 5 Auth Notes

Phase 5 uses the Phase 4 `auth_users_create_profile` trigger for profile creation after signup. No new schema migration was added in Phase 5. The trigger still needs to be verified after the Phase 4 migration is applied to Supabase.

## Phase 6 Dashboard And Import Notes

No new schema migration was added in Phase 6.

Phase 6 uses existing tables:

- `profiles` for `display_name` and `preferred_locale` settings.
- `challenges` for dashboard lists, minimal draft creation, and imported guest drafts.
- `challenge_sections` for imported guest draft content.

Guest import maps the existing localStorage draft key `noproblemo.guestWorkspace.v1` as follows:

- `problem` -> `challenge_sections.section_key = 'problem_title'`
- `context` -> `challenge_sections.section_key = 'background_context'`
- `outcome` -> `challenge_sections.section_key = 'final_recommendation'`
- `options` -> `challenge_sections.section_key = 'possible_causes'`
- `nextStep` -> `challenge_sections.section_key = 'summary'`

The imported challenge title is derived from the first line of `problem`, with a fallback title. Duplicate prevention is marked in the browser localStorage draft with `importedChallengeId`; a database-level import fingerprint is not implemented.

## Phase 7 Workspace Notes

No new schema migration was added in Phase 7.

The saved challenge workspace uses existing tables:

- `challenges` for title, short description, and status.
- `challenge_sections` for problem definition, context, affected people, importance, causes, final recommendation, and summary.
- `challenge_solutions` for possible solutions, pros, cons, risk, effort, impact, resources needed, and priority/ranking.
- `challenge_tasks` for tasks/actions, responsible person, deadline, completed state, and position.

Because `challenge_sections` has no unique constraint on `(challenge_id, section_key)`, Phase 7 saves sections by selecting existing rows, updating the first matching row for each section key, and inserting missing section rows. It does not delete extra duplicate rows automatically.

Markdown export is generated from the same authorized workspace data and does not require a new table.

## Phase 8 Friends And Groups Notes

Phase 8 adds a second migration for friends, groups, and explicit group challenge access.

The app currently supports:

- sending, accepting, declining, canceling friend requests
- removing friendships
- creating groups
- inviting users to groups
- accepting, declining, and canceling group invitations
- viewing and updating group roles
- removing group members
- linking a user's own challenge to a group
- opening linked group challenges through the existing workspace route when RLS permits access

Accepted friend requests and accepted group invitations create the corresponding friendship/member rows through database triggers. App actions also use idempotent inserts after acceptance, but the database trigger is the consistency backstop.

Profile discovery uses `search_profiles(search_term)` and intentionally does not expose email addresses, `auth.users`, profile role, or support/private profile fields.

Known MVP limitations:

- Group challenge linking currently links the authenticated user's own challenges.
- Viewer read-only behavior is enforced by RLS/server writes. The workspace UI may still render edit controls for viewers until a future polish pass adds role-aware read-only rendering.

## Needs Verification

- Apply migration in local Supabase and/or linked Supabase project.
- Test profile trigger after signup.
- Test every RLS policy with authenticated users.
- Test Phase 6 dashboard reads, create challenge, profile update, and guest import against a running Supabase project.
- Test Phase 7 workspace section saves, solution CRUD, task CRUD, status updates, and Markdown export against a running Supabase project.
- Apply and test the Phase 8 migration.
- Test friend request and friendship RLS with two authenticated users.
- Test group creation, invitations, role changes, member removal, and 100-member limit.
- Test group challenge read/edit RLS for owner, admin, member, viewer, and outside users.
- Test `search_profiles` result limits and exposed fields.
- Confirm whether the challenge section list is sufficient for the MVP saved workspace.
- Confirm whether organization accounts need schema support before MVP launch.
