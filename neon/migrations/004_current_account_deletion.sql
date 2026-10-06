BEGIN;
-- Managed Neon Auth does not expose Better Auth's end-user delete-user endpoint.
-- No caller-supplied ID or privileged application credential is accepted here.
CREATE OR REPLACE FUNCTION public.delete_current_account()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE current_user_id uuid := auth.uid();
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  DELETE FROM neon_auth."user" WHERE id = current_user_id;
  RETURN FOUND;
END;
$$;
REVOKE ALL ON FUNCTION public.delete_current_account() FROM PUBLIC, anonymous;
GRANT EXECUTE ON FUNCTION public.delete_current_account() TO authenticated;
COMMIT;
