CREATE TABLE fantasy_picks (
  id                SERIAL PRIMARY KEY,
  fantasy_team_id   INT NOT NULL REFERENCES fantasy_teams(id) ON DELETE CASCADE,
  player_id         INT NOT NULL REFERENCES players(id),
  round             INT NOT NULL,
  position_slot     INT NOT NULL,
  is_captain        BOOLEAN DEFAULT FALSE,
  is_vice_captain   BOOLEAN DEFAULT FALSE,
  points_earned     INT DEFAULT 0,
  substituted       BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(fantasy_team_id, round, position_slot)
);

CREATE INDEX idx_fantasy_picks_team ON fantasy_picks(fantasy_team_id);
CREATE INDEX idx_fantasy_picks_player ON fantasy_picks(player_id);
CREATE INDEX idx_fantasy_picks_round ON fantasy_picks(round);
CREATE UNIQUE INDEX idx_fantasy_picks_unique_player
  ON fantasy_picks(fantasy_team_id, player_id, round);
