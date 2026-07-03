# Database Schema

## Current Implementation Status

Phase 4 Supabase foundation is implemented locally in migration:

- `supabase/migrations/20260703190000_phase4_supabase_foundation.sql`

The migration has not been verified against the live Supabase project in this task. It should be applied and tested in Supabase before any production data depends on it.

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

## Implemented Functions And Triggers

- `public.set_updated_at()` updates `updated_at` before row updates.
- `profiles_set_updated_at`
- `challenges_set_updated_at`
- `challenge_sections_set_updated_at`
- `challenge_solutions_set_updated_at`
- `challenge_tasks_set_updated_at`
- `public.handle_new_user_profile()` creates a basic profile after a new `auth.users` row is inserted.
- `auth_users_create_profile` trigger on `auth.users`.

## Implemented RLS Policies

RLS is enabled on:

- `profiles`
- `challenges`
- `challenge_sections`
- `challenge_solutions`
- `challenge_tasks`

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

## Planned Tables Not Implemented Yet

- `friendships`
- `groups`
- `group_memberships`
- `group_invites`
- `challenge_collaborators`
- `messages`
- Organization/account tables
- Audit/history tables

Group and collaboration access policies are intentionally not implemented in Phase 4. They must be designed when friends, groups, invites, and messaging are scoped.

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

## Needs Verification

- Apply migration in local Supabase and/or linked Supabase project.
- Test profile trigger after signup.
- Test every RLS policy with authenticated users.
- Test Phase 6 dashboard reads, create challenge, profile update, and guest import against a running Supabase project.
- Confirm whether the challenge section list is sufficient for the MVP saved workspace.
- Confirm whether organization accounts need schema support before MVP launch.
