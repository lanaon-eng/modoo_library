/*
# Update posts table for new app structure

1. Modified Tables
- `posts`: add new columns to support the 3-tab navigation structure
  - `book_author` (text): book author name
  - `book_cover_url` (text): book cover image URL (renamed concept from cover_url)
  - `category` (text): one of '국어'/'사회'/'과학기술'/'수학'/'도덕'/'예능'
  - `chat_cards` (jsonb): array of 2-3 card-news data from AI chat
  - `user_review` (text): user's short review (1-2 lines)
  - `is_published` (boolean, default false): whether the post is shared in public feed
  - `likes_count` (integer, default 0): number of likes
- Existing columns `book_title`, `cover_url`, `ai_insight`, `user_id`, `created_at` are kept as-is.
  `cover_url` remains for backwards compatibility with existing rows.

2. Security
- RLS already enabled on posts. No policy changes needed — existing owner-scoped
  policies (select all authenticated, insert/update/delete own) still apply.
  The new columns are covered by the existing policies automatically.

3. Notes
- `category` is free-text (no CHECK constraint) to allow flexibility.
- `chat_cards` stores the card array as jsonb for easy retrieval.
- `is_published` defaults to false so new posts are private until the user chooses to share.
*/

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS book_author text DEFAULT '',
  ADD COLUMN IF NOT EXISTS book_cover_url text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS chat_cards jsonb,
  ADD COLUMN IF NOT EXISTS user_review text,
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0;
