-- Fix handle_new_match_request trigger
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
    IF sender_auth_id IS NOT NULL AND receiver_auth_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, sender_id, metadata)
        VALUES (receiver_auth_id, 'match_request', sender_auth_id, jsonb_build_object('match_id', NEW.id));
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for Match Accepted
CREATE OR REPLACE FUNCTION handle_match_accepted()
RETURNS TRIGGER AS $$
DECLARE
    sender_auth_id uuid;
    receiver_auth_id uuid;
BEGIN
    IF OLD.status != 'accepted' AND NEW.status = 'accepted' THEN
        -- Get auth_id for sender (who sent the request)
        SELECT auth_id INTO sender_auth_id
        FROM member
        WHERE id = NEW.sender_id;

        -- Get auth_id for receiver (who accepted)
        SELECT auth_id INTO receiver_auth_id
        FROM member
        WHERE id = NEW.receiver_id;

        -- Notify the sender that their request was accepted
        IF sender_auth_id IS NOT NULL AND receiver_auth_id IS NOT NULL THEN
            INSERT INTO notifications (user_id, type, sender_id, metadata)
            VALUES (sender_auth_id, 'match_accepted', receiver_auth_id, jsonb_build_object('match_id', NEW.id));
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_match_accepted ON match_requests;
CREATE TRIGGER on_match_accepted
AFTER UPDATE ON match_requests
FOR EACH ROW EXECUTE FUNCTION handle_match_accepted();


-- Trigger for Contact Revealed (Payment)
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
            -- Get auth_ids
            SELECT auth_id INTO sender_auth_id FROM member WHERE id = match_req.sender_id;
            SELECT auth_id INTO receiver_auth_id FROM member WHERE id = match_req.receiver_id;

            -- Determine who to notify
            IF NEW.user_id = sender_auth_id THEN
                target_user_id := receiver_auth_id;
                notification_sender_id := sender_auth_id;
            ELSIF NEW.user_id = receiver_auth_id THEN
                target_user_id := sender_auth_id;
                notification_sender_id := receiver_auth_id;
            END IF;

            -- Insert notification
            IF target_user_id IS NOT NULL AND notification_sender_id IS NOT NULL THEN
                INSERT INTO notifications (user_id, type, sender_id, metadata)
                VALUES (target_user_id, 'contact_revealed', notification_sender_id, jsonb_build_object('match_id', NEW.match_id));
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_payment_completed ON payments;
CREATE TRIGGER on_payment_completed
AFTER INSERT OR UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION handle_contact_revealed();
