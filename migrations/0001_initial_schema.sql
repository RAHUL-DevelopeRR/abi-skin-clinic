PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS working_hours (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  branch_id TEXT NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  period_index INTEGER NOT NULL DEFAULT 0 CHECK (period_index BETWEEN 0 AND 3),
  start_time TEXT NOT NULL CHECK (length(start_time) = 5),
  end_time TEXT NOT NULL CHECK (length(end_time) = 5),
  slot_minutes INTEGER NOT NULL DEFAULT 30 CHECK (slot_minutes BETWEEN 10 AND 120),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
  UNIQUE (branch_id, day_of_week, period_index)
);

CREATE TABLE IF NOT EXISTS leave_days (
  id TEXT PRIMARY KEY,
  branch_id TEXT,
  leave_date TEXT NOT NULL CHECK (length(leave_date) = 10),
  reason TEXT NOT NULL DEFAULT 'Clinic closed',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_leave_days_date_branch
  ON leave_days(leave_date, branch_id);

CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  branch_id TEXT NOT NULL,
  service_id TEXT NOT NULL,
  appointment_date TEXT NOT NULL CHECK (length(appointment_date) = 10),
  time_slot TEXT NOT NULL CHECK (length(time_slot) = 5),
  patient_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  admin_notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested', 'confirmed', 'completed', 'cancelled', 'no_show')),
  review_token TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (service_id) REFERENCES services(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_active_slot
  ON appointments(branch_id, appointment_date, time_slot)
  WHERE status IN ('requested', 'confirmed');

CREATE INDEX IF NOT EXISTS idx_appointments_date_status
  ON appointments(appointment_date, status);

CREATE INDEX IF NOT EXISTS idx_appointments_phone
  ON appointments(phone);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  appointment_id TEXT NOT NULL UNIQUE,
  patient_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  consent INTEGER NOT NULL CHECK (consent IN (0, 1)),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  moderated_at TEXT,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reviews_status_created
  ON reviews(status, created_at DESC);

CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  ip_hash TEXT,
  user_agent_hash TEXT
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_expiry
  ON admin_sessions(expires_at);

CREATE TABLE IF NOT EXISTS rate_limits (
  bucket TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (bucket, window_start)
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_log_created
  ON audit_log(created_at DESC);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO branches (id, name, address, phone) VALUES
  ('karur', 'Karur Clinic (Main Branch)', '10 West, North Madavalagam Road, Behind Easwaran Kovil, Madavilagam, Karur - 639001', '+91 75981 26430'),
  ('velayuthampalayam', 'Velayuthampalayam Clinic', 'Valluvar Nagar, South 1st Street, Velayuthampalayam Bypass, Near Pugali Mandapam, Velayuthampalayam - 639117', '+91 94437 66998');

INSERT OR IGNORE INTO services (id, name, sort_order) VALUES
  ('acne-scar', 'Acne & Scar Treatment', 10),
  ('prp-hair', 'PRP Hair Growth Therapy', 20),
  ('pigmentation-peels', 'Pigmentation & Clinical Peels', 30),
  ('hydrafacial', 'Hydrafacial & Skin Polishing', 40),
  ('laser-hair', 'Laser Hair Reduction', 50),
  ('carbon-laser', 'Carbon Laser Toning', 60),
  ('eczema-psoriasis', 'Eczema / Psoriasis Consultation', 70),
  ('wart-mole', 'Wart & Mole Removal', 80),
  ('general', 'General Skin Consultation', 90);

INSERT OR IGNORE INTO working_hours
  (branch_id, day_of_week, period_index, start_time, end_time, slot_minutes)
SELECT 'karur', day, 0, '09:00', '13:00', 30
FROM (SELECT 1 AS day UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6);

INSERT OR IGNORE INTO working_hours
  (branch_id, day_of_week, period_index, start_time, end_time, slot_minutes)
SELECT 'karur', day, 1, '16:00', '20:30', 30
FROM (SELECT 1 AS day UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6);

INSERT OR IGNORE INTO working_hours
  (branch_id, day_of_week, period_index, start_time, end_time, slot_minutes)
SELECT 'velayuthampalayam', day, 0, '17:30', '20:30', 30
FROM (SELECT 1 AS day UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6);

INSERT OR IGNORE INTO settings (key, value) VALUES
  ('booking_horizon_days', '90'),
  ('minimum_booking_notice_minutes', '60'),
  ('clinic_timezone', 'Asia/Kolkata');
