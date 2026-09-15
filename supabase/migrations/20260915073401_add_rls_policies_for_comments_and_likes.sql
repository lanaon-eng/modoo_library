-- The comments and likes tables have RLS enabled but zero policies,
-- meaning no role (including authenticated) can read or write any rows.
-- These tables appear to be unused by the current application (post_likes
-- is used instead of likes, and no code references comments).
-- Add proper ownership-based policies so they are not silently broken
-- if they are used in the future.

-- comments: user-owned rows
CREATE POLICY "select_own_comments" ON comments
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_comments" ON comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_comments" ON comments
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_comments" ON comments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- likes: user-owned rows
CREATE POLICY "select_own_likes" ON likes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_likes" ON likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_likes" ON likes
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_likes" ON likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
