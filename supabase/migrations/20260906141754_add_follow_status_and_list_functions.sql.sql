/*
# Add follow request status and follow list functions

## Changes

### 1. follows table: add `status` column
- Adds `status text NOT NULL DEFAULT 'accepted'` to the `follows` table.
- Existing follows remain 'accepted' (backward compatible).
- New follows can be 'pending' (awaiting approval) or 'accepted' (approved).
- Adds an index on (follower_id, status) and (following_id, status) for efficient queries.

### 2. New RPC: accept_follow_request(follower_id uuid)
- Called by the user who received a follow request.
- Updates the follow row from 'pending' to 'accepted'.
- Returns the updated row.

### 3. New RPC: reject_follow_request(follower_id uuid)
- Called by the user who received a follow request.
- Deletes the pending follow row.
- Returns success boolean.

### 4. New RPC: get_following_list(target_user_id uuid)
- Returns list of users that target_user_id is following.
- Only returns accepted follows.
- Returns id, full_name, avatar_url for each followed user.

### 5. New RPC: get_follower_list(target_user_id uuid)
- Returns list of users following target_user_id.
- Returns both pending and accepted follows (with status field).
- Returns id, full_name, avatar_url, status for each follower.

### 6. New RPC: get_pending_follow_requests()
- Returns list of pending follow requests for the current user.
- Returns follower_id, full_name, avatar_url for each requester.

### 7. New RPC: check_mutual_follow(other_user_id uuid)
- Returns true if both users follow each other (accepted status).
- Used to gate recommendation sending.

### 8. Update get_follow_counts to count only accepted follows
- follower_count and following_count now only count 'accepted' status.

### 9. RLS policy update for follows
- UPDATE policy: allow following user to update their own follow row (for status changes via RPC).
- Add UPDATE policy for follows table.

## Security
- All RPCs use auth.uid() for authorization.
- accept_follow_request/reject_follow_request: only the following_id (target) can accept/reject.
- get_following_list/get_follower_list: any authenticated user can query (profiles are public).
- check_mutual_follow: uses auth.uid() internally.
- get_pending_follow_requests: only returns requests for the current user.
*/

-- Add status column to follows table
ALTER TABLE follows ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'accepted';

-- Add indexes for efficient status-based queries
CREATE INDEX IF NOT EXISTS idx_follows_follower_status ON follows(follower_id, status);
CREATE INDEX IF NOT EXISTS idx_follows_following_status ON follows(following_id, status);

-- Add UPDATE policy for follows (needed for accept/reject via RPC)
DROP POLICY IF EXISTS "update_own_follow" ON follows;
CREATE POLICY "update_own_follow" ON follows FOR UPDATE
  TO authenticated USING (auth.uid() = following_id) WITH CHECK (auth.uid() = following_id);

-- Accept follow request: called by the person who was followed (following_id)
CREATE OR REPLACE FUNCTION accept_follow_request(follower_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE follows
  SET status = 'accepted'
  WHERE follows.follower_id = accept_follow_request.follower_id
    AND follows.following_id = auth.uid()
    AND follows.status = 'pending';
END;
$$;

-- Reject follow request: called by the person who was followed (following_id)
CREATE OR REPLACE FUNCTION reject_follow_request(follower_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM follows
  WHERE follows.follower_id = reject_follow_request.follower_id
    AND follows.following_id = auth.uid()
    AND follows.status = 'pending';
END;
$$;

-- Get following list: users that target_user_id follows (accepted only)
CREATE OR REPLACE FUNCTION get_following_list(target_user_id uuid)
RETURNS TABLE(id uuid, full_name text, avatar_url text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.full_name, p.avatar_url
  FROM follows f
  JOIN profiles p ON p.id = f.following_id
  WHERE f.follower_id = target_user_id AND f.status = 'accepted';
END;
$$;

-- Get follower list: users following target_user_id (both pending and accepted)
CREATE OR REPLACE FUNCTION get_follower_list(target_user_id uuid)
RETURNS TABLE(id uuid, full_name text, avatar_url text, status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.full_name, p.avatar_url, f.status
  FROM follows f
  JOIN profiles p ON p.id = f.follower_id
  WHERE f.following_id = target_user_id;
END;
$$;

-- Get pending follow requests for current user
CREATE OR REPLACE FUNCTION get_pending_follow_requests()
RETURNS TABLE(follower_id uuid, full_name text, avatar_url text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT f.follower_id, p.full_name, p.avatar_url
  FROM follows f
  JOIN profiles p ON p.id = f.follower_id
  WHERE f.following_id = auth.uid() AND f.status = 'pending';
END;
$$;

-- Check mutual follow (both accepted)
CREATE OR REPLACE FUNCTION check_mutual_follow(other_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mutual boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM follows f1
    WHERE f1.follower_id = auth.uid()
      AND f1.following_id = other_user_id
      AND f1.status = 'accepted'
  ) AND EXISTS(
    SELECT 1 FROM follows f2
    WHERE f2.follower_id = other_user_id
      AND f2.following_id = auth.uid()
      AND f2.status = 'accepted'
  ) INTO mutual;
  RETURN mutual;
END;
$$;

-- Update get_follow_counts to only count accepted follows
CREATE OR REPLACE FUNCTION get_follow_counts(target_user_id uuid)
RETURNS TABLE(follower_count bigint, following_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT count(*) FROM follows WHERE following_id = target_user_id AND status = 'accepted'),
    (SELECT count(*) FROM follows WHERE follower_id = target_user_id AND status = 'accepted');
END;
$$;

-- Grant execute on new functions
GRANT EXECUTE ON FUNCTION accept_follow_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_follow_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_following_list(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_follower_list(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_follow_requests() TO authenticated;
GRANT EXECUTE ON FUNCTION check_mutual_follow(uuid) TO authenticated;
