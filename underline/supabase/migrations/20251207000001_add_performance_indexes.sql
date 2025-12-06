-- Indexes for Member table (Filtering by location and gender)
CREATE INDEX IF NOT EXISTS idx_member_location ON member(sido, sigungu);
CREATE INDEX IF NOT EXISTS idx_member_gender ON member(gender);
CREATE INDEX IF NOT EXISTS idx_member_auth_id ON member(auth_id);

-- Indexes for Dating Applications (Filtering by date range and status)
CREATE INDEX IF NOT EXISTS idx_dating_apps_created_status ON dating_applications(created_at, status);
CREATE INDEX IF NOT EXISTS idx_dating_apps_member_id ON dating_applications(member_id);

-- Indexes for Member Books (Joining)
CREATE INDEX IF NOT EXISTS idx_member_books_member_id ON member_books(member_id);
-- Also index created_at for sorting books
CREATE INDEX IF NOT EXISTS idx_member_books_created_at ON member_books(created_at DESC);

-- Indexes for Match Requests (Filtering by user and status)
CREATE INDEX IF NOT EXISTS idx_match_requests_sender_status ON match_requests(sender_id, status);
CREATE INDEX IF NOT EXISTS idx_match_requests_receiver_status ON match_requests(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_match_requests_created_at ON match_requests(created_at DESC);

-- Indexes for Notifications (Fetching unread)
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
