-- Opaque server-side sessions; only a SHA-256 hash of the browser cookie is stored.
CREATE TABLE IF NOT EXISTS user_sessions (
    session_hash CHAR(64) PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_expiry ON user_sessions(expires_at);
GRANT SELECT, INSERT, DELETE ON user_sessions TO transport;
