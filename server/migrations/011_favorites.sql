CREATE TABLE favorites (
  id            SERIAL PRIMARY KEY,
  clerk_user_id TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,
  entity_type   TEXT NOT NULL,
  entity_id     INT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clerk_user_id, entity_type, entity_id)
);

CREATE INDEX idx_favorites_user ON favorites(clerk_user_id);
CREATE INDEX idx_favorites_type ON favorites(entity_type);
