-- Phase 8: friends, groups, invitations, and group challenge access.

create table public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
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
  user_one_id uuid not null references auth.users(id) on delete cascade,
  user_two_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint friendships_not_self check (user_one_id <> user_two_id),
  constraint friendships_canonical_order check (user_one_id < user_two_id)
);

create unique index friendships_pair_unique
on public.friendships (user_one_id, user_two_id);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
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
  inviter_id uuid not null references auth.users(id) on delete cascade,
  invitee_id uuid not null references auth.users(id) on delete cascade,
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
  created_by uuid references auth.users(id) on delete set null,
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
