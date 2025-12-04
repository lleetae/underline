-- Setup Audit Logging for debugging payment deletions
-- This ensures we can track if payments are deleted or updated, and by what mechanism.

-- 1. Create Audit Log Table
CREATE TABLE IF NOT EXISTS public.debug_audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name text NOT NULL,
    operation text NOT NULL,
    old_data jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Trigger Functions

-- Function to log payment deletions
CREATE OR REPLACE FUNCTION log_payment_deletion()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.debug_audit_logs (table_name, operation, old_data)
    VALUES ('payments', 'DELETE', row_to_json(OLD));
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Function to log generic deletions (for member, match_requests)
CREATE OR REPLACE FUNCTION log_generic_deletion()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.debug_audit_logs (table_name, operation, old_data)
    VALUES (TG_TABLE_NAME, 'DELETE', row_to_json(OLD));
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Function to log payment updates (to confirm SET NULL works)
CREATE OR REPLACE FUNCTION log_payment_update()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.debug_audit_logs (table_name, operation, old_data)
    VALUES ('payments', 'UPDATE', row_to_json(OLD));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create Triggers

-- Trigger for Payment Deletion
DROP TRIGGER IF EXISTS audit_payment_delete ON public.payments;
CREATE TRIGGER audit_payment_delete
AFTER DELETE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION log_payment_deletion();

-- Trigger for Payment Update
DROP TRIGGER IF EXISTS audit_payment_update ON public.payments;
CREATE TRIGGER audit_payment_update
AFTER UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION log_payment_update();

-- Trigger for Match Request Deletion
DROP TRIGGER IF EXISTS audit_match_requests_delete ON public.match_requests;
CREATE TRIGGER audit_match_requests_delete
AFTER DELETE ON public.match_requests
FOR EACH ROW
EXECUTE FUNCTION log_generic_deletion();

-- Trigger for Member Deletion
DROP TRIGGER IF EXISTS audit_member_delete ON public.member;
CREATE TRIGGER audit_member_delete
AFTER DELETE ON public.member
FOR EACH ROW
EXECUTE FUNCTION log_generic_deletion();
