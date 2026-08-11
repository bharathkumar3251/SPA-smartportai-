
REVOKE ALL ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_super_admin(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.primary_role(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.approve_role_request(UUID, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.revoke_role(UUID, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_account_status(UUID, public.account_status) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.primary_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_role_request(UUID, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_role(UUID, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_account_status(UUID, public.account_status) TO authenticated;
