CREATE TABLE fixture_stats (
  id                SERIAL PRIMARY KEY,
  fixture_id        INT NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,
  team_id           INT NOT NULL REFERENCES teams(id),
  shots             INT DEFAULT 0,
  shots_on_target   INT DEFAULT 0,
  possession        DECIMAL(5,1),
  total_passes      INT DEFAULT 0,
  accurate_passes   INT DEFAULT 0,
  pass_accuracy     DECIMAL(5,1),
  fouls             INT DEFAULT 0,
  corners           INT DEFAULT 0,
  offsides          INT DEFAULT 0,
  yellow_cards      INT DEFAULT 0,
  red_cards         INT DEFAULT 0,
  saves             INT DEFAULT 0,
  expected_goals    DECIMAL(5,2),
  cache_until       TIMESTAMPTZ,
  UNIQUE(fixture_id, team_id)
);

CREATE INDEX idx_fixture_stats_fixture ON fixture_stats(fixture_id);
CREATE INDEX idx_fixture_stats_team ON fixture_stats(team_id);
