-- Fix payments schema to match user expectation (user_id as UUID)

-- 1. Add user_id column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'user_id') THEN
        ALTER TABLE public.payments ADD COLUMN user_id uuid REFERENCES auth.users(id);
    END IF;
END $$;

-- 2. Make send_user_id and receive_user_id nullable (or we could drop them, but let's keep for safety for now)
ALTER TABLE public.payments ALTER COLUMN send_user_id DROP NOT NULL;
ALTER TABLE public.payments ALTER COLUMN receive_user_id DROP NOT NULL;

-- 3. Update RLS policy to include user_id
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;

CREATE POLICY "Users can view their own payments"
  ON public.payments FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM public.member 
      WHERE member.id = payments.send_user_id 
      AND member.auth_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.member 
      WHERE member.id = payments.receive_user_id 
      AND member.auth_id = auth.uid()
    )
  );
