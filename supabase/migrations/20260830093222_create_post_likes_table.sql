/*
# Create post_likes table for like toggle

1. New Tables
- `post_likes`: tracks individual user likes on posts
  - `id` (uuid, primary key)
  - `post_id` (uuid, FK to posts, ON DELETE CASCADE)
  - `user_id` (uuid, NOT NULL, DEFAULT auth.uid())
  - `created_at` (timestamptz, DEFAULT now())
  - Unique constraint on (post_id, user_id) to prevent duplicate likes

2. Security
- Enable RLS on `post_likes`.
- Owner-scoped CRUD: each authenticated user can only manage their own likes.
- SELECT: any authenticated user can see likes (needed to count and check status).

3. Notes
- `likes_count` on `posts` is kept in sync via the application layer (increment/decrement on like/unlike).
- The unique constraint ensures one like per user per post.
*/

CREATE TABLE IF NOT EXISTS post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (post_id, user_id)
);

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_post_likes" ON post_likes;
CREATE POLICY "select_post_likes"
ON post_likes FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_like" ON post_likes;
CREATE POLICY "insert_own_like"
ON post_likes FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_like" ON post_likes;
CREATE POLICY "delete_own_like"
ON post_likes FOR DELETE
TO authenticated USING (auth.uid() = user_id);
