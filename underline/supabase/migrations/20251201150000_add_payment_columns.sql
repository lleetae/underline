-- Add payment related columns to match_requests table
ALTER TABLE match_requests 
ADD COLUMN IF NOT EXISTS is_unlocked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payment_tid TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_match_requests_is_unlocked ON match_requests(is_unlocked);
