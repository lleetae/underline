-- Add letter field to matches table
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS letter TEXT;

-- Add check constraint for letter length (min 20 chars, max 1000 chars)
ALTER TABLE matches
ADD CONSTRAINT letter_length_check 
CHECK (letter IS NULL OR (length(letter) >= 20 AND length(letter) <= 1000));

-- Create index on letter for search performance (optional)
CREATE INDEX IF NOT EXISTS idx_matches_letter ON matches USING gin(to_tsvector('korean', letter));
