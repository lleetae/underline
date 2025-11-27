-- Add columns for Blur/Unveil system
-- photo_urls_original: Stores paths to original photos in private bucket
-- photo_urls_blurred: Stores public URLs of blurred photos (redundant with 'photos' but good for clarity)

ALTER TABLE public.member
ADD COLUMN IF NOT EXISTS photo_urls_original TEXT[],
ADD COLUMN IF NOT EXISTS photo_urls_blurred TEXT[];

-- Comment on columns
COMMENT ON COLUMN public.member.photo_urls_original IS 'Paths to original photos in private bucket (profile-photos-original)';
COMMENT ON COLUMN public.member.photo_urls_blurred IS 'Public URLs of blurred photos in public bucket (profile-photos-blurred)';
