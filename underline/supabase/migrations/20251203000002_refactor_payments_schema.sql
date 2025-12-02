-- Refactor payments table to use member IDs instead of auth UUIDs
-- Rename user_id to send_user_id and add receive_user_id

-- 1. Drop existing RLS policy
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;

-- 2. Alter table structure
ALTER TABLE public.payments 
  DROP COLUMN user_id,
  ADD COLUMN send_user_id bigint REFERENCES public.member(id),
  ADD COLUMN receive_user_id bigint REFERENCES public.member(id);

-- 3. Create new RLS policy
-- Users can view payments where they are the sender or receiver
CREATE POLICY "Users can view their own payments"
  ON public.payments FOR SELECT
  USING (
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
