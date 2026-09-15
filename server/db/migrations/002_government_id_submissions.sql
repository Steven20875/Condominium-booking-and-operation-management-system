CREATE TABLE IF NOT EXISTS government_id_submissions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  storage_key TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  original_file_name TEXT,
  status TEXT NOT NULL CHECK (status IN ('not_submitted', 'pending', 'verified', 'rejected')),
  uploaded_at TIMESTAMPTZ NOT NULL,
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT REFERENCES users(id),
  rejection_reason TEXT
);

CREATE INDEX IF NOT EXISTS government_id_submissions_user_idx ON government_id_submissions (user_id, uploaded_at DESC);
CREATE INDEX IF NOT EXISTS government_id_submissions_status_idx ON government_id_submissions (status);
