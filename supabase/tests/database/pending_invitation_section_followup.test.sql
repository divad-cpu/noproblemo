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

select extensions.plan(10);

insert into auth.users (id, email)
values
  ('00000000-0000-0000-0000-00000000001a', 'followup-a@local.invalid'),
  ('00000000-0000-0000-0000-00000000001b', 'followup-b@local.invalid'),
  ('00000000-0000-0000-0000-00000000001c', 'followup-c@local.invalid');

insert into public.challenges (id, owner_id, title)
values (
  '10000000-0000-0000-0000-00000000001a',
  '00000000-0000-0000-0000-00000000001a',
  'Application follow-up challenge'
);

insert into public.groups (id, owner_id, name, description)
values (
  '20000000-0000-0000-0000-00000000001a',
  '00000000-0000-0000-0000-00000000001a',
  'Application follow-up group',
  'This description must not come from the pending invitation RPC.'
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
  '30000000-0000-0000-0000-00000000001a',
  '20000000-0000-0000-0000-00000000001a',
  '00000000-0000-0000-0000-00000000001a',
  '00000000-0000-0000-0000-00000000001c',
  'member',
  'pending'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-00000000001a',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

select extensions.is(
  (
    select count(*)
    from public.groups
    where id = '20000000-0000-0000-0000-00000000001a'
  ),
  1::bigint,
  'ordinary member group reads remain available'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-00000000001c',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

select extensions.is(
  (
    select count(*)
    from public.group_invitations
    where id = '30000000-0000-0000-0000-00000000001a'
  ),
  1::bigint,
  'the pending invitee can read the RLS-protected invitation state'
);
select extensions.is(
  (
    select count(*)
    from public.groups
    where id = '20000000-0000-0000-0000-00000000001a'
  ),
  0::bigint,
  'the pending invitee cannot read the base group row'
);
select extensions.is(
  (select count(*) from public.pending_group_invitations()),
  1::bigint,
  'the argument-free RPC returns the caller pending invitation'
);
select extensions.is(
  (
    select to_jsonb(invitation_record)
    from public.pending_group_invitations() invitation_record
    where invitation_id = '30000000-0000-0000-0000-00000000001a'
  ),
  jsonb_build_object(
    'invitation_id', '30000000-0000-0000-0000-00000000001a'::uuid,
    'group_id', '20000000-0000-0000-0000-00000000001a'::uuid,
    'group_name', 'Application follow-up group',
    'invited_role', 'member'
  ),
  'the RPC row exposes exactly the four application fields'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-00000000001b',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

select extensions.is(
  (select count(*) from public.pending_group_invitations()),
  0::bigint,
  'an unrelated caller receives no pending invitation identity'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-00000000001a',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

insert into public.challenge_sections (
  challenge_id,
  section_key,
  content,
  position
)
values (
  '10000000-0000-0000-0000-00000000001a',
  'summary',
  'First caller content',
  7
);

select extensions.is(
  (
    select count(*)
    from public.challenge_sections
    where challenge_id = '10000000-0000-0000-0000-00000000001a'
      and section_key = 'summary'
  ),
  1::bigint,
  'a normal first insert creates one section row'
);
select extensions.is(
  test_support.capture_sqlstate($command$
    insert into public.challenge_sections (
      challenge_id,
      section_key,
      content,
      position
    )
    values (
      '10000000-0000-0000-0000-00000000001a',
      'summary',
      'Concurrent caller content',
      7
    )
  $command$),
  '23505',
  'a concurrent first insert is classified by PostgreSQL as 23505'
);

update public.challenge_sections
set content = 'Concurrent caller content', position = 7
where challenge_id = '10000000-0000-0000-0000-00000000001a'
  and section_key = 'summary';

select extensions.ok(
  (
    select count(*) = 1
      and max(content) = 'Concurrent caller content'
    from public.challenge_sections
    where challenge_id = '10000000-0000-0000-0000-00000000001a'
      and section_key = 'summary'
  ),
  'the exact-key recovery update leaves one verified row'
);

update public.challenge_sections
set content = 'Sequential caller content', position = 7
where challenge_id = '10000000-0000-0000-0000-00000000001a'
  and section_key = 'summary';

select extensions.ok(
  (
    select count(*) = 1
      and max(content) = 'Sequential caller content'
    from public.challenge_sections
    where challenge_id = '10000000-0000-0000-0000-00000000001a'
      and section_key = 'summary'
  ),
  'a sequential follow-up update preserves one row per section key'
);

select * from extensions.finish();
rollback;
