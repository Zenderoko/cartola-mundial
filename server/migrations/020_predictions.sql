CREATE TABLE predictions (
  id              SERIAL PRIMARY KEY,
  user_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fixture_id      INT NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,
  market          TEXT NOT NULL,
  line            DECIMAL(5,1),
  prediction      TEXT NOT NULL,
  points          INT DEFAULT 0,
  is_correct      BOOLEAN,
  settled         BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, fixture_id, market)
);

CREATE INDEX idx_predictions_user ON predictions(user_id);
CREATE INDEX idx_predictions_fixture ON predictions(fixture_id);
CREATE INDEX idx_predictions_settled ON predictions(settled) WHERE settled = FALSE;
