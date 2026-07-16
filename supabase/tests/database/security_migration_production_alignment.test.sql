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

grant usage on schema test_support to anon, authenticated;
grant execute on function test_support.capture_sqlstate(text) to anon, authenticated;

select extensions.plan(29);

select extensions.ok(
  not has_column_privilege('authenticated', 'public.challenges', 'id', 'update')
    and not has_column_privilege('authenticated', 'public.challenges', 'owner_id', 'update'),
  'challenge identity and ownership columns are not client-mutable'
);
select extensions.ok(
  not has_column_privilege('authenticated', 'public.groups', 'id', 'update')
    and not has_column_privilege('authenticated', 'public.groups', 'owner_id', 'update'),
  'group identity and ownership columns are not client-mutable'
);
select extensions.ok(
  not has_column_privilege('authenticated', 'public.friend_requests', 'id', 'update')
    and not has_column_privilege('authenticated', 'public.friend_requests', 'sender_id', 'update')
    and not has_column_privilege('authenticated', 'public.friend_requests', 'receiver_id', 'update'),
  'friend request identity columns are not client-mutable'
);
select extensions.ok(
  not has_column_privilege('authenticated', 'public.group_invitations', 'id', 'update')
    and not has_column_privilege('authenticated', 'public.group_invitations', 'group_id', 'update')
    and not has_column_privilege('authenticated', 'public.group_invitations', 'inviter_id', 'update')
    and not has_column_privilege('authenticated', 'public.group_invitations', 'invitee_id', 'update')
    and not has_column_privilege('authenticated', 'public.group_invitations', 'role', 'update'),
  'group invitation identity and invited role columns are not client-mutable'
);
select extensions.ok(
  not has_column_privilege('authenticated', 'public.group_members', 'id', 'update')
    and not has_column_privilege('authenticated', 'public.group_members', 'group_id', 'update')
    and not has_column_privilege('authenticated', 'public.group_members', 'user_id', 'update'),
  'group membership identity columns are not client-mutable'
);
select extensions.ok(
  not has_column_privilege('authenticated', 'public.challenge_sections', 'id', 'update')
    and not has_column_privilege('authenticated', 'public.challenge_sections', 'challenge_id', 'update')
    and not has_column_privilege('authenticated', 'public.challenge_sections', 'section_key', 'update'),
  'challenge section identity columns are not client-mutable'
);
select extensions.ok(
  not has_column_privilege('authenticated', 'public.challenge_solutions', 'id', 'update')
    and not has_column_privilege('authenticated', 'public.challenge_solutions', 'challenge_id', 'update')
    and not has_column_privilege('authenticated', 'public.challenge_tasks', 'id', 'update')
    and not has_column_privilege('authenticated', 'public.challenge_tasks', 'challenge_id', 'update'),
  'challenge solution and task identity columns are not client-mutable'
);
select extensions.ok(
  not exists (
    select 1
    from pg_tables table_record
    cross join (values ('anon'), ('authenticated')) as browser_role(role_name)
    where table_record.schemaname = 'public'
      and (
        has_table_privilege(
          browser_role.role_name,
          format('%I.%I', table_record.schemaname, table_record.tablename),
          'truncate'
        )
        or has_table_privilege(
          browser_role.role_name,
          format('%I.%I', table_record.schemaname, table_record.tablename),
          'references'
        )
        or has_table_privilege(
          browser_role.role_name,
          format('%I.%I', table_record.schemaname, table_record.tablename),
          'trigger'
        )
      )
  ),
  'browser roles have no truncate, references, or trigger table privileges'
);
select extensions.ok(
  has_function_privilege(
    'authenticated',
    'public.pending_group_invitations()',
    'execute'
  )
    and not has_function_privilege(
      'anon',
      'public.pending_group_invitations()',
      'execute'
    )
    and not has_function_privilege(
      'service_role',
      'public.pending_group_invitations()',
      'execute'
    ),
  'only the authenticated browser role can execute the pending invitation RPC'
);
select extensions.ok(
  not has_function_privilege(
    'anon',
    'public.pending_group_invitations()',
    'execute'
  ),
  'anonymous execution of the pending invitation RPC is denied'
);
select extensions.ok(
  not has_function_privilege(
    'authenticated',
    'public.notify_user(uuid,text,text,text,uuid,uuid,uuid)',
    'execute'
  ),
  'authenticated browser execution of notify_user is denied'
);
select extensions.ok(
  (
    select procedure_record.prosecdef
    from pg_proc procedure_record
    where procedure_record.oid = 'public.pending_group_invitations()'::regprocedure
  ),
  'the pending invitation RPC is security definer'
);
select extensions.is(
  (
    select pg_get_userbyid(procedure_record.proowner)
    from pg_proc procedure_record
    where procedure_record.oid = 'public.pending_group_invitations()'::regprocedure
  ),
  'postgres',
  'the pending invitation RPC is owned by postgres'
);
select extensions.is(
  (
    select procedure_record.proconfig
    from pg_proc procedure_record
    where procedure_record.oid = 'public.pending_group_invitations()'::regprocedure
  ),
  array['search_path=""']::text[],
  'the pending invitation RPC has a fixed empty search path'
);
select extensions.is(
  (
    select procedure_record.pronargs
    from pg_proc procedure_record
    where procedure_record.oid = 'public.pending_group_invitations()'::regprocedure
  ),
  0::smallint,
  'the pending invitation RPC is argument-free'
);

insert into auth.users (id, email)
values
  ('00000000-0000-0000-0000-00000000000a', 'migration-alignment-a@local.invalid'),
  ('00000000-0000-0000-0000-00000000000b', 'migration-alignment-b@local.invalid'),
  ('00000000-0000-0000-0000-00000000000c', 'migration-alignment-c@local.invalid');

insert into public.challenges (id, owner_id, title)
values
  (
    '10000000-0000-0000-0000-00000000000a',
    '00000000-0000-0000-0000-00000000000a',
    'Migration alignment owner challenge'
  ),
  (
    '10000000-0000-0000-0000-00000000000b',
    '00000000-0000-0000-0000-00000000000b',
    'Migration alignment unrelated challenge'
  );

insert into public.groups (id, owner_id, name)
values (
  '20000000-0000-0000-0000-00000000000a',
  '00000000-0000-0000-0000-00000000000a',
  'Migration alignment group'
);

insert into public.group_invitations (
  id,
  group_id,
  inviter_id,
  invitee_id,
  role,
  status
)
values (
  '30000000-0000-0000-0000-00000000000a',
  '20000000-0000-0000-0000-00000000000a',
  '00000000-0000-0000-0000-00000000000a',
  '00000000-0000-0000-0000-00000000000c',
  'member',
  'pending'
);

insert into public.challenge_sections (challenge_id, section_key, content)
values (
  '10000000-0000-0000-0000-00000000000a',
  'summary',
  'Migration alignment first section'
);

select extensions.is(
  test_support.capture_sqlstate($command$
    insert into public.challenge_sections (challenge_id, section_key, content)
    values (
      '10000000-0000-0000-0000-00000000000a',
      'summary',
      'Migration alignment duplicate section'
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
    insert into public.friendships (user_one_id, user_two_id)
    values (
      '00000000-0000-0000-0000-00000000000a',
      '00000000-0000-0000-0000-00000000000b'
    )
  $command$),
  '42501',
  'direct friendship insertion is denied'
);
select extensions.is(
  test_support.capture_sqlstate($command$
    insert into public.group_members (group_id, user_id, role)
    values (
      '20000000-0000-0000-0000-00000000000a',
      '00000000-0000-0000-0000-00000000000b',
      'member'
    )
  $command$),
  '42501',
  'direct group membership insertion is denied'
);
select extensions.is(
  test_support.capture_sqlstate($command$
    update public.challenges
    set owner_id = '00000000-0000-0000-0000-00000000000b'
    where id = '10000000-0000-0000-0000-00000000000a'
  $command$),
  '42501',
  'challenge ownership cannot be changed through the browser role'
);
select extensions.is(
  test_support.capture_sqlstate($command$
    update public.group_invitations
    set role = 'admin', status = 'accepted'
    where id = '30000000-0000-0000-0000-00000000000a'
  $command$),
  '42501',
  'invitation role identity cannot be changed through the browser role'
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
  'a group manager cannot link another user challenge'
);
select extensions.is(
  test_support.capture_sqlstate($command$
    delete from public.group_members
    where group_id = '20000000-0000-0000-0000-00000000000a'
      and user_id = '00000000-0000-0000-0000-00000000000a'
  $command$),
  'P0001',
  'the last group owner cannot be removed'
);
select extensions.is(
  test_support.capture_sqlstate($command$
    update public.group_members
    set role = 'member'
    where group_id = '20000000-0000-0000-0000-00000000000a'
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
      'Migration alignment forged notification'
    )
  $command$),
  '42501',
  'notify_user browser execution is denied at runtime'
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
  (
    select count(*)
    from public.groups
    where id = '20000000-0000-0000-0000-00000000000a'
  ),
  0::bigint,
  'a pending invitee cannot read the base groups row'
);
select extensions.is(
  (select count(*) from public.pending_group_invitations()),
  1::bigint,
  'an authenticated caller can read their own pending invitation through the RPC'
);
select extensions.is(
  (
    select to_jsonb(invitation_record)
    from public.pending_group_invitations() invitation_record
    where invitation_id = '30000000-0000-0000-0000-00000000000a'
  ),
  jsonb_build_object(
    'invitation_id', '30000000-0000-0000-0000-00000000000a'::uuid,
    'group_id', '20000000-0000-0000-0000-00000000000a'::uuid,
    'group_name', 'Migration alignment group',
    'invited_role', 'member'
  ),
  'the pending invitation RPC returns exactly four minimal fields'
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
  'an unrelated authenticated caller receives no pending invitation rows'
);

reset role;
set local role anon;
select set_config('request.jwt.claim.role', 'anon', true);

select extensions.is(
  test_support.capture_sqlstate(
    'select * from public.pending_group_invitations()'
  ),
  '42501',
  'anonymous pending invitation RPC execution is denied at runtime'
);

select * from extensions.finish();
rollback;
