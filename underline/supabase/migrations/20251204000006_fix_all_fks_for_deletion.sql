-- Comprehensive Fix for User Deletion (FK Constraints)

-- 1. Payments Table (Reinforce)
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_user_id_fkey;
ALTER TABLE public.payments
  ADD CONSTRAINT payments_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;

-- 2. Notifications Table (Reinforce)
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_sender_id_fkey;
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_sender_id_fkey
  FOREIGN KEY (sender_id)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- 3. Matches Table (If it exists and references auth.users)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'matches') THEN
        -- Check if requester_id references auth.users
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'requester_id') THEN
            ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS fk_requester;
            ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_requester_id_fkey;
            ALTER TABLE public.matches
              ADD CONSTRAINT matches_requester_id_fkey
              FOREIGN KEY (requester_id)
              REFERENCES auth.users(id)
              ON DELETE CASCADE;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'receiver_id') THEN
            ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS fk_receiver;
            ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_receiver_id_fkey;
            ALTER TABLE public.matches
              ADD CONSTRAINT matches_receiver_id_fkey
              FOREIGN KEY (receiver_id)
              REFERENCES auth.users(id)
              ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- 4. Dating Applications (If it references auth.users)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dating_applications') THEN
        -- Check for user_id column
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dating_applications' AND column_name = 'user_id') THEN
            ALTER TABLE public.dating_applications DROP CONSTRAINT IF EXISTS dating_applications_user_id_fkey;
            ALTER TABLE public.dating_applications
              ADD CONSTRAINT dating_applications_user_id_fkey
              FOREIGN KEY (user_id)
              REFERENCES auth.users(id)
              ON DELETE CASCADE;
        END IF;
        
        -- Check for auth_id column
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dating_applications' AND column_name = 'auth_id') THEN
            ALTER TABLE public.dating_applications DROP CONSTRAINT IF EXISTS dating_applications_auth_id_fkey;
            ALTER TABLE public.dating_applications
              ADD CONSTRAINT dating_applications_auth_id_fkey
              FOREIGN KEY (auth_id)
              REFERENCES auth.users(id)
              ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- 5. Member Table (Reinforce auth_id)
ALTER TABLE public.member DROP CONSTRAINT IF EXISTS member_auth_id_fkey;
ALTER TABLE public.member
  ADD CONSTRAINT member_auth_id_fkey
  FOREIGN KEY (auth_id)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;
