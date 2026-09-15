CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'resident')),
  phone TEXT,
  unit_number TEXT,
  avatar_url TEXT,
  auth_provider TEXT,
  auth_uid TEXT UNIQUE,
  has_valid_id BOOLEAN NOT NULL DEFAULT FALSE,
  government_id_status TEXT NOT NULL DEFAULT 'not_submitted' CHECK (government_id_status IN ('not_submitted', 'pending', 'verified', 'rejected')),
  government_id_uploaded_at TIMESTAMPTZ,
  government_id_verified_at TIMESTAMPTZ,
  government_id_rejection_reason TEXT,
  valid_id_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS units (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  availability BOOLEAN NOT NULL DEFAULT TRUE,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  status TEXT NOT NULL CHECK (status IN ('Available', 'Occupied', 'Maintenance')),
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  amenities JSONB,
  floor_number INTEGER,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  unit_id TEXT NOT NULL REFERENCES units(id),
  resident_id TEXT NOT NULL REFERENCES users(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_price NUMERIC(12,2) NOT NULL CHECK (total_price > 0),
  status TEXT NOT NULL CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Cancelled', 'Completed', 'Partially Paid')),
  guests_count INTEGER NOT NULL CHECK (guests_count > 0),
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_date > start_date)
);

CREATE INDEX IF NOT EXISTS bookings_unit_dates_idx ON bookings (unit_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS bookings_resident_idx ON bookings (resident_id);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings (status);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  booking_id TEXT REFERENCES bookings(id),
  resident_id TEXT NOT NULL REFERENCES users(id),
  unit_name TEXT,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  remaining_balance NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (remaining_balance >= 0),
  downpayment_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (downpayment_amount >= 0),
  status TEXT NOT NULL CHECK (status IN ('Pending', 'Partially Paid', 'Paid', 'Failed', 'Refunded')),
  method TEXT NOT NULL,
  reference_number TEXT NOT NULL UNIQUE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS payments_resident_idx ON payments (resident_id);
CREATE INDEX IF NOT EXISTS payments_booking_idx ON payments (booking_id);

CREATE TABLE IF NOT EXISTS maintenance_requests (
  id TEXT PRIMARY KEY,
  resident_id TEXT NOT NULL REFERENCES users(id),
  unit_number TEXT,
  issue_type TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('Low', 'Medium', 'High', 'Emergency')),
  status TEXT NOT NULL CHECK (status IN ('Pending', 'Assigned', 'In Progress', 'Completed', 'Deferred')),
  assigned_staff TEXT,
  resolved_at TIMESTAMPTZ,
  images JSONB,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  recipient_id TEXT NOT NULL,
  recipient_role TEXT,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'alert')),
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS notifications_recipient_idx ON notifications (recipient_id, recipient_role);

CREATE TABLE IF NOT EXISTS notification_reads (
  notification_id TEXT NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (notification_id, user_id)
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL CHECK (user_role IN ('admin', 'resident')),
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  request_id TEXT,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS activity_logs_created_idx ON activity_logs (created_at DESC);

CREATE TABLE IF NOT EXISTS application_state (
  id TEXT PRIMARY KEY,
  state JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
