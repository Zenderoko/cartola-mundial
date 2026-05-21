CREATE TABLE users (
  id              SERIAL PRIMARY KEY,
  clerk_user_id   TEXT UNIQUE NOT NULL,
  email           TEXT,
  name            TEXT,
  avatar_url      TEXT,
  tier            TEXT NOT NULL DEFAULT 'free',
  premium_since   TIMESTAMPTZ,
  preferences     JSONB DEFAULT '{}',
  is_active       BOOLEAN DEFAULT TRUE,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_clerk ON users(clerk_user_id);
CREATE INDEX idx_users_tier ON users(tier);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = TRUE;
