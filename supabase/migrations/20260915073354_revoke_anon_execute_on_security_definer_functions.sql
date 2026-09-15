-- Revoke EXECUTE from anon role on all SECURITY DEFINER functions.
-- These functions should only be callable by authenticated users.
-- The anon role is used by unauthenticated requests; allowing it to call
-- SECURITY DEFINER functions exposes privileged operations publicly.

REVOKE EXECUTE ON FUNCTION public.accept_follow_request(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.check_mutual_follow(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.decrement_like(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_follow_counts(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_follower_list(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_following_list(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_pending_follow_requests() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_profiles(uuid[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_like(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_following(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.reject_follow_request(uuid) FROM anon;
