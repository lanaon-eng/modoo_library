/*
# Create follows and recommendations tables

1. New Tables

- `follows`
  - `id` (uuid, primary key)
  - `follower_id` (uuid, not null) — 팔로우하는 사용자
  - `following_id` (uuid, not null) — 팔로우받는 사용자
  - `created_at` (timestamptz, default now())
  - UNIQUE(follower_id, following_id) — 중복 팔로우 방지
  - CHECK(follower_id != following_id) — 자기 자신 팔로우 방지

- `recommendations`
  - `id` (uuid, primary key)
  - `sender_id` (uuid, not null) — 추천한 사람
  - `receiver_id` (uuid, not null) — 추천받는 사람
  - `post_id` (uuid, not null) — 추천하는 책 게시물
  - `message` (text, nullable) — 추천 메시지
  - `is_read` (boolean, default false) — 읽음 여부
  - `created_at` (timestamptz, default now())
  - UNIQUE(sender_id, receiver_id, post_id) — 중복 추천 방지
  - FK to posts(id) ON DELETE CASCADE

2. Security (RLS)

- `follows`:
  - SELECT: authenticated 사용자는 모든 팔로우 관계 조회 가능 (공개 정보)
  - INSERT: 본인만 자신의 팔로우 생성 가능
  - DELETE: 본인만 자신의 팔로우 삭제 가능

- `recommendations`:
  - SELECT: 추천한 사람(sender) 또는 추천받은 사람(receiver)만 조회 가능
  - INSERT: 본인만 추천 생성 가능 (sender_id = auth.uid())
  - UPDATE: 추천받은 사람만 is_read 업데이트 가능
  - DELETE: 추천한 사람만 삭제 가능

3. Indexes

- `follows(following_id)` — 특정 사용자를 팔로우하는 사람 조회
- `follows(follower_id)` — 특정 사용자가 팔로우하는 사람 조회
- `recommendations(receiver_id)` — 추천받은 목록 조회
- `recommendations(sender_id)` — 추천한 목록 조회

4. Functions

- `get_follow_counts(user_id uuid)`: 팔로워 수, 팔로잉 수 반환
- `is_following(target_id uuid)`: 현재 사용자가 target을 팔로우 중인지 boolean 반환
*/

-- ===================== follows table =====================
CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK(follower_id != following_id)
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_follows" ON follows;
CREATE POLICY "select_follows" ON follows FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_follow" ON follows;
CREATE POLICY "insert_own_follow" ON follows FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "delete_own_follow" ON follows;
CREATE POLICY "delete_own_follow" ON follows FOR DELETE
  TO authenticated USING (auth.uid() = follower_id);

CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);

-- ===================== recommendations table =====================
CREATE TABLE IF NOT EXISTS recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  message text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(sender_id, receiver_id, post_id)
);

ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_recommendations" ON recommendations;
CREATE POLICY "select_own_recommendations" ON recommendations FOR SELECT
  TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "insert_own_recommendations" ON recommendations;
CREATE POLICY "insert_own_recommendations" ON recommendations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "update_received_recommendations" ON recommendations;
CREATE POLICY "update_received_recommendations" ON recommendations FOR UPDATE
  TO authenticated USING (auth.uid() = receiver_id) WITH CHECK (auth.uid() = receiver_id);

DROP POLICY IF EXISTS "delete_sent_recommendations" ON recommendations;
CREATE POLICY "delete_sent_recommendations" ON recommendations FOR DELETE
  TO authenticated USING (auth.uid() = sender_id);

CREATE INDEX IF NOT EXISTS idx_recommendations_receiver_id ON recommendations(receiver_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_sender_id ON recommendations(sender_id);

-- ===================== Helper functions =====================

CREATE OR REPLACE FUNCTION get_follow_counts(target_user_id uuid)
RETURNS TABLE (follower_count bigint, following_count bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT count(*) FROM follows WHERE following_id = target_user_id),
    (SELECT count(*) FROM follows WHERE follower_id = target_user_id)
$$;

REVOKE ALL ON FUNCTION get_follow_counts(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_follow_counts(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION is_following(target_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM follows
    WHERE follower_id = auth.uid() AND following_id = target_id
  )
$$;

REVOKE ALL ON FUNCTION is_following(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_following(uuid) TO authenticated;
