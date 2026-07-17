begin;

create extension if not exists pgtap with schema extensions;
create schema if not exists test_support;

create or replace function test_support.capture_sqlstate(command text)
returns text
language plpgsql
as $$
begin
  execute command;
  return null;
exception
  when others then
    return sqlstate;
end;
$$;

create or replace function test_support.affected_rows(command text)
returns bigint
language plpgsql
as $$
declare
  affected bigint;
begin
  execute command;
  get diagnostics affected = row_count;
  return affected;
end;
$$;

grant usage on schema test_support to authenticated;
grant execute on function test_support.capture_sqlstate(text) to authenticated;
grant execute on function test_support.affected_rows(text) to authenticated;

select extensions.plan(50);

select extensions.ok(
  not has_table_privilege('authenticated', 'public.challenges', 'truncate'),
  'authenticated cannot truncate application tables'
);
select extensions.ok(
  not has_table_privilege('anon', 'public.challenges', 'trigger'),
  'anon cannot create triggers on application tables'
);
select extensions.ok(
  not has_column_privilege('authenticated', 'public.challenges', 'owner_id', 'update'),
  'challenge ownership is not client-mutable'
);
select extensions.ok(
  has_column_privilege('authenticated', 'public.challenges', 'title', 'update'),
  'challenge content remains client-mutable'
);
select extensions.ok(
  not has_function_privilege(
    'authenticated',
    'public.notify_user(uuid,text,text,text,uuid,uuid,uuid)',
    'execute'
  ),
  'authenticated cannot execute notify_user'
);
select extensions.ok(
  has_function_privilege('anon', 'public.noproblemo_health_check()', 'execute'),
  'anon retains only the intended health-check RPC'
);
select extensions.ok(
  not has_function_privilege('anon', 'public.search_profiles(text)', 'execute'),
  'anon cannot execute authenticated profile search'
);
select extensions.ok(
  has_function_privilege(
    'authenticated',
    'public.pending_group_invitations()',
    'execute'
  ),
  'authenticated users can execute the minimal pending invitation RPC'
);
select extensions.ok(
  not has_function_privilege(
    'anon',
    'public.pending_group_invitations()',
    'execute'
  ),
  'anonymous users cannot execute the pending invitation RPC'
);

insert into auth.users (id, email)
values
  ('00000000-0000-0000-0000-00000000000a', 'CODEX-QA-a@local.invalid'),
  ('00000000-0000-0000-0000-00000000000b', 'CODEX-QA-b@local.invalid'),
  ('00000000-0000-0000-0000-00000000000c', 'CODEX-QA-c@local.invalid');

insert into public.challenges (id, owner_id, title)
values
  (
    '10000000-0000-0000-0000-00000000000a',
    '00000000-0000-0000-0000-00000000000a',
    'CODEX-QA-private-a'
  ),
  (
    '10000000-0000-0000-0000-00000000000b',
    '00000000-0000-0000-0000-00000000000b',
    'CODEX-QA-private-b'
  ),
  (
    '10000000-0000-0000-0000-00000000000c',
    '00000000-0000-0000-0000-00000000000a',
    'CODEX-QA-linked-a'
  ),
  (
    '10000000-0000-0000-0000-00000000000d',
    '00000000-0000-0000-0000-00000000000a',
    'CODEX-QA-viewer-a'
  );

insert into public.groups (id, owner_id, name)
values
  (
    '20000000-0000-0000-0000-00000000000a',
    '00000000-0000-0000-0000-00000000000a',
    'CODEX-QA-editors'
  ),
  (
    '20000000-0000-0000-0000-00000000000b',
    '00000000-0000-0000-0000-00000000000a',
    'CODEX-QA-viewers'
  );

insert into public.group_members (group_id, user_id, role)
values
  (
    '20000000-0000-0000-0000-00000000000a',
    '00000000-0000-0000-0000-00000000000b',
    'member'
  ),
  (
    '20000000-0000-0000-0000-00000000000b',
    '00000000-0000-0000-0000-00000000000c',
    'viewer'
  );

insert into public.group_challenges (group_id, challenge_id, created_by)
values
  (
    '20000000-0000-0000-0000-00000000000a',
    '10000000-0000-0000-0000-00000000000c',
    '00000000-0000-0000-0000-00000000000a'
  ),
  (
    '20000000-0000-0000-0000-00000000000b',
    '10000000-0000-0000-0000-00000000000d',
    '00000000-0000-0000-0000-00000000000a'
  );

insert into public.challenge_sections (challenge_id, section_key, content)
values (
  '10000000-0000-0000-0000-00000000000a',
  'summary',
  'CODEX-QA-first'
);

select extensions.is(
  test_support.capture_sqlstate($command$
    insert into public.challenge_sections (challenge_id, section_key, content)
    values (
      '10000000-0000-0000-0000-00000000000a',
      'summary',
      'CODEX-QA-duplicate'
    )
  $command$),
  '23505',
  'challenge section keys are unique per challenge'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-00000000000a',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

select extensions.is(
  test_support.capture_sqlstate($command$
    insert into public.groups (id, owner_id, name)
    values (
      '20000000-0000-0000-0000-00000000000d',
      '00000000-0000-0000-0000-00000000000a',
      'CODEX-QA-authenticated-create-returning'
    )
    returning id
  $command$),
  '42501',
  'group creation cannot request a returned row before owner membership exists'
);
select extensions.is(
  (
    select count(*)
    from public.groups
    where id = '20000000-0000-0000-0000-00000000000d'
  ),
  0::bigint,
  'a failed group insert with returning leaves no partial group data'
);

select extensions.is(
  test_support.capture_sqlstate($command$
    insert into public.groups (id, owner_id, name)
    values (
      '20000000-0000-0000-0000-00000000000c',
      '00000000-0000-0000-0000-00000000000a',
      'CODEX-QA-authenticated-create'
    )
  $command$),
  null,
  'an authenticated user can create a group they own'
);
select extensions.is(
  (
    select count(*)
    from public.group_members
    where group_id = '20000000-0000-0000-0000-00000000000c'
      and user_id = '00000000-0000-0000-0000-00000000000a'
      and role = 'owner'
  ),
  1::bigint,
  'group creation automatically creates the owner membership'
);
select extensions.is(
  (
    select count(*)
    from public.groups
    where id = '20000000-0000-0000-0000-00000000000c'
      and owner_id = '00000000-0000-0000-0000-00000000000a'
  ),
  1::bigint,
  'the owner can verify the group in a separate statement after trigger completion'
);
select extensions.is(
  (
    select count(*)
    from public.activity_events
    where group_id = '20000000-0000-0000-0000-00000000000c'
      and type in ('group_created', 'group_member_joined')
  ),
  2::bigint,
  'group creation commits both expected activity side effects'
);

select extensions.is(
  test_support.capture_sqlstate($command$
    insert into public.friendships (user_one_id, user_two_id)
    values (
      '00000000-0000-0000-0000-00000000000a',
      '00000000-0000-0000-0000-00000000000b'
    )
  $command$),
  '42501',
  'friendships cannot be inserted directly'
);
select extensions.is(
  test_support.capture_sqlstate($command$
    insert into public.group_members (group_id, user_id, role)
    values (
      '20000000-0000-0000-0000-00000000000a',
      '00000000-0000-0000-0000-00000000000c',
      'owner'
    )
  $command$),
  '42501',
  'group memberships cannot be inserted directly'
);
select extensions.is(
  test_support.capture_sqlstate($command$
    update public.challenges
    set owner_id = '00000000-0000-0000-0000-00000000000b'
    where id = '10000000-0000-0000-0000-00000000000a'
  $command$),
  '42501',
  'challenge owners cannot transfer ownership through the client role'
);
select extensions.is(
  test_support.capture_sqlstate($command$
    insert into public.group_challenges (group_id, challenge_id, created_by)
    values (
      '20000000-0000-0000-0000-00000000000a',
      '10000000-0000-0000-0000-00000000000b',
      '00000000-0000-0000-0000-00000000000a'
    )
  $command$),
  '42501',
  'a group manager cannot link another user private challenge'
);
select extensions.is(
  test_support.capture_sqlstate($command$
    delete from public.group_members
    where group_id = '20000000-0000-0000-0000-00000000000b'
      and user_id = '00000000-0000-0000-0000-00000000000a'
  $command$),
  'P0001',
  'the last group owner cannot be removed'
);
select extensions.is(
  test_support.capture_sqlstate($command$
    update public.group_members
    set role = 'member'
    where group_id = '20000000-0000-0000-0000-00000000000b'
      and user_id = '00000000-0000-0000-0000-00000000000a'
  $command$),
  'P0001',
  'the last group owner cannot be demoted'
);
select extensions.is(
  test_support.capture_sqlstate($command$
    select public.notify_user(
      '00000000-0000-0000-0000-00000000000a',
      'friend_request',
      'CODEX-QA-forged'
    )
  $command$),
  '42501',
  'notification helper RPC execution is denied'
);

insert into public.friend_requests (sender_id, receiver_id)
values (
  '00000000-0000-0000-0000-00000000000a',
  '00000000-0000-0000-0000-00000000000b'
);

insert into public.messages (sender_id, group_id, body)
values (
  '00000000-0000-0000-0000-00000000000a',
  '20000000-0000-0000-0000-00000000000a',
  'CODEX-QA-message-a'
);

select extensions.is(
  (select count(*) from public.notifications),
  0::bigint,
  'a sender cannot read the recipient notification'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-00000000000b',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

select extensions.is(
  (select count(*) from public.challenges where id = '10000000-0000-0000-0000-00000000000a'),
  0::bigint,
  'another user cannot read an unrelated private challenge'
);
select extensions.is(
  (select count(*) from public.challenges where id = '10000000-0000-0000-0000-00000000000c'),
  1::bigint,
  'a group editor can read an explicitly linked challenge'
);
select extensions.is(
  test_support.capture_sqlstate($command$
    update public.challenges
    set title = 'CODEX-QA-editor-update'
    where id = '10000000-0000-0000-0000-00000000000c'
  $command$),
  null,
  'a group editor can edit allowed challenge fields'
);
select extensions.is(
  (select count(*) from public.notifications),
  2::bigint,
  'the recipient sees only their generated notifications'
);
select extensions.is(
  (select count(*) from public.messages where body = 'CODEX-QA-message-a'),
  1::bigint,
  'a group member can read group messages'
);
select extensions.is(
  test_support.capture_sqlstate($command$
    insert into public.messages (sender_id, group_id, body)
    values (
      '00000000-0000-0000-0000-00000000000b',
      '20000000-0000-0000-0000-00000000000a',
      '   '
    )
  $command$),
  '23514',
  'empty messages are rejected'
);
select extensions.is(
  test_support.capture_sqlstate($command$
    insert into public.activity_events (actor_id, group_id, type, summary)
    values (
      '00000000-0000-0000-0000-00000000000b',
      '20000000-0000-0000-0000-00000000000a',
      'group_updated',
      'CODEX-QA-authorized-activity'
    )
  $command$),
  null,
  'authorized members retain the current activity insert boundary'
);
select extensions.is(
  test_support.affected_rows($command$
    update public.group_members
    set role = 'owner'
    where group_id = '20000000-0000-0000-0000-00000000000a'
      and user_id = '00000000-0000-0000-0000-00000000000b'
  $command$),
  0::bigint,
  'a member cannot promote themselves to owner'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-00000000000c',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

select extensions.is(
  (select count(*) from public.messages where body = 'CODEX-QA-message-a'),
  0::bigint,
  'an unrelated user cannot read another group conversation'
);
select extensions.is(
  (select count(*) from public.notifications),
  0::bigint,
  'an unrelated user cannot read notifications for other users'
);
select extensions.is(
  test_support.capture_sqlstate($command$
    insert into public.activity_events (actor_id, group_id, type, summary)
    values (
      '00000000-0000-0000-0000-00000000000c',
      '20000000-0000-0000-0000-00000000000a',
      'group_updated',
      'CODEX-QA-forged-activity'
    )
  $command$),
  '42501',
  'a non-member cannot insert group activity'
);
select extensions.is(
  (select count(*) from public.challenges where id = '10000000-0000-0000-0000-00000000000d'),
  1::bigint,
  'a viewer can read an explicitly linked challenge'
);
select extensions.is(
  test_support.affected_rows($command$
    update public.challenges
    set title = 'CODEX-QA-viewer-update'
    where id = '10000000-0000-0000-0000-00000000000d'
  $command$),
  0::bigint,
  'a viewer cannot edit a linked challenge'
);

reset role;
insert into public.group_invitations (
  id,
  group_id,
  inviter_id,
  invitee_id,
  role,
  status
)
values
  (
    '30000000-0000-0000-0000-00000000000a',
    '20000000-0000-0000-0000-00000000000a',
    '00000000-0000-0000-0000-00000000000a',
    '00000000-0000-0000-0000-00000000000c',
    'member',
    'pending'
  ),
  (
    '30000000-0000-0000-0000-00000000000b',
    '20000000-0000-0000-0000-00000000000a',
    '00000000-0000-0000-0000-00000000000a',
    '00000000-0000-0000-0000-00000000000c',
    'viewer',
    'accepted'
  ),
  (
    '30000000-0000-0000-0000-00000000000c',
    '20000000-0000-0000-0000-00000000000a',
    '00000000-0000-0000-0000-00000000000a',
    '00000000-0000-0000-0000-00000000000c',
    'viewer',
    'declined'
  ),
  (
    '30000000-0000-0000-0000-00000000000d',
    '20000000-0000-0000-0000-00000000000a',
    '00000000-0000-0000-0000-00000000000a',
    '00000000-0000-0000-0000-00000000000c',
    'viewer',
    'canceled'
  ),
  (
    '30000000-0000-0000-0000-00000000000e',
    '20000000-0000-0000-0000-00000000000b',
    '00000000-0000-0000-0000-00000000000a',
    '00000000-0000-0000-0000-00000000000b',
    'member',
    'pending'
  );

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-00000000000c',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

select extensions.is(
  (
    select count(*)
    from public.groups
    where id = '20000000-0000-0000-0000-00000000000a'
  ),
  0::bigint,
  'a pending invitee cannot select the base group row'
);
select extensions.is(
  (select count(*) from public.pending_group_invitations()),
  1::bigint,
  'a pending invitee can call the minimal RPC'
);
select extensions.is(
  (
    select group_name
    from public.pending_group_invitations()
    where invitation_id = '30000000-0000-0000-0000-00000000000a'
  ),
  'CODEX-QA-editors',
  'the RPC returns the invited group name'
);
select extensions.is(
  (
    select to_jsonb(invitation)
    from public.pending_group_invitations() invitation
    where invitation_id = '30000000-0000-0000-0000-00000000000a'
  ),
  jsonb_build_object(
    'invitation_id', '30000000-0000-0000-0000-00000000000a'::uuid,
    'group_id', '20000000-0000-0000-0000-00000000000a'::uuid,
    'group_name', 'CODEX-QA-editors',
    'invited_role', 'member'
  ),
  'the RPC returns no group owner, description, timestamps, or unrelated fields'
);
select extensions.is(
  (
    select array_agg(invitation_id order by invitation_id)
    from public.pending_group_invitations()
  ),
  array['30000000-0000-0000-0000-00000000000a'::uuid],
  'the RPC excludes accepted, declined, canceled, and unrelated invitations'
);

select extensions.is(
  test_support.capture_sqlstate($command$
    update public.group_invitations
    set role = 'admin', status = 'accepted'
    where id = '30000000-0000-0000-0000-00000000000a'
  $command$),
  '42501',
  'invitees cannot change invitation role fields'
);
select extensions.is(
  test_support.capture_sqlstate($command$
    update public.group_invitations
    set status = 'accepted', responded_at = now()
    where id = '30000000-0000-0000-0000-00000000000a'
  $command$),
  null,
  'invitees can accept an immutable invitation'
);
select extensions.is(
  (select role from public.group_members where group_id = '20000000-0000-0000-0000-00000000000a' and user_id = '00000000-0000-0000-0000-00000000000c'),
  'member',
  'accepted membership uses the trusted invitation role'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-00000000000a',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

select extensions.is(
  (select count(*) from public.pending_group_invitations()),
  0::bigint,
  'an unrelated authenticated user cannot retrieve another user pending invitation'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-00000000000b',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

select extensions.is(
  (
    select count(*)
    from public.groups
    where id = '20000000-0000-0000-0000-00000000000a'
  ),
  1::bigint,
  'an existing group member retains normal base group access'
);
select extensions.is(
  (
    select invitation_id
    from public.pending_group_invitations()
  ),
  '30000000-0000-0000-0000-00000000000e'::uuid,
  'an invitee receives only their own pending invitation'
);
select extensions.is(
  test_support.capture_sqlstate($command$
    update public.group_invitations
    set status = 'declined', responded_at = now()
    where id = '30000000-0000-0000-0000-00000000000e'
  $command$),
  null,
  'an invitee can decline an immutable invitation'
);
select extensions.is(
  (
    select count(*)
    from public.group_members
    where group_id = '20000000-0000-0000-0000-00000000000b'
      and user_id = '00000000-0000-0000-0000-00000000000b'
  ),
  0::bigint,
  'declining an invitation does not create membership'
);

select * from extensions.finish();
rollback;
