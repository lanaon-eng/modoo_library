/*
# Update posts RLS policies for authenticated social login

## Summary
- The posts table already has RLS enabled but no policies, making it inaccessible.
- This migration adds owner-scoped CRUD policies for authenticated users.
- SELECT is open to all authenticated users (so the "모두의 서재" feed shows everyone's posts).
- INSERT/UPDATE/DELETE are restricted to the owner (user_id = auth.uid()).

## Tables
- posts (existing, no schema changes)
  - user_id: uuid, foreign key to auth.users.id

## Security
- RLS stays enabled.
- SELECT: any authenticated user can read all posts (shared feed).
- INSERT: authenticated users can only insert their own posts (user_id must match auth.uid()).
- UPDATE: authenticated users can only update their own posts.
- DELETE: authenticated users can only delete their own posts.
*/

-- SELECT: all authenticated users can see all posts (shared feed)
DROP POLICY IF EXISTS "authenticated_select_posts" ON posts;
CREATE POLICY "authenticated_select_posts"
  ON posts FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: only own posts
DROP POLICY IF EXISTS "authenticated_insert_posts" ON posts;
CREATE POLICY "authenticated_insert_posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: only own posts
DROP POLICY IF EXISTS "authenticated_update_posts" ON posts;
CREATE POLICY "authenticated_update_posts"
  ON posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: only own posts
DROP POLICY IF EXISTS "authenticated_delete_posts" ON posts;
CREATE POLICY "authenticated_delete_posts"
  ON posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
