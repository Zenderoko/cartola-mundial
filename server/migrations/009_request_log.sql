CREATE TABLE request_log (
  id            SERIAL PRIMARY KEY,
  endpoint      TEXT NOT NULL,
  params        TEXT,
  status        INT,
  response_ms   INT,
  date          DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_request_log_date ON request_log(date);
CREATE INDEX idx_request_log_endpoint ON request_log(endpoint);
