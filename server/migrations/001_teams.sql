CREATE TABLE teams (
  id          INT PRIMARY KEY,
  name        TEXT NOT NULL,
  code        TEXT,
  country     TEXT,
  logo        TEXT,
  group_name  TEXT,
  fifa_rank   INT,
  cache_until TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_teams_group ON teams(group_name);
CREATE INDEX idx_teams_code ON teams(code);
