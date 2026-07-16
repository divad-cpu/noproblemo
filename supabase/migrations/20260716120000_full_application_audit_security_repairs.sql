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
revoke truncate, references, trigger on all tables in schema public from anon, authenticated;

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

alter function public.pending_group_invitations() owner to postgres;
revoke execute on function public.pending_group_invitations()
from public, anon, authenticated;
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
) from public, anon, authenticated;

-- Remove PostgreSQL's default PUBLIC function execution and expose only intentional RPCs.
revoke execute on all functions in schema public from public, anon;

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
grant execute on function public.noproblemo_health_check() to anon;
