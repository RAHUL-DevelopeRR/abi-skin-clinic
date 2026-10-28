-- Videos the doctor uploads from the dashboard. The files live in the R2 bucket bound as VIDEOS;
-- a row stays 'uploading' (with its R2 multipart upload) until every part has arrived.
CREATE TABLE IF NOT EXISTS clinic_videos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  r2_key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
  status TEXT NOT NULL DEFAULT 'uploading' CHECK (status IN ('uploading', 'ready')),
  published INTEGER NOT NULL DEFAULT 1 CHECK (published IN (0, 1)),
  upload_id TEXT,
  upload_token_hash TEXT,
  upload_expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clinic_videos_public
  ON clinic_videos(status, published, created_at);

-- How each doctor device is alerted about a new appointment request: a standard notification,
-- or ABI Doctor's ringing alert (app 1.1.3+), which needs a data-only Firebase message.
ALTER TABLE doctor_devices ADD COLUMN alert_style TEXT NOT NULL DEFAULT 'notification'
  CHECK (alert_style IN ('notification', 'ring'));
