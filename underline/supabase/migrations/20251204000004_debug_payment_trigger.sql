-- Create Debug Logs Table
CREATE TABLE IF NOT EXISTS debug_logs (
    id serial PRIMARY KEY,
    message text,
    details jsonb,
    created_at timestamptz DEFAULT now()
);

-- Update Payment Trigger with Logging
CREATE OR REPLACE FUNCTION handle_contact_revealed()
RETURNS TRIGGER AS $$
DECLARE
    match_req RECORD;
    sender_auth_id uuid;
    receiver_auth_id uuid;
    target_user_id uuid;
    notification_sender_id uuid;
BEGIN
    -- Log entry
    INSERT INTO debug_logs (message, details) 
    VALUES ('Trigger fired', jsonb_build_object('op', TG_OP, 'new_status', NEW.status, 'old_status', CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END));

    -- Check if payment is completed
    IF (TG_OP = 'INSERT' AND NEW.status = 'completed') OR 
       (TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed') THEN
        
        INSERT INTO debug_logs (message, details) VALUES ('Payment completed condition met', jsonb_build_object('match_id', NEW.match_id));

        -- Get match request details
        SELECT * INTO match_req
        FROM match_requests
        WHERE id = NEW.match_id;

        IF match_req IS NOT NULL THEN
            INSERT INTO debug_logs (message, details) VALUES ('Match request found', jsonb_build_object('sender_id', match_req.sender_id, 'receiver_id', match_req.receiver_id));

            -- Get auth_ids from member table
            SELECT auth_id INTO sender_auth_id FROM member WHERE id = match_req.sender_id;
            SELECT auth_id INTO receiver_auth_id FROM member WHERE id = match_req.receiver_id;

            INSERT INTO debug_logs (message, details) VALUES ('Auth IDs fetched', jsonb_build_object('sender_auth_id', sender_auth_id, 'receiver_auth_id', receiver_auth_id, 'payment_user_id', NEW.user_id));

            -- Determine who to notify
            IF NEW.user_id = sender_auth_id THEN
                target_user_id := receiver_auth_id;
                notification_sender_id := sender_auth_id;
            ELSIF NEW.user_id = receiver_auth_id THEN
                target_user_id := sender_auth_id;
                notification_sender_id := receiver_auth_id;
            ELSE
                INSERT INTO debug_logs (message, details) VALUES ('Payment user does not match sender or receiver', jsonb_build_object('payment_user_id', NEW.user_id));
            END IF;

            INSERT INTO debug_logs (message, details) VALUES ('Target determined', jsonb_build_object('target_user_id', target_user_id, 'notification_sender_id', notification_sender_id));

            -- Insert notification
            IF target_user_id IS NOT NULL AND notification_sender_id IS NOT NULL AND
               EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) AND
               EXISTS (SELECT 1 FROM auth.users WHERE id = notification_sender_id) THEN
                
                INSERT INTO notifications (user_id, type, sender_id, metadata)
                VALUES (target_user_id, 'contact_revealed', notification_sender_id, jsonb_build_object('match_id', NEW.match_id));
                
                INSERT INTO debug_logs (message, details) VALUES ('Notification inserted', NULL);
            ELSE
                INSERT INTO debug_logs (message, details) VALUES ('Validation failed', jsonb_build_object('target_exists', EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id), 'sender_exists', EXISTS (SELECT 1 FROM auth.users WHERE id = notification_sender_id)));
            END IF;
        ELSE
            INSERT INTO debug_logs (message, details) VALUES ('Match request NOT found', jsonb_build_object('match_id', NEW.match_id));
        END IF;
    ELSE
        INSERT INTO debug_logs (message, details) VALUES ('Condition NOT met', NULL);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
