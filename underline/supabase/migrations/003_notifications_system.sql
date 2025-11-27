-- =====================================================
-- NOTIFICATION SYSTEM SCHEMA
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('match_request', 'match_accepted', 'contact_revealed')),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES member(id),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

-- =====================================================
-- NOTIFICATION FUNCTIONS
-- =====================================================

-- Function to create notifications
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_match_id UUID,
  p_sender_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, match_id, sender_id, metadata)
  VALUES (p_user_id, p_type, p_match_id, p_sender_id, p_metadata)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- =====================================================
-- NOTIFICATION TRIGGERS
-- =====================================================

-- Trigger function: Notify on match request
CREATE OR REPLACE FUNCTION trigger_match_request_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create notification for receiver
  PERFORM create_notification(
    NEW.receiver_id,
    'match_request',
    NEW.id,
    NEW.requester_id
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for match requests
DROP TRIGGER IF EXISTS on_match_request_created ON matches;
CREATE TRIGGER on_match_request_created
AFTER INSERT ON matches
FOR EACH ROW
EXECUTE FUNCTION trigger_match_request_notification();

-- Trigger function: Notify on match accepted
CREATE OR REPLACE FUNCTION trigger_match_accepted_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only notify if status changed to 'accepted'
  IF OLD.status != 'accepted' AND NEW.status = 'accepted' THEN
    PERFORM create_notification(
      NEW.requester_id,
      'match_accepted',
      NEW.id,
      NEW.receiver_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for match acceptance
DROP TRIGGER IF EXISTS on_match_accepted ON matches;
CREATE TRIGGER on_match_accepted
AFTER UPDATE ON matches
FOR EACH ROW
EXECUTE FUNCTION trigger_match_accepted_notification();

-- Trigger function: Notify on contact revealed (payment completed)
CREATE OR REPLACE FUNCTION trigger_contact_revealed_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  other_user_id UUID;
BEGIN
  -- When payment is completed, notify the other user
  IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
    -- Determine the other user in the match
    SELECT CASE
      WHEN m.requester_id = NEW.user_id THEN m.receiver_id
      ELSE m.requester_id
    END INTO other_user_id
    FROM matches m
    WHERE m.id = NEW.match_id;
    
    IF other_user_id IS NOT NULL THEN
      PERFORM create_notification(
        other_user_id,
        'contact_revealed',
        NEW.match_id,
        NEW.user_id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for payment completion
DROP TRIGGER IF EXISTS on_payment_completed ON payments;
CREATE TRIGGER on_payment_completed
AFTER UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION trigger_contact_revealed_notification();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if notifications table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'notifications'
);

-- Check RLS policies
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'notifications';

-- Check triggers
SELECT tgname, tgtype, tgenabled
FROM pg_trigger
WHERE tgrelid = 'matches'::regclass OR tgrelid = 'payments'::regclass;
