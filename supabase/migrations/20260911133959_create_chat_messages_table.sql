/*
# Create chat_messages table for persistent AI book chat history

1. New Tables
- `chat_messages`
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to auth.uid(), references auth.users)
  - `book_title` (text, not null) — the book being discussed
  - `role` (text, not null) — 'user' or 'character' (AI)
  - `content` (text, not null) — the message text
  - `created_at` (timestamptz, defaults to now())
  - `category` (text, nullable) — the subject category selected for the chat

2. Security
- Enable RLS on `chat_messages`.
- Owner-scoped CRUD: each authenticated user can only access their own chat messages.
- 4 separate policies (SELECT, INSERT, UPDATE, DELETE), all scoped to `auth.uid() = user_id`.

3. Indexes
- `chat_messages_user_book_idx` on (user_id, book_title, created_at) for efficient lookup of a user's chat history for a specific book.

4. Notes
- This table stores all AI book chat messages so users can resume conversations across sessions.
- The AI persona edge function will receive prior messages as context to give better, more personalized reading advice over time.
- Users can delete their chat history for a specific book.
*/

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  book_title text NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'character')),
  content text NOT NULL,
  category text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_chat_messages" ON chat_messages;
CREATE POLICY "select_own_chat_messages" ON chat_messages FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_chat_messages" ON chat_messages;
CREATE POLICY "insert_own_chat_messages" ON chat_messages FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_chat_messages" ON chat_messages;
CREATE POLICY "update_own_chat_messages" ON chat_messages FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_chat_messages" ON chat_messages;
CREATE POLICY "delete_own_chat_messages" ON chat_messages FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS chat_messages_user_book_idx ON chat_messages (user_id, book_title, created_at);
