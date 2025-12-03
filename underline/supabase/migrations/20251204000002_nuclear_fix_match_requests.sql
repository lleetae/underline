-- Nuclear Fix for match_requests
-- Drops ALL triggers and policies to ensure no lingering bad configurations exist.

-- 1. Drop ALL User Triggers on match_requests
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT tgname 
        FROM pg_trigger 
        WHERE tgrelid = 'match_requests'::regclass 
        AND tgisinternal = false -- ONLY drop user triggers
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS "' || r.tgname || '" ON match_requests';
    END LOOP;
END $$;

-- 2. Drop ALL Policies on match_requests
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'match_requests'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON match_requests';
    END LOOP;
END $$;

-- 3. Re-create Trigger Function (Hardened)
CREATE OR REPLACE FUNCTION handle_match_accepted()
RETURNS TRIGGER AS $$
DECLARE
    sender_auth_id uuid;
    receiver_auth_id uuid;
BEGIN
    -- Only run if status changed to 'accepted'
    IF OLD.status != 'accepted' AND NEW.status = 'accepted' THEN
        
        -- Get auth_id for sender (who sent the request)
        -- Explicitly cast NEW.sender_id to bigint if needed, though it should be bigint
        SELECT auth_id INTO sender_auth_id
        FROM member
        WHERE id = NEW.sender_id;

        -- Get auth_id for receiver (who accepted)
        SELECT auth_id INTO receiver_auth_id
        FROM member
        WHERE id = NEW.receiver_id;

        -- Notify the sender that their request was accepted
        -- Check if both users exist in auth.users to avoid FK violation
        IF sender_auth_id IS NOT NULL AND receiver_auth_id IS NOT NULL AND
           EXISTS (SELECT 1 FROM auth.users WHERE id = sender_auth_id) AND
           EXISTS (SELECT 1 FROM auth.users WHERE id = receiver_auth_id) THEN
            
            INSERT INTO notifications (user_id, type, sender_id, metadata)
            VALUES (sender_auth_id, 'match_accepted', receiver_auth_id, jsonb_build_object('match_id', NEW.id));
            
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Re-create Trigger
CREATE TRIGGER on_match_accepted
AFTER UPDATE ON match_requests
FOR EACH ROW EXECUTE FUNCTION handle_match_accepted();

-- 5. Re-create RLS Policies (Corrected Types)
ALTER TABLE match_requests ENABLE ROW LEVEL SECURITY;

-- View: Users can view requests they sent or received
CREATE POLICY "Users can view own match requests"
ON match_requests FOR SELECT
USING (
  auth.uid() IN (
    SELECT auth_id FROM member 
    WHERE id = sender_id OR id = receiver_id
  )
);

-- Insert: Users can create requests where they are the sender
CREATE POLICY "Users can create match requests"
ON match_requests FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT auth_id FROM member 
    WHERE id = sender_id
  )
);

-- Update: Receivers can update status (accept/reject)
CREATE POLICY "Receivers can update match status"
ON match_requests FOR UPDATE
USING (
  auth.uid() IN (
    SELECT auth_id FROM member 
    WHERE id = receiver_id
  )
);
