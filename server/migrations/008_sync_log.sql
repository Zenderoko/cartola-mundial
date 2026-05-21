CREATE TABLE sync_log (
  id            SERIAL PRIMARY KEY,
  entity        TEXT NOT NULL,
  entity_id     INT,
  status        TEXT NOT NULL,
  http_status   INT,
  requests_used INT DEFAULT 1,
  rows_inserted INT DEFAULT 0,
  rows_updated  INT DEFAULT 0,
  error_message TEXT,
  meta          JSONB,
  synced_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sync_log_entity ON sync_log(entity);
CREATE INDEX idx_sync_log_status ON sync_log(status);
CREATE INDEX idx_sync_log_date ON sync_log(synced_at);
