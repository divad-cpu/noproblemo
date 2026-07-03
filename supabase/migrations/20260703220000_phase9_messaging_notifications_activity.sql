-- Phase 9: protected messages, private notifications, and activity events.

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references auth.users(id) on delete set null,
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
  user_id uuid not null references auth.users(id) on delete cascade,
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
  actor_id uuid references auth.users(id) on delete set null,
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
