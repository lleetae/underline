-- Underline Database Security Setup
-- Run these SQL commands in Supabase SQL Editor

-- =====================================================
-- 1. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE member ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. RLS POLICIES FOR 'member' TABLE
-- =====================================================

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
ON member
FOR SELECT
USING (auth.uid() = id);

-- Policy: Users can view profiles in active matching period
-- (This will be enhanced with matching logic later)
CREATE POLICY "Users can view matching profiles"
ON member
FOR SELECT
USING (
  -- Allow viewing profiles during matching period
  -- TODO: Add date range check for Friday-Saturday matching window
  true
);

-- Policy: Users can update their own profile only
CREATE POLICY "Users can update own profile"
ON member
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy: Users can insert their own profile during signup
CREATE POLICY "Users can insert own profile"
ON member
FOR INSERT
WITH CHECK (auth.uid() = id);

-- =====================================================
-- 3. RLS POLICIES FOR 'books' TABLE
-- =====================================================

-- Policy: Anyone can view books (public reading list)
CREATE POLICY "Anyone can view books"
ON books
FOR SELECT
USING (true);

-- Policy: Users can insert their own books
CREATE POLICY "Users can insert own books"
ON books
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own books
CREATE POLICY "Users can update own books"
ON books
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own books
CREATE POLICY "Users can delete own books"
ON books
FOR DELETE
USING (auth.uid() = user_id);

-- =====================================================
-- 4. RLS POLICIES FOR 'matches' TABLE
-- =====================================================

-- Policy: Users can view matches they're involved in
CREATE POLICY "Users can view own matches"
ON matches
FOR SELECT
USING (
  auth.uid() = requester_id OR 
  auth.uid() = receiver_id
);

-- Policy: Users can create match requests
CREATE POLICY "Users can create match requests"
ON matches
FOR INSERT
WITH CHECK (auth.uid() = requester_id);

-- Policy: Receivers can update match status (accept/reject)
CREATE POLICY "Receivers can update match status"
ON matches
FOR UPDATE
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);

-- =====================================================
-- 5. RLS POLICIES FOR 'payments' TABLE
-- =====================================================

-- Policy: Users can view their own payments
CREATE POLICY "Users can view own payments"
ON payments
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Only service role can insert payments (server-side only)
-- This is enforced by not creating an INSERT policy for authenticated users
-- Payments are inserted via Edge Functions with service role key

-- =====================================================
-- 6. ENABLE PGCRYPTO FOR ENCRYPTION
-- =====================================================

-- Enable pgcrypto extension for AES encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- 7. KAKAO ID ENCRYPTION FUNCTIONS
-- =====================================================

-- Function to encrypt Kakao ID
CREATE OR REPLACE FUNCTION encrypt_kakao_id(kakao_id TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  encryption_key TEXT;
BEGIN
  -- Get encryption key from environment (set in Supabase Vault)
  -- For now, using a placeholder - REPLACE WITH VAULT SECRET
  encryption_key := 'YOUR_ENCRYPTION_KEY_HERE_32_CHARS';
  
  RETURN encode(
    pgp_sym_encrypt(
      kakao_id,
      encryption_key,
      'cipher-algo=aes256'
    ),
    'base64'
  );
END;
$$;

-- Function to decrypt Kakao ID
CREATE OR REPLACE FUNCTION decrypt_kakao_id(encrypted_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  encryption_key TEXT;
BEGIN
  -- Get encryption key from environment (set in Supabase Vault)
  encryption_key := 'YOUR_ENCRYPTION_KEY_HERE_32_CHARS';
  
  RETURN pgp_sym_decrypt(
    decode(encrypted_text, 'base64'),
    encryption_key,
    'cipher-algo=aes256'
  );
END;
$$;

-- =====================================================
-- 8. ALTER TABLE FOR ENCRYPTED KAKAO_ID
-- =====================================================

-- Note: This assumes kakao_id column already exists
-- If you want to store encrypted data, ensure the column is TEXT type

-- Add a comment to remind that kakao_id should be encrypted
COMMENT ON COLUMN member.kakao_id IS 'Encrypted using pgp_sym_encrypt - use decrypt_kakao_id() to read';

-- =====================================================
-- 9. SECURE KAKAO ID VIEW (Optional)
-- =====================================================

-- Create a view that only shows decrypted Kakao ID to authorized users
-- (after payment verification)
CREATE OR REPLACE VIEW member_contact_info AS
SELECT 
  m.id,
  m.nickname,
  CASE 
    -- Only show decrypted Kakao ID if user has paid for this match
    WHEN EXISTS (
      SELECT 1 FROM payments p
      WHERE p.match_id IN (
        SELECT match_id FROM matches
        WHERE (requester_id = auth.uid() AND receiver_id = m.id)
           OR (receiver_id = auth.uid() AND requester_id = m.id)
      )
      AND p.status = 'completed'
    ) THEN decrypt_kakao_id(m.kakao_id)
    ELSE '***Hidden***'
  END AS kakao_id
FROM member m;

-- =====================================================
-- 10. VERIFICATION QUERIES
-- =====================================================

-- Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('member', 'books', 'matches', 'payments');

-- List all policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Test encryption/decryption
-- SELECT encrypt_kakao_id('test_kakao_id');
-- SELECT decrypt_kakao_id(encrypt_kakao_id('test_kakao_id'));

-- =====================================================
-- NOTES & WARNINGS
-- =====================================================

/*
⚠️ IMPORTANT SECURITY NOTES:

1. ENCRYPTION KEY MANAGEMENT:
   - Replace 'YOUR_ENCRYPTION_KEY_HERE_32_CHARS' with actual secure key
   - Use Supabase Vault to store encryption keys securely
   - Never hardcode encryption keys in functions
   
2. ENCRYPTION KEY GENERATION:
   - Generate a strong 32-character key:
     openssl rand -base64 32
   
3. SUPABASE VAULT SETUP:
   - Go to Supabase Dashboard > Settings > Vault
   - Add secret: name='kakao_encryption_key', value='your_generated_key'
   - Update functions to use: current_setting('app.kakao_encryption_key', true)
   
4. MATCHING PERIOD POLICY:
   - Update "Users can view matching profiles" policy
   - Add date/time checks for Friday-Saturday matching window
   
5. TESTING:
   - Test all policies with different user accounts
   - Verify that unauthorized access is blocked
   - Test encryption/decryption before production
   
6. PERFORMANCE:
   - Consider indexing encrypted columns if needed
   - Monitor query performance with encryption overhead
*/
