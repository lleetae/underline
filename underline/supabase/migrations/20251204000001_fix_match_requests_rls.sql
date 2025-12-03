-- Fix RLS policies for match_requests table
-- The issue is likely a type mismatch between auth.uid() (UUID) and sender_id/receiver_id (BigInt)

-- Enable RLS
ALTER TABLE match_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (guessing common names to be safe)
DROP POLICY IF EXISTS "Users can view own match requests" ON match_requests;
DROP POLICY IF EXISTS "Users can create match requests" ON match_requests;
DROP POLICY IF EXISTS "Receivers can update match status" ON match_requests;
DROP POLICY IF EXISTS "Users can update own match requests" ON match_requests;
DROP POLICY IF EXISTS "Enable read access for all users" ON match_requests;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON match_requests;
DROP POLICY IF EXISTS "Enable update for users based on email" ON match_requests;

-- Create new correct policies

-- 1. View: Users can view requests they sent or received
CREATE POLICY "Users can view own match requests"
ON match_requests FOR SELECT
USING (
  auth.uid() IN (
    SELECT auth_id FROM member 
    WHERE id = sender_id OR id = receiver_id
  )
);

-- 2. Insert: Users can create requests where they are the sender
CREATE POLICY "Users can create match requests"
ON match_requests FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT auth_id FROM member 
    WHERE id = sender_id
  )
);

-- 3. Update: Receivers can update status (accept/reject)
-- Note: Senders might need to update to cancel? For now, focus on receiver flow.
CREATE POLICY "Receivers can update match status"
ON match_requests FOR UPDATE
USING (
  auth.uid() IN (
    SELECT auth_id FROM member 
    WHERE id = receiver_id
  )
);
