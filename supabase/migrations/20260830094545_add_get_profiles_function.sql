/*
# Add get_profiles function for public feed author display

1. New Functions
- `get_profiles(user_ids uuid[])`: returns user metadata (id, full_name, avatar_url)
  for the given user IDs by reading from auth.users.raw_user_meta_data.

2. Security
- SECURITY DEFINER so it can read auth.users (which the anon/authenticated roles cannot).
- EXECUTE granted to authenticated only.

3. Notes
- Used by the public feed to display who shared each post.
- Only exposes display name and avatar URL — no sensitive data.
*/

CREATE OR REPLACE FUNCTION get_profiles(user_ids uuid[])
RETURNS TABLE (
  id uuid,
  full_name text,
  avatar_url text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    u.id,
    COALESCE(
      u.raw_user_meta_data->>'full_name',
      u.raw_user_meta_data->>'name',
      split_part(u.email, '@', 1)
    ) AS full_name,
    COALESCE(
      u.raw_user_meta_data->>'avatar_url',
      u.raw_user_meta_data->>'picture'
    ) AS avatar_url
  FROM auth.users u
  WHERE u.id = ANY(user_ids);
$$;

REVOKE ALL ON FUNCTION get_profiles(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_profiles(uuid[]) TO authenticated;
