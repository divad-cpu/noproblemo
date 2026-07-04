-- Phase 10: admin/settings foundation and local project log support.
-- Adds explicit admin helpers, admin-only aggregate RPCs, audit-log storage,
-- and profile role hardening without exposing auth.users or private content.

create or replace function public.is_admin(target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = target_user_id
      and p.role = 'admin'
  )
$$;

grant execute on function public.is_admin(uuid) to authenticated;

create or replace function public.prevent_profile_role_self_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role is distinct from new.role and auth.uid() = old.id then
    raise exception 'Profile role cannot be self-assigned';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_prevent_role_self_change on public.profiles;
create trigger profiles_prevent_role_self_change
before update of role on public.profiles
for each row execute function public.prevent_profile_role_self_change();

revoke update (role) on public.profiles from authenticated;

drop policy if exists "profiles_select_admin_all" on public.profiles;
create policy "profiles_select_admin_all"
on public.profiles
for select
to authenticated
using (public.is_admin(auth.uid()));

create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_table text,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint admin_audit_log_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create index admin_audit_log_created_at_idx on public.admin_audit_log(created_at desc);
create index admin_audit_log_actor_idx on public.admin_audit_log(actor_id);

alter table public.admin_audit_log enable row level security;

revoke all on public.admin_audit_log from anon, authenticated;
grant select on public.admin_audit_log to authenticated;

create policy "admin_audit_log_select_admin"
on public.admin_audit_log
for select
to authenticated
using (public.is_admin(auth.uid()));

create or replace function public.admin_overview_counts()
returns table(metric text, value bigint)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  return query
    select 'profiles'::text, count(*)::bigint from public.profiles
    union all
    select 'challenges'::text, count(*)::bigint from public.challenges
    union all
    select 'groups'::text, count(*)::bigint from public.groups
    union all
    select 'messages'::text, count(*)::bigint from public.messages
    union all
    select 'notifications'::text, count(*)::bigint from public.notifications;
end;
$$;

create or replace function public.admin_list_profiles(profile_limit integer default 20)
returns table(
  id uuid,
  display_name text,
  preferred_locale text,
  role text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  return query
    select p.id, p.display_name, p.preferred_locale, p.role, p.created_at
    from public.profiles p
    order by p.created_at desc
    limit least(greatest(coalesce(profile_limit, 20), 1), 50);
end;
$$;

create or replace function public.admin_recent_activity(activity_limit integer default 10)
returns table(
  id uuid,
  actor_id uuid,
  actor_display_name text,
  group_id uuid,
  challenge_id uuid,
  type text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  return query
    select
      ae.id,
      ae.actor_id,
      p.display_name,
      ae.group_id,
      ae.challenge_id,
      ae.type,
      ae.created_at
    from public.activity_events ae
    left join public.profiles p on p.id = ae.actor_id
    order by ae.created_at desc
    limit least(greatest(coalesce(activity_limit, 10), 1), 50);
end;
$$;

create or replace function public.admin_recent_audit_log(audit_limit integer default 10)
returns table(
  id uuid,
  actor_id uuid,
  action text,
  target_table text,
  target_id uuid,
  metadata jsonb,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  return query
    select
      aal.id,
      aal.actor_id,
      aal.action,
      aal.target_table,
      aal.target_id,
      aal.metadata,
      aal.created_at
    from public.admin_audit_log aal
    order by aal.created_at desc
    limit least(greatest(coalesce(audit_limit, 10), 1), 50);
end;
$$;

grant execute on function public.admin_overview_counts() to authenticated;
grant execute on function public.admin_list_profiles(integer) to authenticated;
grant execute on function public.admin_recent_activity(integer) to authenticated;
grant execute on function public.admin_recent_audit_log(integer) to authenticated;
