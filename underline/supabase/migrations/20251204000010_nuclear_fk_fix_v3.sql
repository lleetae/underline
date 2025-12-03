-- Dynamic Fix for Blocking Foreign Keys (V3)
-- Fixed: Check for column existence before adding constraints

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
        END LOOP;
    END LOOP;
END $$;

-- Now explicitly re-add the correct constraints with CASCADE/SET NULL

-- 1. Dating Applications
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dating_applications' AND column_name = 'user_id') THEN
        ALTER TABLE public.dating_applications
        ADD CONSTRAINT dating_applications_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dating_applications' AND column_name = 'auth_id') THEN
        ALTER TABLE public.dating_applications
        ADD CONSTRAINT dating_applications_auth_id_fkey
        FOREIGN KEY (auth_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Member Books
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'member_books' AND column_name = 'member_id' AND data_type = 'uuid') THEN
        ALTER TABLE public.member_books
        ADD CONSTRAINT member_books_member_id_fkey
        FOREIGN KEY (member_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Matches
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'requester_id') THEN
        ALTER TABLE public.matches
        ADD CONSTRAINT matches_requester_id_fkey
        FOREIGN KEY (requester_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'receiver_id') THEN
        ALTER TABLE public.matches
        ADD CONSTRAINT matches_receiver_id_fkey
        FOREIGN KEY (receiver_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. Payments (SET NULL)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'user_id') THEN
        ALTER TABLE public.payments
        ADD CONSTRAINT payments_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 5. Notifications
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'user_id') THEN
        ALTER TABLE public.notifications
        ADD CONSTRAINT notifications_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'sender_id') THEN
        ALTER TABLE public.notifications
        ADD CONSTRAINT notifications_sender_id_fkey
        FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;
