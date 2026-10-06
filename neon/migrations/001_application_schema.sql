BEGIN;
GRANT USAGE ON SCHEMA public TO authenticated, anonymous;

-- Preserved source migration: 20260703190000_phase4_supabase_foundation.sql
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
  id uuid primary key references neon_auth."user"(id) on delete cascade,
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
  owner_id uuid not null references neon_auth."user"(id) on delete cascade,
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
    new.name,
    new.image
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger auth_users_create_profile
after insert on neon_auth."user"
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

-- Preserved source migration: 20260703210000_phase8_friends_groups.sql
-- Phase 8: friends, groups, invitations, and group challenge access.

create table public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references neon_auth."user"(id) on delete cascade,
  receiver_id uuid not null references neon_auth."user"(id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint friend_requests_not_self check (sender_id <> receiver_id),
  constraint friend_requests_status_check check (status in ('pending', 'accepted', 'declined', 'canceled'))
);

create unique index friend_requests_pending_unique
on public.friend_requests (least(sender_id, receiver_id), greatest(sender_id, receiver_id))
where status = 'pending';

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_one_id uuid not null references neon_auth."user"(id) on delete cascade,
  user_two_id uuid not null references neon_auth."user"(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint friendships_not_self check (user_one_id <> user_two_id),
  constraint friendships_canonical_order check (user_one_id < user_two_id)
);

create unique index friendships_pair_unique
on public.friendships (user_one_id, user_two_id);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references neon_auth."user"(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references neon_auth."user"(id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint group_members_role_check check (role in ('owner', 'admin', 'member', 'viewer'))
);

create unique index group_members_group_user_unique
on public.group_members (group_id, user_id);

create table public.group_invitations (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  inviter_id uuid not null references neon_auth."user"(id) on delete cascade,
  invitee_id uuid not null references neon_auth."user"(id) on delete cascade,
  role text not null default 'member',
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint group_invitations_not_self check (inviter_id <> invitee_id),
  constraint group_invitations_role_check check (role in ('admin', 'member', 'viewer')),
  constraint group_invitations_status_check check (status in ('pending', 'accepted', 'declined', 'canceled'))
);

create unique index group_invitations_pending_unique
on public.group_invitations (group_id, invitee_id)
where status = 'pending';

create table public.group_challenges (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  created_by uuid references neon_auth."user"(id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index group_challenges_group_challenge_unique
on public.group_challenges (group_id, challenge_id);

create index friend_requests_sender_idx on public.friend_requests(sender_id);
create index friend_requests_receiver_idx on public.friend_requests(receiver_id);
create index friendships_user_one_idx on public.friendships(user_one_id);
create index friendships_user_two_idx on public.friendships(user_two_id);
create index groups_owner_idx on public.groups(owner_id);
create index group_members_group_idx on public.group_members(group_id);
create index group_members_user_idx on public.group_members(user_id);
create index group_invitations_group_idx on public.group_invitations(group_id);
create index group_invitations_invitee_idx on public.group_invitations(invitee_id);
create index group_challenges_group_idx on public.group_challenges(group_id);
create index group_challenges_challenge_idx on public.group_challenges(challenge_id);

create trigger friend_requests_set_updated_at
before update on public.friend_requests
for each row execute function public.set_updated_at();

create trigger groups_set_updated_at
before update on public.groups
for each row execute function public.set_updated_at();

create trigger group_members_set_updated_at
before update on public.group_members
for each row execute function public.set_updated_at();

create trigger group_invitations_set_updated_at
before update on public.group_invitations
for each row execute function public.set_updated_at();

create or replace function public.group_role(target_group_id uuid, target_user_id uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select gm.role
  from public.group_members gm
  where gm.group_id = target_group_id
    and gm.user_id = target_user_id
  limit 1
$$;

create or replace function public.is_group_member(target_group_id uuid, target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.group_members gm
    where gm.group_id = target_group_id
      and gm.user_id = target_user_id
  )
$$;

create or replace function public.can_manage_group(target_group_id uuid, target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.group_role(target_group_id, target_user_id) in ('owner', 'admin'), false)
$$;

create or replace function public.can_read_group_challenge(target_challenge_id uuid, target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.group_challenges gc
    join public.group_members gm on gm.group_id = gc.group_id
    where gc.challenge_id = target_challenge_id
      and gm.user_id = target_user_id
  )
$$;

create or replace function public.can_edit_group_challenge(target_challenge_id uuid, target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.group_challenges gc
    join public.group_members gm on gm.group_id = gc.group_id
    where gc.challenge_id = target_challenge_id
      and gm.user_id = target_user_id
      and gm.role in ('owner', 'admin', 'member')
  )
$$;

create or replace function public.check_group_member_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    select count(*)
    from public.group_members
    where group_id = new.group_id
  ) >= 100 then
    raise exception 'Group member limit reached';
  end if;

  return new;
end;
$$;

create trigger group_members_limit_100
before insert on public.group_members
for each row execute function public.check_group_member_limit();

create or replace function public.create_owner_group_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.group_members (group_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (group_id, user_id) do nothing;

  return new;
end;
$$;

create trigger groups_create_owner_member
after insert on public.groups
for each row execute function public.create_owner_group_member();

create or replace function public.prevent_group_without_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role = 'owner'
    and not exists (
      select 1
      from public.group_members
      where group_id = old.group_id
        and role = 'owner'
        and id <> old.id
    ) then
    raise exception 'Group must keep an owner';
  end if;

  return old;
end;
$$;

create trigger group_members_keep_owner_delete
before delete on public.group_members
for each row execute function public.prevent_group_without_owner();

create or replace function public.create_friendship_from_accepted_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'accepted' and old.status = 'pending' then
    insert into public.friendships (user_one_id, user_two_id)
    values (least(new.sender_id, new.receiver_id), greatest(new.sender_id, new.receiver_id))
    on conflict (user_one_id, user_two_id) do nothing;
  end if;

  return new;
end;
$$;

create trigger friend_requests_accept_create_friendship
after update on public.friend_requests
for each row execute function public.create_friendship_from_accepted_request();

create or replace function public.create_group_member_from_accepted_invitation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'accepted' and old.status = 'pending' then
    insert into public.group_members (group_id, user_id, role)
    values (new.group_id, new.invitee_id, new.role)
    on conflict (group_id, user_id) do nothing;
  end if;

  return new;
end;
$$;

create trigger group_invitations_accept_create_member
after update on public.group_invitations
for each row execute function public.create_group_member_from_accepted_invitation();

create or replace function public.search_profiles(search_term text)
returns table(id uuid, display_name text, avatar_url text)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.display_name, p.avatar_url
  from public.profiles p
  where auth.uid() is not null
    and (
      p.id::text = search_term
      or (
        length(trim(search_term)) >= 2
        and p.display_name ilike '%' || trim(search_term) || '%'
      )
    )
  order by p.display_name nulls last
  limit 10
$$;

alter table public.friend_requests enable row level security;
alter table public.friendships enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_invitations enable row level security;
alter table public.group_challenges enable row level security;

grant select, insert, update, delete on public.friend_requests to authenticated;
grant select, insert, delete on public.friendships to authenticated;
grant select, insert, update, delete on public.groups to authenticated;
grant select, insert, update, delete on public.group_members to authenticated;
grant select, insert, update, delete on public.group_invitations to authenticated;
grant select, insert, delete on public.group_challenges to authenticated;
grant execute on function public.search_profiles(text) to authenticated;

create policy "friend_requests_select_involved"
on public.friend_requests for select to authenticated
using (sender_id = auth.uid() or receiver_id = auth.uid());

create policy "friend_requests_insert_sender"
on public.friend_requests for insert to authenticated
with check (sender_id = auth.uid() and status = 'pending');

create policy "friend_requests_update_involved"
on public.friend_requests for update to authenticated
using (sender_id = auth.uid() or receiver_id = auth.uid())
with check (
  (receiver_id = auth.uid() and status in ('accepted', 'declined'))
  or (sender_id = auth.uid() and status = 'canceled')
);

create policy "friendships_select_involved"
on public.friendships for select to authenticated
using (user_one_id = auth.uid() or user_two_id = auth.uid());

create policy "friendships_insert_involved"
on public.friendships for insert to authenticated
with check (user_one_id = auth.uid() or user_two_id = auth.uid());

create policy "friendships_delete_involved"
on public.friendships for delete to authenticated
using (user_one_id = auth.uid() or user_two_id = auth.uid());

create policy "groups_insert_owner"
on public.groups for insert to authenticated
with check (owner_id = auth.uid());

create policy "groups_select_member"
on public.groups for select to authenticated
using (public.is_group_member(id, auth.uid()));

create policy "groups_update_manager"
on public.groups for update to authenticated
using (public.can_manage_group(id, auth.uid()))
with check (public.can_manage_group(id, auth.uid()));

create policy "groups_delete_owner"
on public.groups for delete to authenticated
using (public.group_role(id, auth.uid()) = 'owner');

create policy "group_members_select_member"
on public.group_members for select to authenticated
using (public.is_group_member(group_id, auth.uid()) or user_id = auth.uid());

create policy "group_members_insert_invited_or_manager"
on public.group_members for insert to authenticated
with check (
  public.can_manage_group(group_id, auth.uid())
  or (
    user_id = auth.uid()
    and exists (
      select 1
      from public.group_invitations gi
      where gi.group_id = group_members.group_id
        and gi.invitee_id = auth.uid()
        and gi.status = 'accepted'
        and gi.role = group_members.role
    )
  )
);

create policy "group_members_update_owner"
on public.group_members for update to authenticated
using (public.group_role(group_id, auth.uid()) = 'owner')
with check (public.group_role(group_id, auth.uid()) = 'owner');

create policy "group_members_delete_manager"
on public.group_members for delete to authenticated
using (
  user_id = auth.uid()
  or public.group_role(group_id, auth.uid()) = 'owner'
  or (
    public.group_role(group_id, auth.uid()) = 'admin'
    and role in ('member', 'viewer')
  )
);

create policy "group_invitations_select_related"
on public.group_invitations for select to authenticated
using (
  invitee_id = auth.uid()
  or inviter_id = auth.uid()
  or public.can_manage_group(group_id, auth.uid())
);

create policy "group_invitations_insert_manager"
on public.group_invitations for insert to authenticated
with check (
  inviter_id = auth.uid()
  and status = 'pending'
  and public.can_manage_group(group_id, auth.uid())
);

create policy "group_invitations_update_related"
on public.group_invitations for update to authenticated
using (
  invitee_id = auth.uid()
  or inviter_id = auth.uid()
  or public.can_manage_group(group_id, auth.uid())
)
with check (
  (invitee_id = auth.uid() and status in ('accepted', 'declined'))
  or (inviter_id = auth.uid() and status = 'canceled')
  or (public.can_manage_group(group_id, auth.uid()) and status = 'canceled')
);

create policy "group_challenges_select_member"
on public.group_challenges for select to authenticated
using (public.is_group_member(group_id, auth.uid()));

create policy "group_challenges_insert_allowed"
on public.group_challenges for insert to authenticated
with check (
  created_by = auth.uid()
  and (
    public.can_manage_group(group_id, auth.uid())
    or public.group_role(group_id, auth.uid()) = 'member'
  )
);

create policy "group_challenges_delete_manager"
on public.group_challenges for delete to authenticated
using (public.can_manage_group(group_id, auth.uid()));

create policy "challenges_select_group_member"
on public.challenges for select to authenticated
using (public.can_read_group_challenge(id, auth.uid()));

create policy "challenges_update_group_editor"
on public.challenges for update to authenticated
using (public.can_edit_group_challenge(id, auth.uid()))
with check (public.can_edit_group_challenge(id, auth.uid()));

create policy "challenge_sections_select_group_member"
on public.challenge_sections for select to authenticated
using (public.can_read_group_challenge(challenge_id, auth.uid()));

create policy "challenge_sections_insert_group_editor"
on public.challenge_sections for insert to authenticated
with check (public.can_edit_group_challenge(challenge_id, auth.uid()));

create policy "challenge_sections_update_group_editor"
on public.challenge_sections for update to authenticated
using (public.can_edit_group_challenge(challenge_id, auth.uid()))
with check (public.can_edit_group_challenge(challenge_id, auth.uid()));

create policy "challenge_sections_delete_group_editor"
on public.challenge_sections for delete to authenticated
using (public.can_edit_group_challenge(challenge_id, auth.uid()));

create policy "challenge_solutions_select_group_member"
on public.challenge_solutions for select to authenticated
using (public.can_read_group_challenge(challenge_id, auth.uid()));

create policy "challenge_solutions_insert_group_editor"
on public.challenge_solutions for insert to authenticated
with check (public.can_edit_group_challenge(challenge_id, auth.uid()));

create policy "challenge_solutions_update_group_editor"
on public.challenge_solutions for update to authenticated
using (public.can_edit_group_challenge(challenge_id, auth.uid()))
with check (public.can_edit_group_challenge(challenge_id, auth.uid()));

create policy "challenge_solutions_delete_group_editor"
on public.challenge_solutions for delete to authenticated
using (public.can_edit_group_challenge(challenge_id, auth.uid()));

create policy "challenge_tasks_select_group_member"
on public.challenge_tasks for select to authenticated
using (public.can_read_group_challenge(challenge_id, auth.uid()));

create policy "challenge_tasks_insert_group_editor"
on public.challenge_tasks for insert to authenticated
with check (public.can_edit_group_challenge(challenge_id, auth.uid()));

create policy "challenge_tasks_update_group_editor"
on public.challenge_tasks for update to authenticated
using (public.can_edit_group_challenge(challenge_id, auth.uid()))
with check (public.can_edit_group_challenge(challenge_id, auth.uid()));

create policy "challenge_tasks_delete_group_editor"
on public.challenge_tasks for delete to authenticated
using (public.can_edit_group_challenge(challenge_id, auth.uid()));

-- Preserved source migration: 20260703220000_phase9_messaging_notifications_activity.sql
-- Phase 9: protected messages, private notifications, and activity events.

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references neon_auth."user"(id) on delete set null,
  group_id uuid references public.groups(id) on delete cascade,
  challenge_id uuid references public.challenges(id) on delete cascade,
  body text not null,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint messages_one_scope check (
    (group_id is not null and challenge_id is null)
    or (group_id is null and challenge_id is not null)
  ),
  constraint messages_body_length check (char_length(trim(body)) between 1 and 2000)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references neon_auth."user"(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  related_group_id uuid references public.groups(id) on delete set null,
  related_challenge_id uuid references public.challenges(id) on delete set null,
  related_message_id uuid references public.messages(id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_type_check check (
    type in (
      'friend_request',
      'friend_request_accepted',
      'group_invitation',
      'group_invitation_accepted',
      'group_invitation_declined',
      'group_message',
      'challenge_message',
      'challenge_updated',
      'group_updated'
    )
  )
);

create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references neon_auth."user"(id) on delete set null,
  group_id uuid references public.groups(id) on delete cascade,
  challenge_id uuid references public.challenges(id) on delete cascade,
  type text not null,
  summary text,
  created_at timestamptz not null default now(),
  constraint activity_events_scope check (group_id is not null or challenge_id is not null),
  constraint activity_events_type_check check (
    type in (
      'challenge_created',
      'challenge_updated',
      'challenge_linked_to_group',
      'group_created',
      'group_updated',
      'group_member_joined',
      'group_member_removed',
      'group_message_created',
      'challenge_message_created',
      'task_updated',
      'solution_updated'
    )
  )
);

create index messages_group_idx on public.messages(group_id, created_at desc);
create index messages_challenge_idx on public.messages(challenge_id, created_at desc);
create index messages_sender_idx on public.messages(sender_id);
create index notifications_user_idx on public.notifications(user_id, read_at, created_at desc);
create index activity_events_group_idx on public.activity_events(group_id, created_at desc);
create index activity_events_challenge_idx on public.activity_events(challenge_id, created_at desc);

create trigger messages_set_updated_at
before update on public.messages
for each row execute function public.set_updated_at();

create or replace function public.can_read_challenge(target_challenge_id uuid, target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.challenges c
    where c.id = target_challenge_id
      and c.owner_id = target_user_id
  )
  or public.can_read_group_challenge(target_challenge_id, target_user_id)
$$;

create or replace function public.can_participate_challenge(target_challenge_id uuid, target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.challenges c
    where c.id = target_challenge_id
      and c.owner_id = target_user_id
  )
  or public.can_edit_group_challenge(target_challenge_id, target_user_id)
$$;

create or replace function public.notify_user(
  target_user_id uuid,
  notification_type text,
  notification_title text,
  notification_body text default null,
  notification_group_id uuid default null,
  notification_challenge_id uuid default null,
  notification_message_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if target_user_id is null then
    return;
  end if;

  insert into public.notifications (
    user_id,
    type,
    title,
    body,
    related_group_id,
    related_challenge_id,
    related_message_id
  )
  values (
    target_user_id,
    notification_type,
    notification_title,
    notification_body,
    notification_group_id,
    notification_challenge_id,
    notification_message_id
  );
end;
$$;

create or replace function public.create_friend_request_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_user(
    new.receiver_id,
    'friend_request',
    'New friend request',
    'Someone sent you a friend request.'
  );

  return new;
end;
$$;

create trigger friend_requests_notify_receiver
after insert on public.friend_requests
for each row execute function public.create_friend_request_notification();

create or replace function public.create_friend_response_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'accepted' and old.status = 'pending' then
    perform public.notify_user(
      new.sender_id,
      'friend_request_accepted',
      'Friend request accepted',
      'Your friend request was accepted.'
    );
  end if;

  return new;
end;
$$;

create trigger friend_requests_notify_response
after update on public.friend_requests
for each row execute function public.create_friend_response_notification();

create or replace function public.create_group_invitation_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_user(
    new.invitee_id,
    'group_invitation',
    'New group invitation',
    'You were invited to a group.',
    new.group_id
  );

  return new;
end;
$$;

create trigger group_invitations_notify_invitee
after insert on public.group_invitations
for each row execute function public.create_group_invitation_notification();

create or replace function public.create_group_invitation_response_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = 'pending' and new.status in ('accepted', 'declined') then
    perform public.notify_user(
      new.inviter_id,
      case
        when new.status = 'accepted' then 'group_invitation_accepted'
        else 'group_invitation_declined'
      end,
      case
        when new.status = 'accepted' then 'Group invitation accepted'
        else 'Group invitation declined'
      end,
      'A group invitation was updated.',
      new.group_id
    );
  end if;

  return new;
end;
$$;

create trigger group_invitations_notify_response
after update on public.group_invitations
for each row execute function public.create_group_invitation_response_notification();

create or replace function public.create_group_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.activity_events (actor_id, group_id, type, summary)
  values (
    new.owner_id,
    new.id,
    case when tg_op = 'INSERT' then 'group_created' else 'group_updated' end,
    case when tg_op = 'INSERT' then 'Group created.' else 'Group updated.' end
  );

  return new;
end;
$$;

create trigger groups_activity_created
after insert on public.groups
for each row execute function public.create_group_activity();

create trigger groups_activity_updated
after update on public.groups
for each row execute function public.create_group_activity();

create or replace function public.create_group_member_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.activity_events (actor_id, group_id, type, summary)
    values (new.user_id, new.group_id, 'group_member_joined', 'Group member joined.');
    return new;
  end if;

  insert into public.activity_events (actor_id, group_id, type, summary)
  values (old.user_id, old.group_id, 'group_member_removed', 'Group member removed.');
  return old;
end;
$$;

create trigger group_members_activity_joined
after insert on public.group_members
for each row execute function public.create_group_member_activity();

create trigger group_members_activity_removed
after delete on public.group_members
for each row execute function public.create_group_member_activity();

create or replace function public.create_group_challenge_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.activity_events (actor_id, group_id, challenge_id, type, summary)
  values (
    new.created_by,
    new.group_id,
    new.challenge_id,
    'challenge_linked_to_group',
    'Challenge linked to group.'
  );

  return new;
end;
$$;

create trigger group_challenges_activity_linked
after insert on public.group_challenges
for each row execute function public.create_group_challenge_activity();

create or replace function public.create_message_side_effects()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.group_id is not null then
    insert into public.activity_events (actor_id, group_id, type, summary)
    values (new.sender_id, new.group_id, 'group_message_created', 'Group message created.');

    insert into public.notifications (
      user_id,
      type,
      title,
      body,
      related_group_id,
      related_message_id
    )
    select gm.user_id, 'group_message', 'New group message', 'A group has a new message.', new.group_id, new.id
    from public.group_members gm
    where gm.group_id = new.group_id
      and gm.user_id <> new.sender_id;
  else
    insert into public.activity_events (actor_id, challenge_id, type, summary)
    values (new.sender_id, new.challenge_id, 'challenge_message_created', 'Challenge message created.');

    insert into public.notifications (
      user_id,
      type,
      title,
      body,
      related_challenge_id,
      related_message_id
    )
    select distinct recipient_id, 'challenge_message', 'New challenge message', 'A challenge has a new message.', new.challenge_id, new.id
    from (
      select c.owner_id as recipient_id
      from public.challenges c
      where c.id = new.challenge_id
      union
      select gm.user_id as recipient_id
      from public.group_challenges gc
      join public.group_members gm on gm.group_id = gc.group_id
      where gc.challenge_id = new.challenge_id
    ) recipients
    where recipient_id is not null
      and recipient_id <> new.sender_id;
  end if;

  return new;
end;
$$;

create trigger messages_create_side_effects
after insert on public.messages
for each row execute function public.create_message_side_effects();

alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.activity_events enable row level security;

grant select, insert on public.messages to authenticated;
grant update (is_deleted) on public.messages to authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
grant select, insert on public.activity_events to authenticated;

create policy "messages_select_authorized"
on public.messages for select to authenticated
using (
  (
    group_id is not null
    and public.is_group_member(group_id, auth.uid())
  )
  or (
    challenge_id is not null
    and public.can_read_challenge(challenge_id, auth.uid())
  )
);

create policy "messages_insert_authorized"
on public.messages for insert to authenticated
with check (
  sender_id = auth.uid()
  and is_deleted = false
  and (
    (
      group_id is not null
      and public.group_role(group_id, auth.uid()) in ('owner', 'admin', 'member')
    )
    or (
      challenge_id is not null
      and public.can_participate_challenge(challenge_id, auth.uid())
    )
  )
);

create policy "messages_soft_delete_authorized"
on public.messages for update to authenticated
using (
  sender_id = auth.uid()
  or (
    group_id is not null
    and public.can_manage_group(group_id, auth.uid())
  )
)
with check (
  is_deleted = true
  and (
    sender_id = auth.uid()
    or (
      group_id is not null
      and public.can_manage_group(group_id, auth.uid())
    )
  )
);

create policy "notifications_select_own"
on public.notifications for select to authenticated
using (user_id = auth.uid());

create policy "notifications_update_own_read_state"
on public.notifications for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "activity_events_select_authorized"
on public.activity_events for select to authenticated
using (
  (
    group_id is not null
    and public.is_group_member(group_id, auth.uid())
  )
  or (
    challenge_id is not null
    and public.can_read_challenge(challenge_id, auth.uid())
  )
);

create policy "activity_events_insert_authorized"
on public.activity_events for insert to authenticated
with check (
  actor_id = auth.uid()
  and (
    (
      group_id is not null
      and public.is_group_member(group_id, auth.uid())
    )
    or (
      challenge_id is not null
      and public.can_participate_challenge(challenge_id, auth.uid())
    )
  )
);

-- Preserved source migration: 20260704090000_phase10_admin_settings_logs.sql
-- Phase 10: admin/settings foundation and local project log support.
-- Adds explicit admin helpers, admin-only aggregate RPCs, audit-log storage,
-- and profile role hardening without exposing neon_auth."user" or private content.

create or replace function public.is_admin(target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = target_user_id
      and p.role = 'admin'
  )
$$;

grant execute on function public.is_admin(uuid) to authenticated;

create or replace function public.prevent_profile_role_self_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role is distinct from new.role and auth.uid() = old.id then
    raise exception 'Profile role cannot be self-assigned';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_prevent_role_self_change on public.profiles;
create trigger profiles_prevent_role_self_change
before update of role on public.profiles
for each row execute function public.prevent_profile_role_self_change();

revoke update (role) on public.profiles from authenticated;

drop policy if exists "profiles_select_admin_all" on public.profiles;
create policy "profiles_select_admin_all"
on public.profiles
for select
to authenticated
using (public.is_admin(auth.uid()));

create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references neon_auth."user"(id) on delete set null,
  action text not null,
  target_table text,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint admin_audit_log_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create index admin_audit_log_created_at_idx on public.admin_audit_log(created_at desc);
create index admin_audit_log_actor_idx on public.admin_audit_log(actor_id);

alter table public.admin_audit_log enable row level security;

revoke all on public.admin_audit_log from anonymous, authenticated;
grant select on public.admin_audit_log to authenticated;

create policy "admin_audit_log_select_admin"
on public.admin_audit_log
for select
to authenticated
using (public.is_admin(auth.uid()));

create or replace function public.admin_overview_counts()
returns table(metric text, value bigint)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  return query
    select 'profiles'::text, count(*)::bigint from public.profiles
    union all
    select 'challenges'::text, count(*)::bigint from public.challenges
    union all
    select 'groups'::text, count(*)::bigint from public.groups
    union all
    select 'messages'::text, count(*)::bigint from public.messages
    union all
    select 'notifications'::text, count(*)::bigint from public.notifications;
end;
$$;

create or replace function public.admin_list_profiles(profile_limit integer default 20)
returns table(
  id uuid,
  display_name text,
  preferred_locale text,
  role text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  return query
    select p.id, p.display_name, p.preferred_locale, p.role, p.created_at
    from public.profiles p
    order by p.created_at desc
    limit least(greatest(coalesce(profile_limit, 20), 1), 50);
end;
$$;

create or replace function public.admin_recent_activity(activity_limit integer default 10)
returns table(
  id uuid,
  actor_id uuid,
  actor_display_name text,
  group_id uuid,
  challenge_id uuid,
  type text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  return query
    select
      ae.id,
      ae.actor_id,
      p.display_name,
      ae.group_id,
      ae.challenge_id,
      ae.type,
      ae.created_at
    from public.activity_events ae
    left join public.profiles p on p.id = ae.actor_id
    order by ae.created_at desc
    limit least(greatest(coalesce(activity_limit, 10), 1), 50);
end;
$$;

create or replace function public.admin_recent_audit_log(audit_limit integer default 10)
returns table(
  id uuid,
  actor_id uuid,
  action text,
  target_table text,
  target_id uuid,
  metadata jsonb,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  return query
    select
      aal.id,
      aal.actor_id,
      aal.action,
      aal.target_table,
      aal.target_id,
      aal.metadata,
      aal.created_at
    from public.admin_audit_log aal
    order by aal.created_at desc
    limit least(greatest(coalesce(audit_limit, 10), 1), 50);
end;
$$;

grant execute on function public.admin_overview_counts() to authenticated;
grant execute on function public.admin_list_profiles(integer) to authenticated;
grant execute on function public.admin_recent_activity(integer) to authenticated;
grant execute on function public.admin_recent_audit_log(integer) to authenticated;

-- Preserved source migration: 20260714120000_supabase_health_check.sql
-- Minimal public health RPC for the authenticated keepalive Route Handler.

create or replace function public.noproblemo_health_check()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select true;
$$;

revoke all on function public.noproblemo_health_check() from public;
revoke all on function public.noproblemo_health_check() from authenticated;
-- No Supabase service_role exists in Neon; no corresponding grant is created.
grant execute on function public.noproblemo_health_check() to anonymous;

-- Preserved source migration: 20260716120000_full_application_audit_security_repairs.sql
-- Full application audit: focused authorization and consent-flow repairs.

-- Prevent clients from changing identity/ownership columns through broad table grants.
revoke update on table public.challenges from authenticated;
grant update (title, short_description, status, visibility)
on table public.challenges to authenticated;

revoke update on table public.groups from authenticated;
grant update (name, description) on table public.groups to authenticated;

revoke update on table public.friend_requests from authenticated;
grant update (status, responded_at) on table public.friend_requests to authenticated;

revoke update on table public.group_invitations from authenticated;
grant update (status, responded_at) on table public.group_invitations to authenticated;

revoke update on table public.group_members from authenticated;
grant update (role) on table public.group_members to authenticated;

revoke update on table public.challenge_sections from authenticated;
grant update (content, position) on table public.challenge_sections to authenticated;

revoke update on table public.challenge_solutions from authenticated;
grant update (
  title,
  description,
  pros,
  cons,
  risk,
  effort,
  impact,
  resources_needed,
  priority
) on table public.challenge_solutions to authenticated;

revoke update on table public.challenge_tasks from authenticated;
grant update (
  title,
  description,
  responsible_person,
  deadline,
  completed,
  position
) on table public.challenge_tasks to authenticated;

-- RLS does not protect these non-DML table privileges. Browser roles do not need them.
revoke truncate, references, trigger on all tables in schema public from anonymous, authenticated;

-- Friendship and membership creation must occur through trusted acceptance/owner triggers.
revoke insert on table public.friendships from authenticated;
revoke insert on table public.group_members from authenticated;

drop policy if exists "friendships_insert_involved" on public.friendships;
drop policy if exists "group_members_insert_invited_or_manager" on public.group_members;

-- One row per workflow section makes repeated and concurrent saves deterministic.
create unique index challenge_sections_challenge_key_unique
on public.challenge_sections (challenge_id, section_key);

-- A challenge can be linked only by its owner, even through the direct Supabase API.
drop policy if exists "group_challenges_insert_allowed" on public.group_challenges;
create policy "group_challenges_insert_allowed"
on public.group_challenges for insert to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1
    from public.challenges c
    where c.id = group_challenges.challenge_id
      and c.owner_id = auth.uid()
  )
  and (
    public.can_manage_group(group_id, auth.uid())
    or public.group_role(group_id, auth.uid()) = 'member'
  )
);

-- Pending invitees receive only the invitation identity and display fields needed
-- by the invitation list. They do not gain SELECT access to the base group row.
create or replace function public.pending_group_invitations()
returns table (
  invitation_id uuid,
  group_id uuid,
  group_name text,
  invited_role text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    gi.id,
    gi.group_id,
    g.name,
    gi.role
  from public.group_invitations gi
  join public.groups g on g.id = gi.group_id
  where auth.uid() is not null
    and gi.invitee_id = auth.uid()
    and gi.status = 'pending'
  order by gi.created_at desc
$$;

alter function public.pending_group_invitations() owner to neondb_owner;
revoke execute on function public.pending_group_invitations()
from public, anonymous, authenticated;
grant execute on function public.pending_group_invitations() to authenticated;

-- Preserve at least one owner when an owner membership is deleted or demoted.
create or replace function public.prevent_group_without_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role = 'owner'
    and (tg_op = 'DELETE' or new.role <> 'owner')
    and not exists (
      select 1
      from public.group_members
      where group_id = old.group_id
        and role = 'owner'
        and id <> old.id
    ) then
    raise exception 'Group must keep an owner';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists group_members_keep_owner_update on public.group_members;
create trigger group_members_keep_owner_update
before update of role on public.group_members
for each row execute function public.prevent_group_without_owner();

-- This function is an internal trigger helper, never a public RPC.
revoke execute on function public.notify_user(
  uuid,
  text,
  text,
  text,
  uuid,
  uuid,
  uuid
) from public, anonymous, authenticated;

-- Remove PostgreSQL's default PUBLIC function execution and expose only intentional RPCs.
revoke execute on all functions in schema public from public, anonymous;

grant execute on function public.group_role(uuid, uuid) to authenticated;
grant execute on function public.is_group_member(uuid, uuid) to authenticated;
grant execute on function public.can_manage_group(uuid, uuid) to authenticated;
grant execute on function public.can_read_group_challenge(uuid, uuid) to authenticated;
grant execute on function public.can_edit_group_challenge(uuid, uuid) to authenticated;
grant execute on function public.can_read_challenge(uuid, uuid) to authenticated;
grant execute on function public.can_participate_challenge(uuid, uuid) to authenticated;
grant execute on function public.search_profiles(text) to authenticated;
grant execute on function public.is_admin(uuid) to authenticated;
grant execute on function public.admin_overview_counts() to authenticated;
grant execute on function public.admin_list_profiles(integer) to authenticated;
grant execute on function public.admin_recent_activity(integer) to authenticated;
grant execute on function public.admin_recent_audit_log(integer) to authenticated;
grant execute on function public.noproblemo_health_check() to anonymous;

-- Preserved source migration: 20260717120000_group_invitation_cancellation_authorization.sql
drop policy if exists "group_invitations_update_related"
on public.group_invitations;

create policy "group_invitations_update_related"
on public.group_invitations for update to authenticated
using (
  status = 'pending'
  and (
    invitee_id = auth.uid()
    or inviter_id = auth.uid()
    or public.can_manage_group(group_id, auth.uid())
  )
)
with check (
  (invitee_id = auth.uid() and status in ('accepted', 'declined'))
  or (inviter_id = auth.uid() and status = 'canceled')
  or (public.can_manage_group(group_id, auth.uid()) and status = 'canceled')
);

COMMIT;
