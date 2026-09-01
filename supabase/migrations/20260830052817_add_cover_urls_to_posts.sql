/*
# Add cover_urls JSON column to posts

1. Modified Tables
- `posts`: add `cover_urls` column (jsonb, nullable) to store the full array of
  cover image URLs (high-res fallbacks) instead of just a single low-res thumbnail.
  The existing `cover_url` column is kept for backwards compatibility.
2. Security
- No RLS policy changes. The column is readable/writable by the same owner-scoped
  policies already in place.
*/

ALTER TABLE posts
ADD COLUMN IF NOT EXISTS cover_urls jsonb;
