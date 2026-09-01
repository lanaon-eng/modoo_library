/*
# Add default to posts.user_id

## Summary
- The posts table's user_id column has no default. Without DEFAULT auth.uid(),
  a client insert like `.insert({ book_title })` would leave user_id null,
  failing the WITH CHECK (auth.uid() = user_id) policy.
- This migration sets the default to auth.uid() so inserts succeed automatically.

## Tables
- posts (existing)
  - user_id: altered to add DEFAULT auth.uid()
*/

ALTER TABLE posts
  ALTER COLUMN user_id SET DEFAULT auth.uid();
