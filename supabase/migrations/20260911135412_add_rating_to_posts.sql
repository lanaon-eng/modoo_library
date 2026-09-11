/*
# Add rating column to posts table

1. Changes
- Add `rating` (int2, nullable) to `posts` — user's star rating (1-5) for the book, set during card preview step.

2. Security
- No policy changes needed: existing RLS policies on `posts` already cover the new column since it's user-writable through INSERT/UPDATE.
*/

ALTER TABLE posts ADD COLUMN IF NOT EXISTS rating int2;
