-- Phase 4: Supabase foundation for NoProblemo.
-- This migration creates the first private application tables and owner-only RLS.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  preferred_locale text not null default 'en',
  role text not null default 'user',
  support_contact_seen boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_preferred_locale_check check (
    preferred_locale in ('en', 'zh-CN', 'hi', 'es', 'ar', 'fr', 'bn', 'pt-BR', 'id', 'ur', 'nb')
  ),
  constraint profiles_role_check check (role in ('user', 'admin'))
);

create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  short_description text,
  status text not null default 'draft',
  visibility text not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint challenges_status_check check (status in ('draft', 'active', 'completed', 'archived')),
  constraint challenges_visibility_check check (visibility in ('private', 'group'))
);

create table public.challenge_sections (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  section_key text not null,
  content text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint challenge_sections_section_key_check check (
    section_key in (
      'problem_title',
      'short_description',
      'background_context',
      'who_is_affected',
      'why_it_matters',
      'possible_causes',
      'final_recommendation',
      'summary'
    )
  )
);

create table public.challenge_solutions (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  title text not null,
  description text,
  pros text,
  cons text,
  risk integer,
  effort integer,
  impact integer,
  resources_needed text,
  priority integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint challenge_solutions_risk_check check (risk is null or risk between 1 and 5),
  constraint challenge_solutions_effort_check check (effort is null or effort between 1 and 5),
  constraint challenge_solutions_impact_check check (impact is null or impact between 1 and 5)
);

create table public.challenge_tasks (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  title text not null,
  description text,
  responsible_person text,
  deadline date,
  completed boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index challenges_owner_id_idx on public.challenges(owner_id);
create index challenge_sections_challenge_id_idx on public.challenge_sections(challenge_id);
create index challenge_solutions_challenge_id_idx on public.challenge_solutions(challenge_id);
create index challenge_tasks_challenge_id_idx on public.challenge_tasks(challenge_id);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger challenges_set_updated_at
before update on public.challenges
for each row execute function public.set_updated_at();

create trigger challenge_sections_set_updated_at
before update on public.challenge_sections
for each row execute function public.set_updated_at();

create trigger challenge_solutions_set_updated_at
before update on public.challenge_solutions
for each row execute function public.set_updated_at();

create trigger challenge_tasks_set_updated_at
before update on public.challenge_tasks
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger auth_users_create_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();

alter table public.profiles enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_sections enable row level security;
alter table public.challenge_solutions enable row level security;
alter table public.challenge_tasks enable row level security;

grant select, insert on public.profiles to authenticated;
grant update (display_name, avatar_url, preferred_locale, support_contact_seen) on public.profiles to authenticated;

grant select, insert, update, delete on public.challenges to authenticated;
grant select, insert, update, delete on public.challenge_sections to authenticated;
grant select, insert, update, delete on public.challenge_solutions to authenticated;
grant select, insert, update, delete on public.challenge_tasks to authenticated;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (id = auth.uid() and role = 'user');

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "challenges_select_own"
on public.challenges
for select
to authenticated
using (owner_id = auth.uid());

create policy "challenges_insert_own"
on public.challenges
for insert
to authenticated
with check (owner_id = auth.uid());

create policy "challenges_update_own"
on public.challenges
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "challenges_delete_own"
on public.challenges
for delete
to authenticated
using (owner_id = auth.uid());

create policy "challenge_sections_select_for_owned_challenge"
on public.challenge_sections
for select
to authenticated
using (
  exists (
    select 1
    from public.challenges
    where challenges.id = challenge_sections.challenge_id
      and challenges.owner_id = auth.uid()
  )
);

create policy "challenge_sections_insert_for_owned_challenge"
on public.challenge_sections
for insert
to authenticated
with check (
  exists (
    select 1
    from public.challenges
    where challenges.id = challenge_sections.challenge_id
      and challenges.owner_id = auth.uid()
  )
);

create policy "challenge_sections_update_for_owned_challenge"
on public.challenge_sections
for update
to authenticated
using (
  exists (
    select 1
    from public.challenges
    where challenges.id = challenge_sections.challenge_id
      and challenges.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.challenges
    where challenges.id = challenge_sections.challenge_id
      and challenges.owner_id = auth.uid()
  )
);

create policy "challenge_sections_delete_for_owned_challenge"
on public.challenge_sections
for delete
to authenticated
using (
  exists (
    select 1
    from public.challenges
    where challenges.id = challenge_sections.challenge_id
      and challenges.owner_id = auth.uid()
  )
);

create policy "challenge_solutions_select_for_owned_challenge"
on public.challenge_solutions
for select
to authenticated
using (
  exists (
    select 1
    from public.challenges
    where challenges.id = challenge_solutions.challenge_id
      and challenges.owner_id = auth.uid()
  )
);

create policy "challenge_solutions_insert_for_owned_challenge"
on public.challenge_solutions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.challenges
    where challenges.id = challenge_solutions.challenge_id
      and challenges.owner_id = auth.uid()
  )
);

create policy "challenge_solutions_update_for_owned_challenge"
on public.challenge_solutions
for update
to authenticated
using (
  exists (
    select 1
    from public.challenges
    where challenges.id = challenge_solutions.challenge_id
      and challenges.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.challenges
    where challenges.id = challenge_solutions.challenge_id
      and challenges.owner_id = auth.uid()
  )
);

create policy "challenge_solutions_delete_for_owned_challenge"
on public.challenge_solutions
for delete
to authenticated
using (
  exists (
    select 1
    from public.challenges
    where challenges.id = challenge_solutions.challenge_id
      and challenges.owner_id = auth.uid()
  )
);

create policy "challenge_tasks_select_for_owned_challenge"
on public.challenge_tasks
for select
to authenticated
using (
  exists (
    select 1
    from public.challenges
    where challenges.id = challenge_tasks.challenge_id
      and challenges.owner_id = auth.uid()
  )
);

create policy "challenge_tasks_insert_for_owned_challenge"
on public.challenge_tasks
for insert
to authenticated
with check (
  exists (
    select 1
    from public.challenges
    where challenges.id = challenge_tasks.challenge_id
      and challenges.owner_id = auth.uid()
  )
);

create policy "challenge_tasks_update_for_owned_challenge"
on public.challenge_tasks
for update
to authenticated
using (
  exists (
    select 1
    from public.challenges
    where challenges.id = challenge_tasks.challenge_id
      and challenges.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.challenges
    where challenges.id = challenge_tasks.challenge_id
      and challenges.owner_id = auth.uid()
  )
);

create policy "challenge_tasks_delete_for_owned_challenge"
on public.challenge_tasks
for delete
to authenticated
using (
  exists (
    select 1
    from public.challenges
    where challenges.id = challenge_tasks.challenge_id
      and challenges.owner_id = auth.uid()
  )
);
