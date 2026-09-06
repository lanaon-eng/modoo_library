/*
# Fix follow list functions to use auth.users instead of profiles table

The profiles table does not exist. The existing get_profiles function reads from auth.users.
This migration updates the follow list functions to use auth.users directly,
matching the pattern used by get_profiles.
*/

-- Drop and recreate functions using auth.users instead of profiles

CREATE OR REPLACE FUNCTION get_following_list(target_user_id uuid)
RETURNS TABLE(id uuid, full_name text, avatar_url text)
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
FROM follows f
JOIN auth.users u ON u.id = f.following_id
WHERE f.follower_id = target_user_id AND f.status = 'accepted';
$$;

CREATE OR REPLACE FUNCTION get_follower_list(target_user_id uuid)
RETURNS TABLE(id uuid, full_name text, avatar_url text, status text)
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
  ) AS avatar_url,
  f.status
FROM follows f
JOIN auth.users u ON u.id = f.follower_id
WHERE f.following_id = target_user_id;
$$;

CREATE OR REPLACE FUNCTION get_pending_follow_requests()
RETURNS TABLE(follower_id uuid, full_name text, avatar_url text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
SELECT
  f.follower_id,
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    split_part(u.email, '@', 1)
  ) AS full_name,
  COALESCE(
    u.raw_user_meta_data->>'avatar_url',
    u.raw_user_meta_data->>'picture'
  ) AS avatar_url
FROM follows f
JOIN auth.users u ON u.id = f.follower_id
WHERE f.following_id = auth.uid() AND f.status = 'pending';
$$;
