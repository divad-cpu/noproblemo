# Database Schema

## Current Implementation Status

No application database schema is implemented yet.

Current Supabase files:

- `supabase/config.toml`
- `supabase/seed.sql`

There is no `supabase/migrations/` directory, no app-side Supabase client, and no authenticated database reads or writes. Any table list below is planned and must be verified before migration work.

## Intended Tables

### `profiles`

Purpose: public-safe user profile linked to Supabase Auth.

Likely fields:

- `id uuid primary key references auth.users(id)`
- `display_name text`
- `avatar_url text`
- `created_at timestamptz`
- `updated_at timestamptz`

### `challenges`

Purpose: saved problem-solving challenge.

Likely fields:

- `id uuid primary key`
- `owner_id uuid references profiles(id)`
- `title text`
- `short_description text`
- `visibility text` with values such as `private`, `group`, possibly `public` later
- `status text`
- `created_at timestamptz`
- `updated_at timestamptz`

### `challenge_sections`

Purpose: structured problem-solving content.

Likely fields:

- `id uuid primary key`
- `challenge_id uuid references challenges(id)`
- `section_key text`
- `content text`
- `position integer`
- `updated_by uuid references profiles(id)`
- `updated_at timestamptz`

Expected section keys:

- `problem_title`
- `short_description`
- `background_context`
- `who_is_affected`
- `why_it_matters`
- `possible_causes`
- `possible_solutions`
- `pros_cons`
- `priority_ranking`
- `tasks_actions`
- `final_recommendation`
- `summary_export`

### `challenge_solutions`

Purpose: candidate solutions with pros, cons, and ranking.

Likely fields:

- `id uuid primary key`
- `challenge_id uuid references challenges(id)`
- `title text`
- `description text`
- `pros text`
- `cons text`
- `score numeric`
- `rank integer`
- `created_by uuid references profiles(id)`

### `tasks`

Purpose: action items connected to a challenge.

Likely fields:

- `id uuid primary key`
- `challenge_id uuid references challenges(id)`
- `assigned_to uuid references profiles(id)`
- `title text`
- `description text`
- `status text`
- `due_at timestamptz`
- `created_at timestamptz`

### `friendships`

Purpose: direct user relationship for inviting/collaborating.

Likely fields:

- `id uuid primary key`
- `requester_id uuid references profiles(id)`
- `recipient_id uuid references profiles(id)`
- `status text` with values such as `pending`, `accepted`, `declined`, `blocked`
- `created_at timestamptz`
- `responded_at timestamptz`

### `groups`

Purpose: user-created collaboration group.

Likely fields:

- `id uuid primary key`
- `owner_id uuid references profiles(id)`
- `name text`
- `description text`
- `created_at timestamptz`

### `group_memberships`

Purpose: accepted group members and roles.

Likely fields:

- `id uuid primary key`
- `group_id uuid references groups(id)`
- `user_id uuid references profiles(id)`
- `role text` with values such as `owner`, `admin`, `member`
- `created_at timestamptz`

### `group_invites`

Purpose: accept/decline invitations to groups.

Likely fields:

- `id uuid primary key`
- `group_id uuid references groups(id)`
- `inviter_id uuid references profiles(id)`
- `invitee_id uuid references profiles(id)`
- `status text` with values such as `pending`, `accepted`, `declined`, `expired`
- `created_at timestamptz`
- `responded_at timestamptz`

### `challenge_collaborators`

Purpose: grants access to a challenge for a user or group.

Likely fields:

- `id uuid primary key`
- `challenge_id uuid references challenges(id)`
- `user_id uuid references profiles(id) null`
- `group_id uuid references groups(id) null`
- `role text` with values such as `viewer`, `editor`, `owner`
- `created_at timestamptz`

### `messages`

Purpose: simple internal messages related to users, groups, or challenges.

Likely fields:

- `id uuid primary key`
- `sender_id uuid references profiles(id)`
- `recipient_id uuid references profiles(id) null`
- `group_id uuid references groups(id) null`
- `challenge_id uuid references challenges(id) null`
- `body text`
- `created_at timestamptz`
- `read_at timestamptz`

## Relationships

- A profile maps one-to-one to an auth user.
- A user owns many challenges.
- A challenge has many sections, solutions, tasks, collaborators, and possibly messages.
- A group has many memberships and invites.
- A user can access a group only through accepted membership.
- A user can access a challenge only as owner, explicit collaborator, or accepted member of a group that has challenge access.
- Messages are visible only to sender and valid recipient context.

## Row-Level Security Thinking

Every application table should have RLS enabled.

Expected policies:

- Users can read and update their own profile.
- Challenge owners can read, update, and delete their challenges.
- Challenge collaborators can read or update according to their role.
- Group members can read group records and membership records for groups they belong to.
- Group invites are visible to inviter, invitee, and group admins.
- Invites require explicit accept/decline; membership should not be created silently.
- Private messages are visible only to sender and recipient, or members of the relevant group/challenge if group messaging is implemented.
- Service role keys must never be used in browser code.

## Unknown Or Needs Verification

- Exact auth provider strategy.
- Whether organizations need separate tables in MVP.
- Whether messages are direct-only, group-only, challenge-only, or all three.
- Whether challenge sections should be separate rows or a JSON document.
- Whether solution scoring is MVP or future.
- Exact audit/history requirements.
