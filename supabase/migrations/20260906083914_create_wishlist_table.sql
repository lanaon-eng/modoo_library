/*
# Create wishlist table (나중에 읽을 책 보관함)

1. New Table

- `wishlist`
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, default auth.uid()) — 보관함 소유자
  - `book_title` (text, not null) — 책 제목
  - `book_author` (text, nullable) — 저자
  - `book_publisher` (text, nullable) — 출판사
  - `thumbnail` (text, nullable) — 쑜지 URL
  - `cover_urls` (text[], nullable) — 표지 URL 배열
  - `book_url` (text, nullable) — 책 링크
  - `book_contents` (text, nullable) — 책 소개
  - `external_id` (text, nullable) — 외부 검색 결과의 책 ID (중복 방지용)
  - `created_at` (timestamptz, default now())
  - UNIQUE(user_id, external_id) — 같은 책 중복 보관 방지 (external_id가 있는 경우)
  - UNIQUE(user_id, book_title) — 같은 제목 중복 방지 (external_id가 없는 경우)

2. Security (RLS)

- SELECT: 본인만 자신의 보관함 조회 가능
- INSERT: 본인만 보관함에 추가 가능
- DELETE: 본인만 보관함에서 삭제 가능

3. Indexes

- `wishlist(user_id)` — 사용자별 보관함 조회
*/

CREATE TABLE IF NOT EXISTS wishlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  book_title text NOT NULL,
  book_author text,
  book_publisher text,
  thumbnail text,
  cover_urls text[],
  book_url text,
  book_contents text,
  external_id text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, external_id),
  UNIQUE(user_id, book_title)
);

ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_wishlist" ON wishlist;
CREATE POLICY "select_own_wishlist" ON wishlist FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_wishlist" ON wishlist;
CREATE POLICY "insert_own_wishlist" ON wishlist FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_wishlist" ON wishlist;
CREATE POLICY "delete_own_wishlist" ON wishlist FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id);
