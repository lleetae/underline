-- Add legacy_auth_id to store the ID of deleted users
-- Make auth_id nullable to allow unlinking from auth.users

ALTER TABLE public.member 
ADD COLUMN IF NOT EXISTS legacy_auth_id TEXT;

ALTER TABLE public.member 
ALTER COLUMN auth_id DROP NOT NULL;

-- Index for looking up by legacy ID if needed
CREATE INDEX IF NOT EXISTS idx_member_legacy_auth_id ON public.member(legacy_auth_id);
