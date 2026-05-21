CREATE TABLE user_history (
  id            SERIAL PRIMARY KEY,
  clerk_user_id TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,
  action        TEXT NOT NULL,
  details       JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_history_user ON user_history(clerk_user_id);
CREATE INDEX idx_user_history_action ON user_history(action);
CREATE INDEX idx_user_history_date ON user_history(created_at);
