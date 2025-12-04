-- Fix missing match_request trigger

-- 1. Ensure the function exists (it should, but let's be safe)
CREATE OR REPLACE FUNCTION handle_new_match_request()
RETURNS TRIGGER AS $$
DECLARE
    sender_auth_id uuid;
    receiver_auth_id uuid;
BEGIN
    -- Get auth_id for sender
    SELECT auth_id INTO sender_auth_id
    FROM member
    WHERE id = NEW.sender_id;

    -- Get auth_id for receiver
    SELECT auth_id INTO receiver_auth_id
    FROM member
    WHERE id = NEW.receiver_id;

    -- Insert notification
    IF sender_auth_id IS NOT NULL AND receiver_auth_id IS NOT NULL AND
       EXISTS (SELECT 1 FROM auth.users WHERE id = sender_auth_id) AND
       EXISTS (SELECT 1 FROM auth.users WHERE id = receiver_auth_id) THEN
        INSERT INTO notifications (user_id, type, sender_id, metadata)
        VALUES (receiver_auth_id, 'match_request', sender_auth_id, jsonb_build_object('match_id', NEW.id));
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger (This was missing!)
DROP TRIGGER IF EXISTS on_match_request_created ON match_requests;
CREATE TRIGGER on_match_request_created
AFTER INSERT ON match_requests
FOR EACH ROW EXECUTE FUNCTION handle_new_match_request();
