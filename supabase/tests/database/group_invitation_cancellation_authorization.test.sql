begin;

create extension if not exists pgtap with schema extensions;
create schema if not exists test_support;

create or replace function test_support.try_cancel_group_invitation(
  target_invitation_id uuid
)
returns boolean
language plpgsql
as $$
declare
  affected_rows integer;
begin
  update public.group_invitations
  set status = 'canceled', responded_at = clock_timestamp()
  where id = target_invitation_id;

  get diagnostics affected_rows = row_count;
  return affected_rows = 1;
exception
  when others then
    return false;
end;
$$;

grant usage on schema test_support to authenticated;
grant execute on function test_support.try_cancel_group_invitation(uuid)
to authenticated;

select extensions.plan(10);

insert into auth.users (id, email)
values
  ('00000000-0000-0000-0000-0000000000a1', 'cancel-inviter@local.invalid'),
  ('00000000-0000-0000-0000-0000000000b1', 'cancel-owner@local.invalid'),
  ('00000000-0000-0000-0000-0000000000c1', 'cancel-admin@local.invalid'),
  ('00000000-0000-0000-0000-0000000000d1', 'cancel-member@local.invalid'),
  ('00000000-0000-0000-0000-0000000000e1', 'cancel-viewer@local.invalid'),
  ('00000000-0000-0000-0000-0000000000f1', 'cancel-unrelated@local.invalid'),
  ('00000000-0000-0000-0000-0000000000a2', 'cancel-invitee@local.invalid');

insert into public.groups (id, owner_id, name)
select
  ('10000000-0000-0000-0000-' || lpad(group_number::text, 12, '0'))::uuid,
  '00000000-0000-0000-0000-0000000000b1',
  'Invitation cancellation policy ' || group_number
from generate_series(1, 10) as group_number;

insert into public.group_members (group_id, user_id, role)
select group_record.id, membership.user_id, membership.role
from public.groups as group_record
cross join (
  values
    ('00000000-0000-0000-0000-0000000000c1'::uuid, 'admin'::text),
    ('00000000-0000-0000-0000-0000000000d1'::uuid, 'member'::text),
    ('00000000-0000-0000-0000-0000000000e1'::uuid, 'viewer'::text)
) as membership(user_id, role)
where group_record.name like 'Invitation cancellation policy %';

insert into public.group_invitations (
  id,
  group_id,
  inviter_id,
  invitee_id,
  role,
  status
)
select
  ('20000000-0000-0000-0000-' || lpad(group_number::text, 12, '0'))::uuid,
  ('10000000-0000-0000-0000-' || lpad(group_number::text, 12, '0'))::uuid,
  '00000000-0000-0000-0000-0000000000a1',
  '00000000-0000-0000-0000-0000000000a2',
  'member',
  case group_number
    when 8 then 'accepted'
    when 9 then 'declined'
    when 10 then 'canceled'
    else 'pending'
  end
from generate_series(1, 10) as group_number;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
select extensions.ok(
  test_support.try_cancel_group_invitation('20000000-0000-0000-0000-000000000001'),
  'the original inviter can cancel a pending invitation'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b1', true);
select extensions.ok(
  test_support.try_cancel_group_invitation('20000000-0000-0000-0000-000000000002'),
  'a non-inviter accepted owner can cancel a pending invitation'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c1', true);
select extensions.ok(
  test_support.try_cancel_group_invitation('20000000-0000-0000-0000-000000000003'),
  'a non-inviter accepted admin can cancel a pending invitation'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000d1', true);
select extensions.ok(
  not test_support.try_cancel_group_invitation('20000000-0000-0000-0000-000000000004'),
  'an ordinary member cannot cancel a pending invitation'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000e1', true);
select extensions.ok(
  not test_support.try_cancel_group_invitation('20000000-0000-0000-0000-000000000005'),
  'a viewer cannot cancel a pending invitation'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000f1', true);
select extensions.ok(
  not test_support.try_cancel_group_invitation('20000000-0000-0000-0000-000000000006'),
  'an unrelated authenticated user cannot cancel a pending invitation'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a2', true);
select extensions.ok(
  not test_support.try_cancel_group_invitation('20000000-0000-0000-0000-000000000007'),
  'the invitee has no cancellation authority merely by being the invitee'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b1', true);
select extensions.ok(
  not test_support.try_cancel_group_invitation('20000000-0000-0000-0000-000000000008'),
  'an accepted invitation cannot be changed to canceled'
);
select extensions.ok(
  not test_support.try_cancel_group_invitation('20000000-0000-0000-0000-000000000009'),
  'a declined invitation cannot be changed to canceled'
);
select extensions.ok(
  not test_support.try_cancel_group_invitation('20000000-0000-0000-0000-000000000010'),
  'an already canceled invitation cannot be changed again'
);

select * from extensions.finish();
rollback;
