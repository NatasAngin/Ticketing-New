-- Track failed login attempts using a hashed client address.
CREATE TABLE IF NOT EXISTS auth_login_attempts (
  username_key TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  window_started_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  blocked_until TEXT,
  PRIMARY KEY (username_key, ip_hash)
);
CREATE INDEX IF NOT EXISTS idx_auth_login_blocked ON auth_login_attempts(blocked_until);
