CREATE TABLE player_prices (
  player_id   INT PRIMARY KEY REFERENCES players(id),
  price       DECIMAL(4,1) NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_player_prices_price ON player_prices(price DESC);
