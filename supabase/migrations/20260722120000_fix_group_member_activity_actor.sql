-- Attribute membership removals to the authenticated initiator when one survives.
-- Auth Admin account deletion has no application actor, so its cascade is system-attributed.

create or replace function public.create_group_member_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  activity_actor_id uuid;
begin
  if tg_op = 'INSERT' then
    insert into public.activity_events (actor_id, group_id, type, summary)
    values (new.user_id, new.group_id, 'group_member_joined', 'Group member joined.');
    return new;
  end if;

  select candidate.id
  into activity_actor_id
  from auth.users as candidate
  where candidate.id = auth.uid();

  insert into public.activity_events (actor_id, group_id, type, summary)
  values (
    activity_actor_id,
    old.group_id,
    'group_member_removed',
    'Group member removed.'
  );

  return old;
end;
$$;
