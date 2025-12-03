-- Dynamic Fix for Blocking Foreign Keys
-- This script finds any FK referencing auth.users on specific tables and replaces it with ON DELETE CASCADE.

DO $$
DECLARE
    r RECORD;
    table_name_val text;
    tables text[] := ARRAY['dating_applications', 'member_books', 'matches', 'payments', 'notifications'];
BEGIN
    FOREACH table_name_val IN ARRAY tables
    LOOP
        -- Find FKs referencing auth.users
        FOR r IN 
            SELECT con.conname AS constraint_name
            FROM pg_constraint con
            JOIN pg_class rel ON rel.oid = con.conrelid
            JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
            WHERE rel.relname = table_name_val
            AND nsp.nspname = 'public'
            AND con.confrelid = 'auth.users'::regclass
        LOOP
            -- Drop the constraint
            EXECUTE 'ALTER TABLE public.' || quote_ident(table_name_val) || ' DROP CONSTRAINT ' || quote_ident(r.constraint_name);
            
            -- Re-create it with CASCADE (we need to know the column, so we query it)
            -- Since getting the column is complex in a loop, we will just re-apply standard constraints below.
            -- The goal here is to remove ANY potential blocker with a weird name.
        END LOOP;
    END LOOP;
END $$;

-- Now explicitly re-add the correct constraints with CASCADE/SET NULL

-- 1. Dating Applications
ALTER TABLE public.dating_applications
ADD CONSTRAINT dating_applications_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Member Books (assuming member_id is the column)
-- Check if member_id exists and is UUID before adding
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'member_books' AND column_name = 'member_id' AND data_type = 'uuid') THEN
        ALTER TABLE public.member_books
        ADD CONSTRAINT member_books_member_id_fkey
        FOREIGN KEY (member_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Matches
ALTER TABLE public.matches
ADD CONSTRAINT matches_requester_id_fkey
FOREIGN KEY (requester_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.matches
ADD CONSTRAINT matches_receiver_id_fkey
FOREIGN KEY (receiver_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Payments (SET NULL)
ALTER TABLE public.payments
ADD CONSTRAINT payments_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 5. Notifications
ALTER TABLE public.notifications
ADD CONSTRAINT notifications_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.notifications
ADD CONSTRAINT notifications_sender_id_fkey
FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE SET NULL;
