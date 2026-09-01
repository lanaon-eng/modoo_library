/*
# Add increment_like and decrement_like RPC functions

1. New Functions
- `increment_like(post_id uuid)`: increments likes_count on the given post by 1.
- `decrement_like(post_id uuid)`: decrements likes_count on the given post by 1 (floor at 0).

2. Security
- Both functions are SECURITY DEFINER so they can update posts.likes_count
  regardless of the caller's RLS policies on posts.
- Granted EXECUTE to authenticated role only.

3. Notes
- These are called from the application after inserting/deleting a post_likes row.
- Uses UPDATE ... RETURNING for atomicity.
*/

CREATE OR REPLACE FUNCTION increment_like(post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE posts SET likes_count = COALESCE(likes_count, 0) + 1
  WHERE id = post_id;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_like(post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE posts SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
  WHERE id = post_id;
END;
$$;

REVOKE ALL ON FUNCTION increment_like(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION decrement_like(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_like(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_like(uuid) TO authenticated;
