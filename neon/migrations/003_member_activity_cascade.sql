-- A parent deletion cannot create a new event referencing the deleted parent.
BEGIN;
CREATE OR REPLACE FUNCTION public.create_group_member_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF tg_op = 'INSERT' THEN
    INSERT INTO public.activity_events (actor_id, group_id, type, summary)
    VALUES (new.user_id, new.group_id, 'group_member_joined', 'Group member joined.');
    RETURN new;
  END IF;
  IF EXISTS (SELECT 1 FROM public.groups WHERE id = old.group_id) THEN
    INSERT INTO public.activity_events (actor_id, group_id, type, summary)
    VALUES (
      (SELECT id FROM neon_auth."user" WHERE id = old.user_id),
      old.group_id, 'group_member_removed', 'Group member removed.'
    );
  END IF;
  RETURN old;
END;
$$;
COMMIT;
