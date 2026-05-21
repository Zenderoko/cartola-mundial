CREATE TABLE fixture_events (
  id          SERIAL PRIMARY KEY,
  fixture_id  INT NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,
  team_id     INT NOT NULL REFERENCES teams(id),
  player_id   INT REFERENCES players(id),
  assist_id   INT REFERENCES players(id),
  event_type  TEXT NOT NULL,
  detail      TEXT,
  minute      INT NOT NULL,
  extra_minute INT,
  comments    TEXT,
  cache_until TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(fixture_id, minute, extra_minute, event_type, player_id)
);

CREATE INDEX idx_fixture_events_fixture ON fixture_events(fixture_id);
CREATE INDEX idx_fixture_events_player ON fixture_events(player_id);
CREATE INDEX idx_fixture_events_type ON fixture_events(event_type);
CREATE INDEX idx_fixture_events_minute ON fixture_events(fixture_id, minute);
