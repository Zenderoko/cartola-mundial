CREATE TABLE fantasy_teams (
  id              SERIAL PRIMARY KEY,
  clerk_user_id   TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  formation       TEXT DEFAULT '4-3-3',
  budget_spent    DECIMAL(10,2) DEFAULT 0,
  total_points    INT DEFAULT 0,
  round_points    INT DEFAULT 0,
  is_active       BOOLEAN DEFAULT TRUE,
  is_premium      BOOLEAN DEFAULT FALSE,
  points_per_round JSONB DEFAULT '[]',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fantasy_user ON fantasy_teams(clerk_user_id);
CREATE INDEX idx_fantasy_points ON fantasy_teams(total_points DESC);
CREATE INDEX idx_fantasy_active ON fantasy_teams(is_active) WHERE is_active = TRUE;
