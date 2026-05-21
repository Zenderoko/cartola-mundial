CREATE TABLE standings (
  id          SERIAL PRIMARY KEY,
  group_name  TEXT NOT NULL,
  team_id     INT NOT NULL REFERENCES teams(id),
  position    INT,
  played      INT DEFAULT 0,
  wins        INT DEFAULT 0,
  draws       INT DEFAULT 0,
  losses      INT DEFAULT 0,
  gf          INT DEFAULT 0,
  ga          INT DEFAULT 0,
  gd          INT DEFAULT 0,
  points      INT DEFAULT 0,
  form        TEXT,
  cache_until TIMESTAMPTZ,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_name, team_id)
);

CREATE INDEX idx_standings_group ON standings(group_name);
CREATE INDEX idx_standings_points ON standings(points DESC);
CREATE INDEX idx_standings_team ON standings(team_id);
