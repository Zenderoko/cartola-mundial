CREATE TABLE fantasy_points (
  id            SERIAL PRIMARY KEY,
  player_id     INT NOT NULL REFERENCES players(id),
  fixture_id    INT NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,
  round         INT,
  base_points   INT NOT NULL DEFAULT 0,
  captain_bonus INT DEFAULT 0,
  vice_bonus    INT DEFAULT 0,
  total_points  INT NOT NULL DEFAULT 0,
  breakdown     JSONB NOT NULL DEFAULT '{}',
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, fixture_id)
);

CREATE INDEX idx_fantasy_points_player ON fantasy_points(player_id);
CREATE INDEX idx_fantasy_points_fixture ON fantasy_points(fixture_id);
CREATE INDEX idx_fantasy_points_round ON fantasy_points(round);
