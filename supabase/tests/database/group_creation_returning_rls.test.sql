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

grant usage on schema test_support to authenticated;
grant execute on function test_support.capture_sqlstate(text) to authenticated;

select extensions.plan(6);

insert into auth.users (id, email)
values (
  '00000000-0000-0000-0000-00000000000d',
  'CODEX-QA-group-hotfix@local.invalid'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-00000000000d',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

select extensions.is(
  test_support.capture_sqlstate($command$
    insert into public.groups (id, owner_id, name)
    values (
      '20000000-0000-0000-0000-00000000000d',
      '00000000-0000-0000-0000-00000000000d',
      'CODEX-QA-group-returning'
    )
    returning id
  $command$),
  '42501',
  'returned-row RLS rejects group creation before owner membership is visible'
);
select extensions.is(
  (
    select count(*)
    from public.groups
    where id = '20000000-0000-0000-0000-00000000000d'
  ),
  0::bigint,
  'the rejected statement leaves no partial group row'
);

select extensions.is(
  test_support.capture_sqlstate($command$
    insert into public.groups (id, owner_id, name)
    values (
      '20000000-0000-0000-0000-00000000000e',
      '00000000-0000-0000-0000-00000000000d',
      'CODEX-QA-group-minimal-insert'
    )
  $command$),
  null,
  'a minimal authenticated group insert succeeds'
);
select extensions.is(
  (
    select count(*)
    from public.group_members
    where group_id = '20000000-0000-0000-0000-00000000000e'
      and user_id = '00000000-0000-0000-0000-00000000000d'
      and role = 'owner'
  ),
  1::bigint,
  'the trusted trigger creates exactly one owner membership'
);
select extensions.is(
  (
    select count(*)
    from public.groups
    where id = '20000000-0000-0000-0000-00000000000e'
      and owner_id = '00000000-0000-0000-0000-00000000000d'
  ),
  1::bigint,
  'a separate ID-and-owner query verifies the created group'
);
select extensions.is(
  (
    select count(*)
    from public.activity_events
    where group_id = '20000000-0000-0000-0000-00000000000e'
      and type in ('group_created', 'group_member_joined')
  ),
  2::bigint,
  'group and owner-membership activity side effects commit'
);

select * from extensions.finish();
rollback;
