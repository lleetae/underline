-- Add sido and sigungu columns to member table
ALTER TABLE member ADD COLUMN IF NOT EXISTS sido VARCHAR(50);
ALTER TABLE member ADD COLUMN IF NOT EXISTS sigungu VARCHAR(50);

-- Migrate existing data from location column
-- Assumes location format is "City District" (e.g., "서울특별시 강남구")
UPDATE member
SET
  sido = split_part(location, ' ', 1),
  sigungu = split_part(location, ' ', 2)
WHERE location IS NOT NULL AND location != '';
