-- Drop the location column from the member and payments tables
ALTER TABLE member DROP COLUMN IF EXISTS location;
ALTER TABLE payments DROP COLUMN IF EXISTS location;
