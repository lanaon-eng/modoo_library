/*
# Create currently_reading table

## Purpose
Tracks books a user is currently reading but hasn't finished yet.
This separates "reading" books from "finished" books (posts),
enabling a natural lifecycle: reading → take notes → AI chat → finished (posts).

## New Tables
- `currently_reading`
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to auth.uid(), references auth.users)
  - `book_title` (text, not null) — title of the book
  - `book_author` (text, nullable) — comma-separated author names
  - `book_publisher` (text, nullable) — publisher name
  - `thumbnail` (text, nullable) — single cover URL fallback
  - `cover_urls` (text[], nullable) — array of cover image URLs
  - `book_url` (text, nullable) — external link to book
  - `book_contents` (text, nullable) — book description/summary
  - `external_id` (text, nullable) — external API book ID
  - `created_at` (timestamptz, default now())

## Constraints
- Unique constraint on (user_id, book_title) — one reading entry per book per user

## Security
- Enable RLS on `currently_reading`.
- Owner-scoped CRUD: each authenticated user can only access their own rows.
- user_id defaults to auth.uid() so inserts omitting user_id succeed.

## Notes
1. When a user finishes AI chat and saves to posts, the app deletes the corresponding currently_reading row.
2. Reading notes (reading_notes table) link by book_title, so they work across both currently_reading and posts.
*/

CREATE TABLE IF NOT EXISTS currently_reading (
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
  CONSTRAINT currently_reading_user_book_unique UNIQUE (user_id, book_title)
);

ALTER TABLE currently_reading ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_currently_reading" ON currently_reading;
CREATE POLICY "select_own_currently_reading" ON currently_reading FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_currently_reading" ON currently_reading;
CREATE POLICY "insert_own_currently_reading" ON currently_reading FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_currently_reading" ON currently_reading;
CREATE POLICY "update_own_currently_reading" ON currently_reading FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_currently_reading" ON currently_reading;
CREATE POLICY "delete_own_currently_reading" ON currently_reading FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
