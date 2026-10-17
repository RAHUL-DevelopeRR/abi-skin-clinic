-- Patient notifications now cover SMS sent by the registered clinic phone.
-- SQLite cannot change CHECK constraints in place, so the table is rebuilt.
CREATE TABLE patient_notifications_new (
  id TEXT PRIMARY KEY,
  appointment_id TEXT,
  event TEXT NOT NULL CHECK (event IN ('booked', 'confirmed', 'rejected', 'cancelled', 'completed', 'test')),
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'sms')),
  status TEXT NOT NULL CHECK (status IN ('queued', 'sending', 'sent', 'delivered', 'failed')),
  phone TEXT,
  message TEXT,
  provider_message_id TEXT,
  error TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
);

INSERT INTO patient_notifications_new (
  id, appointment_id, event, channel, status, provider_message_id, error, created_at, updated_at
)
SELECT id, appointment_id, event, channel, status, provider_message_id, error, created_at, created_at
FROM patient_notifications;

DROP TABLE patient_notifications;
ALTER TABLE patient_notifications_new RENAME TO patient_notifications;

CREATE INDEX IF NOT EXISTS idx_patient_notifications_appointment
  ON patient_notifications(appointment_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_patient_notifications_queue
  ON patient_notifications(channel, status, created_at);

-- The one Android phone registered in ABI Doctor to send patient SMS from its SIM.
CREATE TABLE IF NOT EXISTS sms_sender (
  id TEXT PRIMARY KEY,
  phone TEXT NOT NULL,
  device_name TEXT NOT NULL DEFAULT '',
  push_token TEXT,
  secret_hash TEXT NOT NULL UNIQUE,
  daily_limit INTEGER NOT NULL DEFAULT 100 CHECK (daily_limit BETWEEN 1 AND 1000),
  registered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT
);

-- Google Places IDs may be stored indefinitely under the Places API terms.
ALTER TABLE branches ADD COLUMN google_place_id TEXT NOT NULL DEFAULT '';
