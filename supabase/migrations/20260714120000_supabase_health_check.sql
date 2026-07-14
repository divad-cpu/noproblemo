-- Minimal public health RPC for the authenticated keepalive Route Handler.

create or replace function public.noproblemo_health_check()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select true;
$$;

revoke all on function public.noproblemo_health_check() from public;
revoke all on function public.noproblemo_health_check() from authenticated;
revoke all on function public.noproblemo_health_check() from service_role;
grant execute on function public.noproblemo_health_check() to anon;
