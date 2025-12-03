-- Add reward columns to member table
ALTER TABLE member 
ADD COLUMN IF NOT EXISTS free_reveals_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS has_welcome_coupon BOOLEAN DEFAULT FALSE;

-- Create function to handle referral rewards
CREATE OR REPLACE FUNCTION handle_new_member_referral()
RETURNS TRIGGER AS $$
BEGIN
  -- If the new member has a referrer
  IF NEW.referrer_user_id IS NOT NULL THEN
    -- 1. Grant 50% discount coupon to the new member (invitee)
    NEW.has_welcome_coupon := TRUE;

    -- 2. Grant 1 free reveal to the referrer (inviter)
    UPDATE member
    SET free_reveals_count = free_reveals_count + 1
    WHERE id = NEW.referrer_user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to run before insert (to set has_welcome_coupon) or after insert (to update referrer)
-- Since we want to update the NEW row for has_welcome_coupon, BEFORE INSERT is better.
-- But we also want to update the referrer. We can do both in BEFORE INSERT.

DROP TRIGGER IF EXISTS on_member_created_referral ON member;

CREATE TRIGGER on_member_created_referral
BEFORE INSERT ON member
FOR EACH ROW
EXECUTE FUNCTION handle_new_member_referral();
