-- Final Fix for Withdrawal Foreign Keys
-- Explicitly handles notifications, payments, and storage to ensure auth.users can be deleted.

DO $$
DECLARE
    r RECORD;
BEGIN
    -- 1. Notifications: sender_id -> SET NULL
    -- The sender_id references auth.users(id). If a user is deleted, we want to keep the notification but clear the sender.
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'sender_id') THEN
        -- Drop existing FKs on sender_id
        FOR r IN SELECT constraint_name FROM information_schema.table_constraints 
                 WHERE table_name = 'notifications' AND constraint_type = 'FOREIGN KEY'
        LOOP
            -- Check if this constraint uses sender_id (by looking at kcu)
            IF EXISTS (SELECT 1 FROM information_schema.key_column_usage 
                       WHERE constraint_name = r.constraint_name AND column_name = 'sender_id') THEN
                EXECUTE 'ALTER TABLE notifications DROP CONSTRAINT ' || quote_ident(r.constraint_name);
            END IF;
        END LOOP;
        
        -- Add correct FK
        ALTER TABLE notifications ADD CONSTRAINT notifications_sender_id_fkey 
        FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;

    -- 2. Payments: user_id -> SET NULL
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
         -- Drop existing FKs on user_id
        FOR r IN SELECT constraint_name FROM information_schema.table_constraints 
                 WHERE table_name = 'payments' AND constraint_type = 'FOREIGN KEY'
        LOOP
             IF EXISTS (SELECT 1 FROM information_schema.key_column_usage 
                       WHERE constraint_name = r.constraint_name AND column_name = 'user_id') THEN
                EXECUTE 'ALTER TABLE payments DROP CONSTRAINT ' || quote_ident(r.constraint_name);
            END IF;
        END LOOP;

        ALTER TABLE payments ADD CONSTRAINT payments_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;

    -- 3. Payment History (if exists): user_id -> SET NULL
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_history') THEN
         -- Drop existing FKs on user_id
        FOR r IN SELECT constraint_name FROM information_schema.table_constraints 
                 WHERE table_name = 'payment_history' AND constraint_type = 'FOREIGN KEY'
        LOOP
             IF EXISTS (SELECT 1 FROM information_schema.key_column_usage 
                       WHERE constraint_name = r.constraint_name AND column_name = 'user_id') THEN
                EXECUTE 'ALTER TABLE payment_history DROP CONSTRAINT ' || quote_ident(r.constraint_name);
            END IF;
        END LOOP;

        ALTER TABLE payment_history ADD CONSTRAINT payment_history_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;

    -- 4. Storage Objects: owner -> CASCADE
    -- If user is deleted, their files should be deleted (or set null, but cascade is cleaner for storage)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
        FOR r IN SELECT constraint_name FROM information_schema.table_constraints 
                 WHERE table_schema = 'storage' AND table_name = 'objects' AND constraint_type = 'FOREIGN KEY'
        LOOP
             IF EXISTS (SELECT 1 FROM information_schema.key_column_usage 
                       WHERE constraint_name = r.constraint_name AND column_name = 'owner') THEN
                EXECUTE 'ALTER TABLE storage.objects DROP CONSTRAINT ' || quote_ident(r.constraint_name);
            END IF;
        END LOOP;

        ALTER TABLE storage.objects ADD CONSTRAINT objects_owner_fkey 
        FOREIGN KEY (owner) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

END $$;
