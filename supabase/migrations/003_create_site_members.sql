CREATE TYPE site_role AS ENUM ('owner', 'admin', 'viewer');

CREATE TABLE site_members (
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  site_id     UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  role        site_role NOT NULL DEFAULT 'viewer',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, site_id)
);

CREATE INDEX idx_site_members_site_id ON site_members (site_id);
