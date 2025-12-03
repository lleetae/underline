-- Add referrer_user_id to member table
ALTER TABLE member ADD COLUMN IF NOT EXISTS referrer_user_id UUID REFERENCES member(id);

-- Create region_match_status table
CREATE TABLE IF NOT EXISTS region_match_status (
    region_id TEXT PRIMARY KEY, -- e.g., 'Gangnam', 'Mapo'
    is_open BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure dating_applications has status column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dating_applications' AND column_name = 'status') THEN
        ALTER TABLE dating_applications ADD COLUMN status TEXT DEFAULT 'active'; -- 'active', 'cancelled', 'failed'
    END IF;
END $$;
