-- Fix Notifications Foreign Keys to allow User Deletion
-- The sender_id FK prevents auth.users from being deleted.
-- We need to change it to ON DELETE SET NULL.

-- 1. Drop existing FK on sender_id
ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS notifications_sender_id_fkey;

-- 2. Add new FK with ON DELETE SET NULL
ALTER TABLE notifications
ADD CONSTRAINT notifications_sender_id_fkey
FOREIGN KEY (sender_id)
REFERENCES auth.users(id)
ON DELETE SET NULL;

-- 3. Ensure user_id has ON DELETE CASCADE (it should, but reinforcing)
ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

ALTER TABLE notifications
ADD CONSTRAINT notifications_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;
