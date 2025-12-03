-- Fix Payment Notification Trigger
-- Drops and recreates the trigger to ensure it exists and has the correct logic.

-- 1. Drop existing trigger and function
DROP TRIGGER IF EXISTS on_payment_completed ON payments;
DROP FUNCTION IF EXISTS handle_contact_revealed();

-- 2. Re-create Trigger Function (Hardened)
CREATE OR REPLACE FUNCTION handle_contact_revealed()
RETURNS TRIGGER AS $$
DECLARE
    match_req RECORD;
    sender_auth_id uuid;
    receiver_auth_id uuid;
    target_user_id uuid;
    notification_sender_id uuid;
BEGIN
    -- Check if payment is completed
    IF (TG_OP = 'INSERT' AND NEW.status = 'completed') OR 
       (TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed') THEN
        
        -- Get match request details
        SELECT * INTO match_req
        FROM match_requests
        WHERE id = NEW.match_id;

        IF match_req IS NOT NULL THEN
            -- Get auth_ids from member table
            SELECT auth_id INTO sender_auth_id FROM member WHERE id = match_req.sender_id;
            SELECT auth_id INTO receiver_auth_id FROM member WHERE id = match_req.receiver_id;

            -- Determine who to notify
            -- The person who PAID (NEW.user_id) is the one revealing the contact.
            -- We want to notify the OTHER person.
            
            -- Note: NEW.user_id in payments table is an AUTH_ID (UUID)
            
            IF NEW.user_id = sender_auth_id THEN
                target_user_id := receiver_auth_id;
                notification_sender_id := sender_auth_id;
            ELSIF NEW.user_id = receiver_auth_id THEN
                target_user_id := sender_auth_id;
                notification_sender_id := receiver_auth_id;
            END IF;

            -- Insert notification
            -- Check if both users exist in auth.users to avoid FK violation
            IF target_user_id IS NOT NULL AND notification_sender_id IS NOT NULL AND
               EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) AND
               EXISTS (SELECT 1 FROM auth.users WHERE id = notification_sender_id) THEN
                
                INSERT INTO notifications (user_id, type, sender_id, metadata)
                VALUES (target_user_id, 'contact_revealed', notification_sender_id, jsonb_build_object('match_id', NEW.match_id));
                
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-create Trigger
CREATE TRIGGER on_payment_completed
AFTER INSERT OR UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION handle_contact_revealed();
