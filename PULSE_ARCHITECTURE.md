# Pulse — Web Analytics Dashboard

## Project Overview

Pulse is a web analytics platform (like Plausible or Vercel Analytics) that tracks page views and events for websites, then displays the data through a polished dashboard. This document contains the complete database architecture, migration files, query patterns, and design rationale.

## Tech Stack

- **Framework**: Next.js (App Router, TypeScript)
- **Database**: Supabase (Postgres)
- **Auth**: Supabase Auth
- **Styling**: Tailwind CSS + shadcn/ui
- **Deployment**: Vercel

## Database Architecture

### Overview

6 tables, organized in two tiers:

1. **Application tables**: `users`, `sites`, `site_members` — standard SaaS data model
2. **Analytics tables**: `sessions`, `events`, `daily_stats` — high-volume time-series data

### Key Design Decisions

- **UUIDs over serial IDs**: Non-guessable, can be generated client-side for optimistic updates, consistent with Supabase Auth user IDs.
- **TIMESTAMPTZ over TIMESTAMP**: Stores relative to UTC so times convert correctly for users in any timezone.
- **Enums over TEXT for constrained values**: `site_plan` and `site_role` are Postgres enums so the database rejects invalid values. Don't trust app code to be the only validation layer.
- **Soft deletes on `sites`**: Uses `deleted_at TIMESTAMPTZ` column. NULL = active, timestamp = soft-deleted. Allows 30-day recovery. All queries on sites should include `WHERE deleted_at IS NULL`.
- **JSONB for flexible event properties**: Events carry varying metadata (browser, OS, UTM params, country, screen size). JSONB avoids schema migrations when new properties are added. Indexed with GIN for query performance.
- **Pre-computed rollup table (`daily_stats`)**: The `events` table will have millions of rows. Dashboard overview queries hit `daily_stats` (reads ~30 rows) instead of scanning millions of events. This is intentional denormalization — trading storage duplication for read performance.
- **Composite primary keys**: `site_members` uses `(user_id, site_id)` and `daily_stats` uses `(site_id, date)` — no separate `id` column needed. Enforces uniqueness of the combination.

### Relationship Map

```
users (1) ──────── (N) sites           via sites.created_by → users.id (ON DELETE RESTRICT)
users (M) ──────── (N) sites           via site_members join table (ON DELETE CASCADE both sides)
sites (1) ──────── (N) sessions        via sessions.site_id → sites.id (ON DELETE CASCADE)
sites (1) ──────── (N) events          via events.site_id → sites.id (ON DELETE CASCADE)
sites (1) ──────── (N) daily_stats     via daily_stats.site_id → sites.id (ON DELETE CASCADE)
sessions (1) ───── (N) events          via events.session_id → sessions.id (ON DELETE SET NULL)
```

### Cascade Behavior Rationale

- **sites.created_by → users: RESTRICT** — Block user deletion if they own sites. Force them to transfer ownership first. Prevents orphaned sites with no owner.
- **site_members → users/sites: CASCADE** — Membership is meaningless without either party. Clean up automatically.
- **events/sessions → sites: CASCADE** — Analytics data is meaningless without the site. Delete site = delete all its data.
- **events → sessions: SET NULL** — Sessions might be cleaned up independently (e.g. data retention policy). Events should survive even if their session record is pruned.

### Index Strategy

Every index matches a specific query pattern. No unnecessary indexes (they slow down writes on high-volume tables like events).

| Index | Columns | Purpose |
|-------|---------|---------|
| `idx_sites_created_by` | `(created_by)` | "Show me all my sites" |
| `idx_site_members_site_id` | `(site_id)` | "Who belongs to this site?" (reverse lookup) |
| `idx_sessions_site_started` | `(site_id, started_at)` | Dashboard: sessions in a time range |
| `idx_sessions_visitor` | `(site_id, visitor_id)` | Find active session for incoming event |
| `idx_events_site_timestamp` | `(site_id, timestamp)` | Primary dashboard query pattern: events for site X in time range |
| `idx_events_site_path` | `(site_id, path)` | "Top pages" widget: GROUP BY path within a site |
| `idx_events_properties` | `(properties)` GIN | Query into JSONB: filter by browser, country, etc. |

Compound index order matters: `(site_id, timestamp)` helps queries filtering by site_id alone OR by site_id + timestamp. It does NOT help queries filtering by timestamp alone. The first column in the index must match the first filter in the query.

---

## Migration Files

Run these in order. Each migration depends on the previous ones.

### 001_create_users.sql

```sql
-- Function to auto-update updated_at on any row modification.
-- Created once, reused across all tables with updated_at.
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

### 002_create_sites.sql

```sql
CREATE TYPE site_plan AS ENUM ('free', 'pro', 'enterprise');

CREATE TABLE sites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain      TEXT UNIQUE NOT NULL,
  created_by  UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  plan        site_plan NOT NULL DEFAULT 'free',
  deleted_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON sites
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_sites_created_by ON sites (created_by);
```

### 003_create_site_members.sql

```sql
CREATE TYPE site_role AS ENUM ('owner', 'admin', 'viewer');

CREATE TABLE site_members (
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  site_id     UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  role        site_role NOT NULL DEFAULT 'viewer',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, site_id)
);

CREATE INDEX idx_site_members_site_id ON site_members (site_id);
```

### 004_create_sessions.sql

```sql
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
```

### 005_create_events.sql

```sql
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
```

### 006_create_daily_stats.sql

```sql
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
```

### 007_seed_data.sql

```sql
-- Test user
INSERT INTO users (id, name, email, avatar_url) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Alex Chen', 'alex@pulse.dev', NULL);

-- Test sites
INSERT INTO sites (id, domain, created_by, plan) VALUES
  ('b1b2c3d4-0000-0000-0000-000000000001', 'acme.com', 'a1b2c3d4-0000-0000-0000-000000000001', 'pro'),
  ('b1b2c3d4-0000-0000-0000-000000000002', 'blog.acme.com', 'a1b2c3d4-0000-0000-0000-000000000001', 'free');

-- Site memberships
INSERT INTO site_members (user_id, site_id, role) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'b1b2c3d4-0000-0000-0000-000000000001', 'owner'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'b1b2c3d4-0000-0000-0000-000000000002', 'owner');

-- Sessions for acme.com
INSERT INTO sessions (id, site_id, visitor_id, referrer, is_bounce, page_count, started_at, ended_at) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'b1b2c3d4-0000-0000-0000-000000000001', 'v_abc123', 'https://google.com', false, 4, now() - interval '2 hours', now() - interval '1 hour 50 minutes'),
  ('c1000000-0000-0000-0000-000000000002', 'b1b2c3d4-0000-0000-0000-000000000001', 'v_def456', 'https://twitter.com', true, 1, now() - interval '1 hour', NULL),
  ('c1000000-0000-0000-0000-000000000003', 'b1b2c3d4-0000-0000-0000-000000000001', 'v_ghi789', NULL, false, 3, now() - interval '30 minutes', now() - interval '15 minutes'),
  ('c1000000-0000-0000-0000-000000000004', 'b1b2c3d4-0000-0000-0000-000000000001', 'v_jkl012', 'https://google.com', false, 5, now() - interval '1 day 3 hours', now() - interval '1 day 2 hours'),
  ('c1000000-0000-0000-0000-000000000005', 'b1b2c3d4-0000-0000-0000-000000000001', 'v_mno345', 'https://github.com', true, 1, now() - interval '1 day 1 hour', NULL),
  ('c1000000-0000-0000-0000-000000000006', 'b1b2c3d4-0000-0000-0000-000000000001', 'v_pqr678', 'https://linkedin.com', false, 2, now() - interval '3 days 5 hours', now() - interval '3 days 4 hours');

-- Events across multiple days
INSERT INTO events (site_id, session_id, type, path, referrer, duration_ms, timestamp, properties) VALUES
  ('b1b2c3d4-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'pageview', '/', 'https://google.com', 12400, now() - interval '2 hours', '{"browser": "Chrome", "os": "macOS", "screen_width": 1440, "country": "US"}'),
  ('b1b2c3d4-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'pageview', '/pricing', NULL, 45200, now() - interval '1 hour 58 minutes', '{"browser": "Chrome", "os": "macOS", "screen_width": 1440, "country": "US"}'),
  ('b1b2c3d4-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'pageview', '/features', NULL, 23100, now() - interval '1 hour 55 minutes', '{"browser": "Chrome", "os": "macOS", "screen_width": 1440, "country": "US"}'),
  ('b1b2c3d4-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'custom_event', '/pricing', NULL, NULL, now() - interval '1 hour 54 minutes', '{"browser": "Chrome", "os": "macOS", "event_name": "click_signup", "button_variant": "blue"}'),
  ('b1b2c3d4-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002', 'pageview', '/blog/getting-started', 'https://twitter.com', 3200, now() - interval '1 hour', '{"browser": "Safari", "os": "iOS", "screen_width": 390, "country": "UK"}'),
  ('b1b2c3d4-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000003', 'pageview', '/', NULL, 18700, now() - interval '30 minutes', '{"browser": "Firefox", "os": "Windows", "screen_width": 1920, "country": "DE"}'),
  ('b1b2c3d4-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000003', 'pageview', '/about', NULL, 8900, now() - interval '25 minutes', '{"browser": "Firefox", "os": "Windows", "screen_width": 1920, "country": "DE"}'),
  ('b1b2c3d4-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000003', 'pageview', '/pricing', NULL, 32100, now() - interval '20 minutes', '{"browser": "Firefox", "os": "Windows", "screen_width": 1920, "country": "DE"}'),
  ('b1b2c3d4-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000004', 'pageview', '/', 'https://google.com', 9800, now() - interval '1 day 3 hours', '{"browser": "Chrome", "os": "macOS", "screen_width": 1440, "country": "US"}'),
  ('b1b2c3d4-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000004', 'pageview', '/features', NULL, 15600, now() - interval '1 day 2 hours 55 minutes', '{"browser": "Chrome", "os": "macOS", "screen_width": 1440, "country": "US"}'),
  ('b1b2c3d4-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000004', 'pageview', '/pricing', NULL, 28400, now() - interval '1 day 2 hours 50 minutes', '{"browser": "Chrome", "os": "macOS", "screen_width": 1440, "country": "US"}'),
  ('b1b2c3d4-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000004', 'pageview', '/docs', NULL, 42100, now() - interval '1 day 2 hours 40 minutes', '{"browser": "Chrome", "os": "macOS", "screen_width": 1440, "country": "US"}'),
  ('b1b2c3d4-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000004', 'custom_event', '/pricing', NULL, NULL, now() - interval '1 day 2 hours 48 minutes', '{"browser": "Chrome", "os": "macOS", "event_name": "click_signup"}'),
  ('b1b2c3d4-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000005', 'pageview', '/blog/getting-started', 'https://github.com', 2100, now() - interval '1 day 1 hour', '{"browser": "Safari", "os": "macOS", "screen_width": 1680, "country": "CA"}'),
  ('b1b2c3d4-0000-0000-0000-000000000001', NULL, 'pageview', '/', 'https://google.com', 11200, now() - interval '2 days 4 hours', '{"browser": "Chrome", "os": "Windows", "screen_width": 1366, "country": "US"}'),
  ('b1b2c3d4-0000-0000-0000-000000000001', NULL, 'pageview', '/pricing', 'https://google.com', 38900, now() - interval '2 days 3 hours', '{"browser": "Chrome", "os": "Windows", "screen_width": 1366, "country": "US"}'),
  ('b1b2c3d4-0000-0000-0000-000000000001', NULL, 'pageview', '/about', NULL, 7600, now() - interval '2 days 2 hours', '{"browser": "Edge", "os": "Windows", "screen_width": 1920, "country": "US"}'),
  ('b1b2c3d4-0000-0000-0000-000000000001', NULL, 'pageview', '/', 'https://twitter.com', 14300, now() - interval '2 days 1 hour', '{"browser": "Safari", "os": "iOS", "screen_width": 390, "country": "JP"}'),
  ('b1b2c3d4-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000006', 'pageview', '/features', 'https://linkedin.com', 22400, now() - interval '3 days 5 hours', '{"browser": "Chrome", "os": "macOS", "screen_width": 1440, "country": "US"}'),
  ('b1b2c3d4-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000006', 'pageview', '/pricing', NULL, 31200, now() - interval '3 days 4 hours 30 minutes', '{"browser": "Chrome", "os": "macOS", "screen_width": 1440, "country": "US"}'),
  ('b1b2c3d4-0000-0000-0000-000000000001', NULL, 'pageview', '/', 'https://google.com', 8900, now() - interval '3 days 2 hours', '{"browser": "Firefox", "os": "Linux", "screen_width": 1920, "country": "IN"}'),
  ('b1b2c3d4-0000-0000-0000-000000000001', NULL, 'pageview', '/', 'https://google.com', 10100, now() - interval '5 days 6 hours', '{"browser": "Chrome", "os": "macOS", "screen_width": 1440, "country": "US"}'),
  ('b1b2c3d4-0000-0000-0000-000000000001', NULL, 'pageview', '/pricing', NULL, 29800, now() - interval '5 days 5 hours', '{"browser": "Chrome", "os": "macOS", "screen_width": 1440, "country": "US"}'),
  ('b1b2c3d4-0000-0000-0000-000000000001', NULL, 'pageview', '/blog/getting-started', 'https://twitter.com', 5600, now() - interval '5 days 3 hours', '{"browser": "Safari", "os": "iOS", "screen_width": 390, "country": "US"}'),
  ('b1b2c3d4-0000-0000-0000-000000000001', NULL, 'pageview', '/', 'https://producthunt.com', 16700, now() - interval '7 days 8 hours', '{"browser": "Chrome", "os": "macOS", "screen_width": 1440, "country": "US"}'),
  ('b1b2c3d4-0000-0000-0000-000000000001', NULL, 'pageview', '/features', 'https://producthunt.com', 19200, now() - interval '7 days 7 hours', '{"browser": "Chrome", "os": "macOS", "screen_width": 1440, "country": "US"}'),
  ('b1b2c3d4-0000-0000-0000-000000000001', NULL, 'pageview', '/pricing', 'https://producthunt.com', 35100, now() - interval '7 days 6 hours', '{"browser": "Chrome", "os": "macOS", "screen_width": 1440, "country": "US"}');

-- Daily stats rollup
INSERT INTO daily_stats (site_id, date, total_views, unique_visitors, unique_pages, total_sessions, avg_duration_ms, bounce_rate, top_page, top_referrer) VALUES
  ('b1b2c3d4-0000-0000-0000-000000000001', CURRENT_DATE, 8, 3, 5, 3, 20514, 33, '/pricing', 'https://google.com'),
  ('b1b2c3d4-0000-0000-0000-000000000001', CURRENT_DATE - 1, 6, 2, 5, 2, 19800, 50, '/pricing', 'https://google.com'),
  ('b1b2c3d4-0000-0000-0000-000000000001', CURRENT_DATE - 2, 4, 3, 3, 0, 18000, 25, '/', 'https://google.com'),
  ('b1b2c3d4-0000-0000-0000-000000000001', CURRENT_DATE - 3, 3, 2, 3, 1, 20833, 33, '/pricing', 'https://linkedin.com'),
  ('b1b2c3d4-0000-0000-0000-000000000001', CURRENT_DATE - 4, 0, 0, 0, 0, NULL, NULL, NULL, NULL),
  ('b1b2c3d4-0000-0000-0000-000000000001', CURRENT_DATE - 5, 3, 2, 3, 0, 15167, 33, '/pricing', 'https://google.com'),
  ('b1b2c3d4-0000-0000-0000-000000000001', CURRENT_DATE - 6, 0, 0, 0, 0, NULL, NULL, NULL, NULL),
  ('b1b2c3d4-0000-0000-0000-000000000001', CURRENT_DATE - 7, 3, 1, 3, 0, 23667, 0, '/pricing', 'https://producthunt.com');
```

---

## Query Patterns

These are the SQL queries that power each widget on the dashboard. The Supabase JS client or server components should implement these.

### Dashboard overview stats (from rollup table — fast)

```sql
-- Views per day for the chart (hits daily_stats, not events)
SELECT date, total_views, unique_visitors
FROM daily_stats
WHERE site_id = $1
  AND date >= CURRENT_DATE - 7
ORDER BY date;

-- Summary stats for stat cards
SELECT
  SUM(total_views) as total_views,
  SUM(unique_visitors) as total_visitors,
  AVG(avg_duration_ms) as avg_duration,
  AVG(bounce_rate) as avg_bounce_rate
FROM daily_stats
WHERE site_id = $1
  AND date >= CURRENT_DATE - 7;
```

### Detail queries (from events table — flexible)

```sql
-- Top pages
SELECT path, COUNT(*) as views, AVG(duration_ms) as avg_duration
FROM events
WHERE site_id = $1
  AND timestamp > now() - interval '7 days'
GROUP BY path
ORDER BY views DESC
LIMIT 10;

-- Top referrers
SELECT referrer, COUNT(*) as views
FROM events
WHERE site_id = $1
  AND timestamp > now() - interval '7 days'
  AND referrer IS NOT NULL
GROUP BY referrer
ORDER BY views DESC
LIMIT 10;

-- Browser breakdown (querying into JSONB)
SELECT properties->>'browser' as browser, COUNT(*) as views
FROM events
WHERE site_id = $1
  AND timestamp > now() - interval '7 days'
GROUP BY browser
ORDER BY views DESC;

-- Country breakdown (querying into JSONB)
SELECT properties->>'country' as country, COUNT(*) as views
FROM events
WHERE site_id = $1
  AND timestamp > now() - interval '7 days'
GROUP BY country
ORDER BY views DESC;

-- Bounce rate (from sessions)
SELECT
  COUNT(*) FILTER (WHERE is_bounce = true) as bounced,
  COUNT(*) as total,
  ROUND(100.0 * COUNT(*) FILTER (WHERE is_bounce = true) / NULLIF(COUNT(*), 0)) as bounce_rate
FROM sessions
WHERE site_id = $1
  AND started_at > now() - interval '7 days';
```

### Time bucketing for charts

```sql
-- Hourly breakdown (for 24h view)
SELECT date_trunc('hour', timestamp) as hour, COUNT(*) as views
FROM events
WHERE site_id = $1
  AND timestamp > now() - interval '24 hours'
GROUP BY hour
ORDER BY hour;

-- Daily breakdown (for 7d/30d view — use daily_stats instead for performance)
SELECT date, total_views as views
FROM daily_stats
WHERE site_id = $1
  AND date >= CURRENT_DATE - 30
ORDER BY date;
```

---

## Supabase JS Client Examples

These show how to translate the SQL queries above into Supabase client calls for use in Next.js server components.

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Dashboard overview — from rollup table
const { data: dailyStats } = await supabase
  .from('daily_stats')
  .select('date, total_views, unique_visitors, avg_duration_ms, bounce_rate')
  .eq('site_id', siteId)
  .gte('date', sevenDaysAgo)
  .order('date');

// Top pages — requires raw SQL via Supabase's rpc() for GROUP BY
// Create a Postgres function first, then call it:
const { data: topPages } = await supabase
  .rpc('get_top_pages', {
    p_site_id: siteId,
    p_days: 7,
    p_limit: 10
  });

// For complex aggregation queries, create Postgres functions:
// CREATE FUNCTION get_top_pages(p_site_id UUID, p_days INT, p_limit INT)
// RETURNS TABLE(path TEXT, views BIGINT, avg_duration NUMERIC)
// AS $$ ... $$ LANGUAGE sql;
```

---

## Project Structure

```
pulse/
├── supabase/
│   └── migrations/
│       ├── 001_create_users.sql
│       ├── 002_create_sites.sql
│       ├── 003_create_site_members.sql
│       ├── 004_create_sessions.sql
│       ├── 005_create_events.sql
│       ├── 006_create_daily_stats.sql
│       └── 007_seed_data.sql
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Landing / redirect
│   │   └── dashboard/
│   │       ├── layout.tsx              # Dashboard shell with sidebar
│   │       ├── page.tsx                # Site list
│   │       └── [siteId]/
│   │           ├── page.tsx            # Main analytics dashboard
│   │           ├── loading.tsx         # Loading skeleton
│   │           └── settings/
│   │               └── page.tsx        # Site settings
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts              # Browser client
│   │   │   └── server.ts              # Server component client
│   │   └── queries/
│   │       ├── daily-stats.ts          # Rollup table queries
│   │       ├── events.ts              # Event detail queries
│   │       ├── sessions.ts            # Session queries
│   │       └── sites.ts               # Site CRUD
│   └── components/
│       ├── charts/
│       │   ├── area-chart.tsx
│       │   └── bar-list.tsx
│       ├── dashboard/
│       │   ├── stat-card.tsx
│       │   ├── top-pages.tsx
│       │   ├── referrers.tsx
│       │   └── period-selector.tsx
│       └── ui/                         # shadcn/ui components
├── .env.local                          # Supabase URL + anon key
├── package.json
└── tsconfig.json
```

---

## Sashv Review Talking Points

Key things to be able to explain on the Thursday call:

1. **Why UUIDs over serial IDs** — non-guessable, client-side generation for optimistic updates, consistent with Supabase Auth.
2. **Why enums over TEXT** — database enforces valid values, don't trust app code as only validation layer.
3. **Why compound indexes and their column order** — index order matches query patterns. `(site_id, timestamp)` works for site-only and site+time queries, but not time-only.
4. **Why the rollup table exists** — scanning millions of events on every dashboard load is too slow. Pre-compute daily summaries. Trade storage for read speed. This is intentional denormalization.
5. **Why JSONB for event properties** — varying metadata per event, no migration needed for new properties, GIN indexed for query performance.
6. **Why soft deletes on sites but not on events** — sites are user-facing (need undo capability), events are high-volume system data (no user scenario for undeletion, performance cost of filtering not justified).
7. **What ON DELETE CASCADE vs RESTRICT means** — cascade auto-cleans dependent data, restrict blocks deletion to prevent orphaned records. Choose based on whether children are meaningful without parent.
8. **What a migration file is vs clicking in the dashboard** — reproducible, version controlled, sequential, reversible. Anyone can replay migrations and get the exact same database.
