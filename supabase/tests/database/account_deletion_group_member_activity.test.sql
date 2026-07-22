begin;

create extension if not exists pgtap with schema extensions;
create schema if not exists test_support;

create or replace function test_support.delete_auth_user(target_user_id uuid)
returns text
language plpgsql
security definer
set search_path = auth, public, pg_temp
as $$
begin
  delete from auth.users where id = target_user_id;
  return null;
exception
  when others then
    return sqlstate;
end;
$$;

create or replace function test_support.try_remove_group_member(target_membership_id uuid)
returns boolean
language plpgsql
as $$
declare
  affected_rows integer;
begin
  delete from public.group_members where id = target_membership_id;
  get diagnostics affected_rows = row_count;
  return affected_rows = 1;
exception
  when others then
    return false;
end;
$$;

grant usage on schema test_support to authenticated;
grant execute on function test_support.try_remove_group_member(uuid) to authenticated;

select extensions.plan(27);

insert into auth.users (id, email)
values
  ('e0000000-0000-0000-0000-000000000001', 'activity-owner@fixtures.invalid'),
  ('e0000000-0000-0000-0000-000000000002', 'activity-admin@fixtures.invalid'),
  ('e0000000-0000-0000-0000-000000000003', 'activity-member@fixtures.invalid'),
  ('e0000000-0000-0000-0000-000000000004', 'activity-viewer@fixtures.invalid'),
  ('e0000000-0000-0000-0000-000000000005', 'activity-unrelated@fixtures.invalid'),
  ('e0000000-0000-0000-0000-000000000006', 'cascade-member@fixtures.invalid'),
  ('e0000000-0000-0000-0000-000000000007', 'cascade-admin@fixtures.invalid'),
  ('e0000000-0000-0000-0000-000000000008', 'manual-member@fixtures.invalid'),
  ('e0000000-0000-0000-0000-000000000009', 'manual-viewer@fixtures.invalid'),
  ('e0000000-0000-0000-0000-00000000000a', 'co-owner-creator@fixtures.invalid'),
  ('e0000000-0000-0000-0000-00000000000b', 'last-owner@fixtures.invalid'),
  ('e0000000-0000-0000-0000-00000000000c', 'self-removing-member@fixtures.invalid');

insert into public.groups (id, owner_id, name)
values
  ('e1000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Cascade member group'),
  ('e1000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'Cascade admin group'),
  ('e1000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001', 'Owner manual removal group'),
  ('e1000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000001', 'Admin manual removal group'),
  ('e1000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-00000000000a', 'Co-owned deletion group'),
  ('e1000000-0000-0000-0000-000000000006', 'e0000000-0000-0000-0000-00000000000b', 'Last-owner deletion group'),
  ('e1000000-0000-0000-0000-000000000007', 'e0000000-0000-0000-0000-000000000001', 'Authorization group'),
  ('e1000000-0000-0000-0000-000000000008', 'e0000000-0000-0000-0000-000000000001', 'Self-removal group');

insert into public.group_members (id, group_id, user_id, role)
values
  ('e2000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000006', 'member'),
  ('e2000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000007', 'admin'),
  ('e2000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000008', 'member'),
  ('e2000000-0000-0000-0000-000000000004', 'e1000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000002', 'admin'),
  ('e2000000-0000-0000-0000-000000000005', 'e1000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000009', 'viewer'),
  ('e2000000-0000-0000-0000-000000000006', 'e1000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000001', 'owner'),
  ('e2000000-0000-0000-0000-000000000007', 'e1000000-0000-0000-0000-000000000007', 'e0000000-0000-0000-0000-000000000002', 'admin'),
  ('e2000000-0000-0000-0000-000000000008', 'e1000000-0000-0000-0000-000000000007', 'e0000000-0000-0000-0000-000000000003', 'member'),
  ('e2000000-0000-0000-0000-000000000009', 'e1000000-0000-0000-0000-000000000007', 'e0000000-0000-0000-0000-000000000004', 'viewer'),
  ('e2000000-0000-0000-0000-00000000000a', 'e1000000-0000-0000-0000-000000000008', 'e0000000-0000-0000-0000-00000000000c', 'member'),
  ('e2000000-0000-0000-0000-00000000000b', 'e1000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000003', 'member');

-- Auth Admin deletion normally supplies no end-user JWT actor.
select set_config('request.jwt.claim.sub', '', true);
select extensions.is(
  test_support.delete_auth_user('e0000000-0000-0000-0000-000000000006'),
  null,
  'ordinary group member account deletion succeeds'
);
select extensions.is((select count(*) from auth.users where id = 'e0000000-0000-0000-0000-000000000006'), 0::bigint, 'ordinary member Auth user is removed');
select extensions.is((select count(*) from public.profiles where id = 'e0000000-0000-0000-0000-000000000006'), 0::bigint, 'ordinary member profile is removed');
select extensions.is((select count(*) from public.group_members where id = 'e2000000-0000-0000-0000-000000000001'), 0::bigint, 'ordinary member membership is removed');
select extensions.is((select count(*) from public.groups where id = 'e1000000-0000-0000-0000-000000000001'), 1::bigint, 'ordinary member group remains');
select extensions.is((select actor_id from public.activity_events where group_id = 'e1000000-0000-0000-0000-000000000001' and type = 'group_member_removed' order by created_at desc limit 1), null::uuid, 'system-driven ordinary member removal has a null actor');

-- Even a stale claim for the deleting user cannot create a dangling actor reference.
select set_config('request.jwt.claim.sub', 'e0000000-0000-0000-0000-000000000007', true);
select extensions.is(
  test_support.delete_auth_user('e0000000-0000-0000-0000-000000000007'),
  null,
  'non-owner group administrator account deletion succeeds'
);
select extensions.is((select count(*) from public.group_members where id = 'e2000000-0000-0000-0000-000000000002'), 0::bigint, 'non-owner administrator membership is removed');
select extensions.is((select count(*) from public.groups where id = 'e1000000-0000-0000-0000-000000000002'), 1::bigint, 'non-owner administrator group remains');
select extensions.is((select count(*) from public.group_members where group_id in ('e1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000002') and role = 'owner'), 2::bigint, 'both cascade groups retain an owner');
select extensions.is((select actor_id from public.activity_events where group_id = 'e1000000-0000-0000-0000-000000000002' and type = 'group_member_removed' order by created_at desc limit 1), null::uuid, 'system-driven administrator removal has a null actor');
select extensions.is((select count(*) from public.activity_events ae where ae.actor_id is not null and not exists (select 1 from auth.users au where au.id = ae.actor_id)), 0::bigint, 'no activity event has a dangling actor foreign key');

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'e0000000-0000-0000-0000-000000000001', true);
select extensions.ok(test_support.try_remove_group_member('e2000000-0000-0000-0000-000000000003'), 'owner can manually remove another member');
select extensions.is((select actor_id from public.activity_events where group_id = 'e1000000-0000-0000-0000-000000000003' and type = 'group_member_removed' order by created_at desc limit 1), 'e0000000-0000-0000-0000-000000000001'::uuid, 'manual owner removal attributes the surviving owner');

select set_config('request.jwt.claim.sub', 'e0000000-0000-0000-0000-000000000002', true);
select extensions.ok(test_support.try_remove_group_member('e2000000-0000-0000-0000-000000000005'), 'admin can manually remove an eligible viewer');
select extensions.is((select actor_id from public.activity_events where group_id = 'e1000000-0000-0000-0000-000000000004' and type = 'group_member_removed' order by created_at desc limit 1), 'e0000000-0000-0000-0000-000000000002'::uuid, 'manual admin removal attributes the surviving admin');

select set_config('request.jwt.claim.sub', 'e0000000-0000-0000-0000-000000000003', true);
select extensions.ok(not test_support.try_remove_group_member('e2000000-0000-0000-0000-000000000009'), 'ordinary member cannot remove another member');
select set_config('request.jwt.claim.sub', 'e0000000-0000-0000-0000-000000000004', true);
select extensions.ok(not test_support.try_remove_group_member('e2000000-0000-0000-0000-000000000008'), 'viewer cannot remove another member');
select set_config('request.jwt.claim.sub', 'e0000000-0000-0000-0000-000000000005', true);
select extensions.ok(not test_support.try_remove_group_member('e2000000-0000-0000-0000-000000000008'), 'unrelated user cannot remove another member');

select set_config('request.jwt.claim.sub', 'e0000000-0000-0000-0000-00000000000c', true);
select extensions.ok(test_support.try_remove_group_member('e2000000-0000-0000-0000-00000000000a'), 'member self-removal remains supported');
reset role;
select extensions.is((select actor_id from public.activity_events where group_id = 'e1000000-0000-0000-0000-000000000008' and type = 'group_member_removed' order by created_at desc limit 1), 'e0000000-0000-0000-0000-00000000000c'::uuid, 'self-removal attributes the surviving authenticated member');

select set_config('request.jwt.claim.sub', '', true);
select extensions.is(test_support.delete_auth_user('e0000000-0000-0000-0000-00000000000a'), 'P0001', 'group creator deletion remains blocked even with another owner');
select extensions.is(test_support.delete_auth_user('e0000000-0000-0000-0000-00000000000b'), 'P0001', 'last-owner account deletion remains blocked');
select extensions.is((select count(*) from public.groups g where not exists (select 1 from public.group_members gm where gm.group_id = g.id and gm.role = 'owner')), 0::bigint, 'no ownerless group is produced');

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'e0000000-0000-0000-0000-000000000001', true);
select extensions.ok((select count(*) from public.activity_events where group_id = 'e1000000-0000-0000-0000-000000000001' and type = 'group_member_removed') = 1, 'remaining owner can see the system removal activity');
select set_config('request.jwt.claim.sub', 'e0000000-0000-0000-0000-000000000003', true);
select extensions.is((select count(*) from public.groups where id = 'e1000000-0000-0000-0000-000000000001'), 1::bigint, 'remaining member can still access the group');
select set_config('request.jwt.claim.sub', 'e0000000-0000-0000-0000-000000000005', true);
select extensions.is((select count(*) from public.activity_events where group_id = 'e1000000-0000-0000-0000-000000000001'), 0::bigint, 'unrelated user cannot see group activity');

reset role;
select * from extensions.finish();
rollback;
