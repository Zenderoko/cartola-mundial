CREATE TABLE fixtures (
  id            INT PRIMARY KEY,
  round         TEXT,
  date          TIMESTAMPTZ,
  status        TEXT,
  home_team_id  INT NOT NULL REFERENCES teams(id),
  away_team_id  INT NOT NULL REFERENCES teams(id),
  home_score    INT,
  away_score    INT,
  venue         TEXT,
  stage         TEXT,
  cache_until   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fixtures_date ON fixtures(date);
CREATE INDEX idx_fixtures_status ON fixtures(status);
CREATE INDEX idx_fixtures_round ON fixtures(round);
CREATE INDEX idx_fixtures_stage ON fixtures(stage);
CREATE INDEX idx_fixtures_home ON fixtures(home_team_id);
CREATE INDEX idx_fixtures_away ON fixtures(away_team_id);
CREATE INDEX idx_fixtures_date_status ON fixtures(date, status);
CREATE INDEX idx_fixtures_team_date ON fixtures(home_team_id, date);
