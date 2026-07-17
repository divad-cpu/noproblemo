drop policy if exists "group_invitations_update_related"
on public.group_invitations;

create policy "group_invitations_update_related"
on public.group_invitations for update to authenticated
using (
  status = 'pending'
  and (
    invitee_id = auth.uid()
    or inviter_id = auth.uid()
    or public.can_manage_group(group_id, auth.uid())
  )
)
with check (
  (invitee_id = auth.uid() and status in ('accepted', 'declined'))
  or (inviter_id = auth.uid() and status = 'canceled')
  or (public.can_manage_group(group_id, auth.uid()) and status = 'canceled')
);
