/*
# Create reading_notes table

## Purpose
Users can write quick sticky-note style memos while reading a book,
before or after saving it to their library. These notes are fed to the
AI book chat to generate deeper, personalized questions.

## New Table: reading_notes
- id (uuid, primary key)
- user_id (uuid, NOT NULL, defaults to auth.uid(), references auth.users)
- book_title (text, NOT NULL) — identifies the book by title
- book_author (text, nullable) — optional author name
- content (text, NOT NULL) — the memo content
- note_type (text, NOT NULL DEFAULT 'thought') — one of: 'quote', 'question', 'thought', 'puzzle'
- created_at (timestamptz, DEFAULT now())

## Indexes
- idx_reading_notes_user_book on (user_id, book_title) — fetch notes for a book
- idx_reading_notes_created on (user_id, created_at DESC) — recent notes

## Security (RLS)
- SELECT: owner only (auth.uid() = user_id)
- INSERT: owner only, user_id defaults to auth.uid()
- UPDATE: owner only
- DELETE: owner only
*/

CREATE TABLE IF NOT EXISTS reading_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  book_title text NOT NULL,
  book_author text,
  content text NOT NULL,
  note_type text NOT NULL DEFAULT 'thought',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reading_notes ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_reading_notes_user_book ON reading_notes(user_id, book_title);
CREATE INDEX IF NOT EXISTS idx_reading_notes_created ON reading_notes(user_id, created_at DESC);

DROP POLICY IF EXISTS "select_own_reading_notes" ON reading_notes;
CREATE POLICY "select_own_reading_notes" ON reading_notes FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_reading_notes" ON reading_notes;
CREATE POLICY "insert_own_reading_notes" ON reading_notes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_reading_notes" ON reading_notes;
CREATE POLICY "update_own_reading_notes" ON reading_notes FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_reading_notes" ON reading_notes;
CREATE POLICY "delete_own_reading_notes" ON reading_notes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
