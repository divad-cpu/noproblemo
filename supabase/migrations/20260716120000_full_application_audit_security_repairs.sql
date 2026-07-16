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

-- Friendship and membership creation must occur through trusted acceptance/owner triggers.
revoke insert on table public.friendships from authenticated;
revoke insert on table public.group_members from authenticated;

drop policy if exists "friendships_insert_involved" on public.friendships;
drop policy if exists "group_members_insert_invited_or_manager" on public.group_members;

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

-- Pending invitees may see the invited group's basic row on the invitation list.
create policy "groups_select_pending_invitee"
on public.groups for select to authenticated
using (
  exists (
    select 1
    from public.group_invitations gi
    where gi.group_id = groups.id
      and gi.invitee_id = auth.uid()
      and gi.status = 'pending'
  )
);

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
