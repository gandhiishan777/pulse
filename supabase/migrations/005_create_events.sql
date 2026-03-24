CREATE TYPE event_type AS ENUM ('pageview', 'custom_event');

CREATE TABLE events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id     UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  session_id  UUID REFERENCES sessions(id) ON DELETE SET NULL,
  type        event_type NOT NULL DEFAULT 'pageview',
  path        TEXT NOT NULL,
  referrer    TEXT,
  duration_ms INTEGER,
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT now(),
  properties  JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_events_site_timestamp ON events (site_id, timestamp);
CREATE INDEX idx_events_site_path ON events (site_id, path);
CREATE INDEX idx_events_properties ON events USING gin(properties);
