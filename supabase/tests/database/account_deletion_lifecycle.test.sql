begin;

create extension if not exists pgtap with schema extensions;
create schema if not exists test_support;

create or replace function test_support.delete_auth_user(target_user_id uuid)
returns text
language plpgsql
as $$
declare
  failed_constraint text;
begin
  delete from auth.users where id = target_user_id;
  return null;
exception
  when others then
    get stacked diagnostics failed_constraint = constraint_name;
    return case
      when nullif(failed_constraint, '') is null then sqlstate
      else sqlstate || ':' || failed_constraint
    end;
end;
$$;

select extensions.plan(35);

insert into auth.users (id, email)
values
  ('d0000000-0000-0000-0000-000000000001', 'delete-empty@fixtures.invalid'),
  ('d0000000-0000-0000-0000-000000000002', 'delete-challenge@fixtures.invalid'),
  ('d0000000-0000-0000-0000-000000000003', 'delete-member@fixtures.invalid'),
  ('d0000000-0000-0000-0000-000000000004', 'delete-group-admin@fixtures.invalid'),
  ('d0000000-0000-0000-0000-000000000005', 'delete-co-owner@fixtures.invalid'),
  ('d0000000-0000-0000-0000-000000000006', 'delete-last-owner@fixtures.invalid'),
  ('d0000000-0000-0000-0000-000000000007', 'delete-history@fixtures.invalid'),
  ('d0000000-0000-0000-0000-000000000008', 'delete-survivor-a@fixtures.invalid'),
  ('d0000000-0000-0000-0000-000000000009', 'delete-survivor-b@fixtures.invalid');

-- Scenario A: empty user.
select extensions.is(
  test_support.delete_auth_user('d0000000-0000-0000-0000-000000000001'),
  null,
  'scenario A: an empty user can be deleted'
);
select extensions.is(
  (select count(*) from public.profiles where id = 'd0000000-0000-0000-0000-000000000001'),
  0::bigint,
  'scenario A: the profile cascades with the Auth user'
);

-- Scenario B: challenge owner and all nested challenge records.
insert into public.challenges (id, owner_id, title)
values ('d1000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'Deletion fixture challenge');
insert into public.challenge_sections (id, challenge_id, section_key, content)
values ('d2000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000002', 'summary', 'fixture section');
insert into public.challenge_solutions (id, challenge_id, title)
values ('d3000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000002', 'fixture solution');
insert into public.challenge_tasks (id, challenge_id, title)
values ('d4000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000002', 'fixture task');
insert into public.messages (id, sender_id, challenge_id, body)
values ('d5000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000008', 'd1000000-0000-0000-0000-000000000002', 'fixture challenge message');

select extensions.is(
  test_support.delete_auth_user('d0000000-0000-0000-0000-000000000002'),
  null,
  'scenario B: a challenge owner can be deleted'
);
select extensions.is((select count(*) from public.challenges where id = 'd1000000-0000-0000-0000-000000000002'), 0::bigint, 'scenario B: the owned challenge cascades');
select extensions.is((select count(*) from public.challenge_sections where id = 'd2000000-0000-0000-0000-000000000002'), 0::bigint, 'scenario B: challenge sections cascade');
select extensions.is((select count(*) from public.challenge_solutions where id = 'd3000000-0000-0000-0000-000000000002'), 0::bigint, 'scenario B: challenge solutions cascade');
select extensions.is((select count(*) from public.challenge_tasks where id = 'd4000000-0000-0000-0000-000000000002'), 0::bigint, 'scenario B: challenge tasks cascade');
select extensions.is((select count(*) from public.messages where id = 'd5000000-0000-0000-0000-000000000002'), 0::bigint, 'scenario B: challenge-scoped messages cascade without orphans');

-- Shared groups for scenarios C, D, and G.
insert into public.groups (id, owner_id, name)
values
  ('d6000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000008', 'Member lifecycle group'),
  ('d6000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000008', 'Admin lifecycle group'),
  ('d6000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000008', 'History lifecycle group');
insert into public.group_members (id, group_id, user_id, role)
values
  ('d7000000-0000-0000-0000-000000000003', 'd6000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', 'member'),
  ('d7000000-0000-0000-0000-000000000004', 'd6000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000004', 'admin');

insert into public.group_invitations (id, group_id, inviter_id, invitee_id, role, status)
values
  ('d8000000-0000-0000-0000-000000000003', 'd6000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000003', 'member', 'accepted'),
  ('d8000000-0000-0000-0000-000000000007', 'd6000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000009', 'member', 'pending');

select extensions.is(test_support.delete_auth_user('d0000000-0000-0000-0000-000000000003'), null, 'scenario C: an ordinary group member can be deleted');
select extensions.is((select count(*) from public.group_members where user_id = 'd0000000-0000-0000-0000-000000000003'), 0::bigint, 'scenario C: membership cascades');
select extensions.is((select count(*) from public.group_invitations where id = 'd8000000-0000-0000-0000-000000000003'), 0::bigint, 'scenario C: invitations involving the deleted member cascade');
select extensions.is((select count(*) from public.groups where id = 'd6000000-0000-0000-0000-000000000003'), 1::bigint, 'scenario C: the group and its owner remain');
select extensions.is((select count(*) from public.group_members where group_id = 'd6000000-0000-0000-0000-000000000003' and role = 'owner'), 1::bigint, 'scenario C: group ownership remains valid');

select extensions.is(test_support.delete_auth_user('d0000000-0000-0000-0000-000000000004'), null, 'scenario D: a non-owner group administrator can be deleted');
select extensions.is((select count(*) from public.group_members where user_id = 'd0000000-0000-0000-0000-000000000004'), 0::bigint, 'scenario D: administrator membership cascades');
select extensions.is((select count(*) from public.groups where id = 'd6000000-0000-0000-0000-000000000004'), 1::bigint, 'scenario D: the group remains');
select extensions.is((select count(*) from public.group_members where group_id = 'd6000000-0000-0000-0000-000000000004' and role = 'owner'), 1::bigint, 'scenario D: ownership remains with the original owner');

-- Scenario E: group creator with another accepted owner.
insert into public.groups (id, owner_id, name)
values ('d6000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000005', 'Co-owned lifecycle group');
insert into public.group_members (id, group_id, user_id, role)
values ('d7000000-0000-0000-0000-000000000005', 'd6000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000008', 'owner');

select extensions.is(
  test_support.delete_auth_user('d0000000-0000-0000-0000-000000000005'),
  'P0001',
  'scenario E: creator deletion is explicitly blocked instead of silently deleting a co-owned group'
);
select extensions.is((select count(*) from auth.users where id = 'd0000000-0000-0000-0000-000000000005'), 1::bigint, 'scenario E: the blocked Auth user remains');
select extensions.is((select count(*) from public.groups where id = 'd6000000-0000-0000-0000-000000000005'), 1::bigint, 'scenario E: the co-owned group remains after the blocked deletion');
select extensions.is((select count(*) from public.group_members where group_id = 'd6000000-0000-0000-0000-000000000005' and role = 'owner'), 2::bigint, 'scenario E: both owner memberships remain after rollback');

-- Scenario F: last accepted owner.
insert into public.groups (id, owner_id, name)
values ('d6000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000006', 'Last-owner lifecycle group');

select extensions.is(
  test_support.delete_auth_user('d0000000-0000-0000-0000-000000000006'),
  'P0001',
  'scenario F: deletion of the last group owner is safely blocked'
);
select extensions.is((select count(*) from auth.users where id = 'd0000000-0000-0000-0000-000000000006'), 1::bigint, 'scenario F: the blocked Auth user remains');
select extensions.is((select count(*) from public.groups where id = 'd6000000-0000-0000-0000-000000000006'), 1::bigint, 'scenario F: the group remains');
select extensions.is((select count(*) from public.group_members where group_id = 'd6000000-0000-0000-0000-000000000006' and role = 'owner'), 1::bigint, 'scenario F: the group retains exactly one owner');

-- Scenario G: relationships and retained communication/history.
insert into public.friend_requests (id, sender_id, receiver_id, status)
values ('d9000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000009', 'pending');
insert into public.friendships (id, user_one_id, user_two_id)
values ('da000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000009');
insert into public.messages (id, sender_id, group_id, body)
values ('db000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000007', 'd6000000-0000-0000-0000-000000000007', 'RETAINED_GROUP_MESSAGE_BODY');
insert into public.notifications (id, user_id, type, title, body, related_group_id)
values ('dc000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000007', 'group_updated', 'fixture notification', 'private recipient history', 'd6000000-0000-0000-0000-000000000007');
insert into public.admin_audit_log (id, actor_id, action, target_table, metadata)
values ('dd000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000007', 'fixture.history', 'profiles', '{"contains_private_content": false}'::jsonb);
insert into public.activity_events (id, actor_id, group_id, type, summary)
values ('dd100000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000007', 'd6000000-0000-0000-0000-000000000007', 'group_updated', 'fixture retained activity');

select extensions.is(test_support.delete_auth_user('d0000000-0000-0000-0000-000000000007'), null, 'scenario G: a non-owner user with relationship and communication history can be deleted');
select extensions.is((select count(*) from public.friend_requests where id = 'd9000000-0000-0000-0000-000000000007'), 0::bigint, 'scenario G: friend requests cascade');
select extensions.is((select count(*) from public.friendships where id = 'da000000-0000-0000-0000-000000000007'), 0::bigint, 'scenario G: friendships cascade');
select extensions.is((select count(*) from public.group_invitations where id = 'd8000000-0000-0000-0000-000000000007'), 0::bigint, 'scenario G: invitations sent by the deleted user cascade');
select extensions.is((select count(*) from public.notifications where user_id = 'd0000000-0000-0000-0000-000000000007'), 0::bigint, 'scenario G: notifications addressed to the deleted user cascade');
select extensions.is((select sender_id from public.messages where id = 'db000000-0000-0000-0000-000000000007'), null::uuid, 'scenario G: retained group messages anonymize the deleted sender reference');
select extensions.is((select body from public.messages where id = 'db000000-0000-0000-0000-000000000007'), 'RETAINED_GROUP_MESSAGE_BODY', 'scenario G: authorized group history retains the message body');
select extensions.is((select actor_id from public.activity_events where id = 'dd100000-0000-0000-0000-000000000007'), null::uuid, 'scenario G: retained activity anonymizes the deleted actor reference');
select extensions.is((select actor_id from public.admin_audit_log where id = 'dd000000-0000-0000-0000-000000000007'), null::uuid, 'scenario G: retained audit history anonymizes the deleted actor reference');
select extensions.is((select count(*) from public.groups where id = 'd6000000-0000-0000-0000-000000000007'), 1::bigint, 'scenario G: the surviving group remains');

select * from extensions.finish();
rollback;
