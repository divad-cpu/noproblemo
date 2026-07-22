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

select extensions.plan(17);

insert into auth.users (id, email)
values
  ('a0000000-0000-0000-0000-000000000001', 'admin-positive@fixtures.invalid'),
  ('a0000000-0000-0000-0000-000000000002', 'admin-ordinary@fixtures.invalid');

update public.profiles
set display_name = 'Positive administrator', role = 'admin'
where id = 'a0000000-0000-0000-0000-000000000001';

update public.profiles
set display_name = 'Ordinary user'
where id = 'a0000000-0000-0000-0000-000000000002';

insert into public.challenges (id, owner_id, title)
values (
  'a1000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000002',
  'PRIVATE_CHALLENGE_MARKER'
);

insert into public.challenge_sections (id, challenge_id, section_key, content)
values (
  'a2000000-0000-0000-0000-000000000002',
  'a1000000-0000-0000-0000-000000000002',
  'summary',
  'PRIVATE_CHALLENGE_CONTENT_MARKER'
);

insert into public.messages (id, sender_id, challenge_id, body)
values (
  'a3000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000002',
  'a1000000-0000-0000-0000-000000000002',
  'PRIVATE_MESSAGE_BODY_MARKER'
);

insert into public.admin_audit_log (
  id,
  actor_id,
  action,
  target_table,
  target_id,
  metadata
)
values (
  'a4000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'fixture.admin.read',
  'profiles',
  'a0000000-0000-0000-0000-000000000002',
  '{"fixture": true}'::jsonb
);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000002', true);

select extensions.is(
  test_support.capture_sqlstate('select * from public.admin_overview_counts()'),
  '42501',
  'ordinary users cannot invoke admin_overview_counts'
);
select extensions.is(
  test_support.capture_sqlstate('select * from public.admin_list_profiles(20)'),
  '42501',
  'ordinary users cannot invoke admin_list_profiles'
);
select extensions.is(
  test_support.capture_sqlstate('select * from public.admin_recent_activity(20)'),
  '42501',
  'ordinary users cannot invoke admin_recent_activity'
);
select extensions.is(
  test_support.capture_sqlstate('select * from public.admin_recent_audit_log(20)'),
  '42501',
  'ordinary users cannot invoke admin_recent_audit_log'
);
select extensions.is(
  (select count(*) from public.admin_audit_log),
  0::bigint,
  'ordinary users cannot read admin_audit_log'
);
select extensions.is(
  test_support.capture_sqlstate($command$
    update public.profiles
    set role = 'admin'
    where id = 'a0000000-0000-0000-0000-000000000002'
  $command$),
  '42501',
  'ordinary authenticated users cannot promote themselves directly'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', true);

select extensions.is(
  (select count(*) from public.admin_overview_counts()),
  5::bigint,
  'the configured administrator can invoke admin_overview_counts'
);
select extensions.is(
  (select count(*) from public.admin_list_profiles(20)),
  2::bigint,
  'the configured administrator can list fixture profiles'
);
select extensions.is(
  (select count(*) from public.admin_recent_activity(20)),
  1::bigint,
  'the configured administrator can read limited recent activity metadata'
);
select extensions.is(
  (select count(*) from public.admin_recent_audit_log(20)),
  1::bigint,
  'the configured administrator can read recent audit metadata'
);
select extensions.is(
  (select count(*) from public.admin_audit_log),
  1::bigint,
  'the configured administrator can read admin_audit_log through RLS'
);
select extensions.is(
  (
    select array_agg(key order by key)
    from jsonb_object_keys(
      (select to_jsonb(profile_row) from public.admin_list_profiles(1) profile_row)
    ) as key
  ),
  array['created_at', 'display_name', 'id', 'preferred_locale', 'role']::text[],
  'admin profile output is limited to the intended five fields'
);
select extensions.is(
  (
    select array_agg(key order by key)
    from jsonb_object_keys(
      (select to_jsonb(activity_row) from public.admin_recent_activity(1) activity_row)
    ) as key
  ),
  array['actor_display_name', 'actor_id', 'challenge_id', 'created_at', 'group_id', 'id', 'type']::text[],
  'admin activity output is limited to identifiers, type, actor display name, and timestamp'
);
select extensions.is(
  (
    select array_agg(key order by key)
    from jsonb_object_keys(
      (select to_jsonb(audit_row) from public.admin_recent_audit_log(1) audit_row)
    ) as key
  ),
  array['action', 'actor_id', 'created_at', 'id', 'metadata', 'target_id', 'target_table']::text[],
  'admin audit output is limited to intended audit metadata'
);
select extensions.ok(
  position('PRIVATE_MESSAGE_BODY_MARKER' in (
    select coalesce(jsonb_agg(to_jsonb(activity_row))::text, '')
    from public.admin_recent_activity(50) activity_row
  )) = 0
  and position('PRIVATE_CHALLENGE_CONTENT_MARKER' in (
    select coalesce(jsonb_agg(to_jsonb(activity_row))::text, '')
    from public.admin_recent_activity(50) activity_row
  )) = 0,
  'admin RPC output omits private message bodies and challenge content'
);

reset role;
select set_config('request.jwt.claim.sub', '', true);
update public.profiles
set role = 'user'
where id = 'a0000000-0000-0000-0000-000000000001';

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', true);

select extensions.is(
  test_support.capture_sqlstate('select * from public.admin_overview_counts()'),
  '42501',
  'removing the administrator role immediately removes RPC access'
);
select extensions.is(
  (select count(*) from public.admin_audit_log),
  0::bigint,
  'removing the administrator role immediately removes audit-log access'
);

select * from extensions.finish();
rollback;
