-- Deleting an entire group (or its owning account) cascades through membership.
-- Retain the last-owner guard while the parent group still exists.
BEGIN;
CREATE OR REPLACE FUNCTION public.prevent_group_without_owner()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF old.role = 'owner'
    AND EXISTS (SELECT 1 FROM public.groups WHERE id = old.group_id)
    AND NOT EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = old.group_id AND role = 'owner' AND id <> old.id
    ) THEN
    RAISE EXCEPTION 'Group must keep an owner';
  END IF;
  RETURN old;
END;
$$;
COMMIT;
