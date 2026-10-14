ALTER TABLE branches ADD COLUMN google_review_url TEXT NOT NULL DEFAULT '';

-- Google Maps links that open each clinic's Reviews tab with "Write a review".
-- The doctor app can replace these with the "Ask for reviews" link from Google Business Profile.
UPDATE branches SET google_review_url = 'https://www.google.com/maps/place/Abi+Skin+and+Hair+Clinic/data=!4m7!3m6!1s0x3baa2fb013f3d4d3:0xd94748011689ec7b!8m2!3d10.9611889!4d78.0777973!9m1!1b1!12e1' WHERE id = 'karur';
UPDATE branches SET google_review_url = 'https://www.google.com/maps/place/Abi+Skin+%26+Hair+Clinic/data=!4m7!3m6!1s0x3baa2bb95056978b:0x244601a5482a2663!8m2!3d11.0697385!4d78.0079719!9m1!1b1!12e1' WHERE id = 'velayuthampalayam';

CREATE TABLE IF NOT EXISTS patient_notifications (
  id TEXT PRIMARY KEY,
  appointment_id TEXT NOT NULL,
  event TEXT NOT NULL CHECK (event IN ('booked', 'confirmed', 'cancelled', 'completed')),
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp')),
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  provider_message_id TEXT,
  error TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_patient_notifications_appointment
  ON patient_notifications(appointment_id, created_at DESC);
