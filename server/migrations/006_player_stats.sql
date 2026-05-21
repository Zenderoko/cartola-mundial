CREATE TABLE player_stats (
  id                SERIAL PRIMARY KEY,
  fixture_id        INT NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,
  player_id         INT NOT NULL REFERENCES players(id),
  team_id           INT NOT NULL REFERENCES teams(id),
  rating            DECIMAL(4,2),
  minutes_played    INT DEFAULT 0,
  position          TEXT,
  goals             INT DEFAULT 0,
  assists           INT DEFAULT 0,
  shots             INT DEFAULT 0,
  shots_on_target   INT DEFAULT 0,
  key_passes        INT DEFAULT 0,
  passes            INT DEFAULT 0,
  accurate_passes   INT DEFAULT 0,
  tackles           INT DEFAULT 0,
  interceptions     INT DEFAULT 0,
  clearances        INT DEFAULT 0,
  blocked_shots     INT DEFAULT 0,
  fouls             INT DEFAULT 0,
  fouls_drawn       INT DEFAULT 0,
  offsides          INT DEFAULT 0,
  yellow_card       BOOLEAN DEFAULT FALSE,
  red_card          BOOLEAN DEFAULT FALSE,
  saves             INT DEFAULT 0,
  goals_conceded    INT DEFAULT 0,
  penalties_saved   INT DEFAULT 0,
  penalties_missed  INT DEFAULT 0,
  man_of_the_match  BOOLEAN DEFAULT FALSE,
  cache_until       TIMESTAMPTZ,
  UNIQUE(fixture_id, player_id)
);

CREATE INDEX idx_player_stats_fixture ON player_stats(fixture_id);
CREATE INDEX idx_player_stats_player ON player_stats(player_id);
CREATE INDEX idx_player_stats_rating ON player_stats(rating DESC);
CREATE INDEX idx_player_stats_goals ON player_stats(goals DESC);
CREATE INDEX idx_player_stats_mom ON player_stats(man_of_the_match) WHERE man_of_the_match = TRUE;
