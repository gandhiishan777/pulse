CREATE TABLE sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id     UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  visitor_id  TEXT NOT NULL,
  referrer    TEXT,
  is_bounce   BOOLEAN NOT NULL DEFAULT true,
  page_count  INTEGER NOT NULL DEFAULT 1,
  started_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at    TIMESTAMPTZ
);

CREATE INDEX idx_sessions_site_started ON sessions (site_id, started_at);
CREATE INDEX idx_sessions_visitor ON sessions (site_id, visitor_id);
