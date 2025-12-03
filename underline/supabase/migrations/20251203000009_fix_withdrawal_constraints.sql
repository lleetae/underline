-- Fix Withdrawal Constraints (Comprehensive)

-- 1. Drop FK on member.auth_id (Blocking deletion of auth.users)
-- We use a robust query to find ANY foreign key on the 'auth_id' column of 'member' table
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT kcu.constraint_name 
             FROM information_schema.key_column_usage kcu
             JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
             WHERE kcu.table_name = 'member' 
             AND kcu.column_name = 'auth_id'
             AND tc.constraint_type = 'FOREIGN KEY'
    LOOP
        EXECUTE 'ALTER TABLE public.member DROP CONSTRAINT ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;

-- 2. Ensure payments.user_id is ON DELETE SET NULL (To prevent blocking or unwanted cascade)
ALTER TABLE public.payments ALTER COLUMN user_id DROP NOT NULL;

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop existing FK on user_id
    FOR r IN SELECT constraint_name 
             FROM information_schema.table_constraints 
             WHERE table_name = 'payments' AND constraint_type = 'FOREIGN KEY'
             AND constraint_name LIKE '%user_id%'
    LOOP
        EXECUTE 'ALTER TABLE public.payments DROP CONSTRAINT ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;

-- Recreate with SET NULL
ALTER TABLE public.payments
  ADD CONSTRAINT payments_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;
