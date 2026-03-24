CREATE TABLE daily_stats (
  site_id          UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  date             DATE NOT NULL,
  total_views      INTEGER NOT NULL DEFAULT 0,
  unique_visitors  INTEGER NOT NULL DEFAULT 0,
  unique_pages     INTEGER NOT NULL DEFAULT 0,
  total_sessions   INTEGER NOT NULL DEFAULT 0,
  avg_duration_ms  INTEGER,
  bounce_rate      INTEGER,
  top_page         TEXT,
  top_referrer     TEXT,
  PRIMARY KEY (site_id, date)
);
