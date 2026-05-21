CREATE TABLE players (
  id          INT PRIMARY KEY,
  team_id     INT NOT NULL REFERENCES teams(id),
  name        TEXT NOT NULL,
  position    TEXT,
  age         INT,
  nationality TEXT,
  height      INT,
  weight      INT,
  photo       TEXT,
  number      INT,
  cache_until TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_players_team ON players(team_id);
CREATE INDEX idx_players_position ON players(position);
CREATE INDEX idx_players_name ON players(name);
