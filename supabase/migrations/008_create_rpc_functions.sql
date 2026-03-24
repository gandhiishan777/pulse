-- RPC functions called via supabase.rpc() from Next.js.
-- All functions are SECURITY DEFINER (run as owner, bypassing RLS for raw table reads)
-- and STABLE (no side effects, results cacheable within a transaction).
--
-- IMPORTANT: Because SECURITY DEFINER skips RLS, every function that reads
-- analytics data includes an explicit membership guard:
--   EXISTS (SELECT 1 FROM site_members WHERE site_id = p_site_id AND user_id = auth.uid())
-- This ensures only members of a site can query its data, even if called directly
-- via the Supabase client without going through the Next.js API layer.

-- ------------------------------------------------------------
-- get_top_pages
-- Returns the most-viewed paths for a site within p_days days.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_top_pages(
  p_site_id UUID,
  p_days    INT,
  p_limit   INT
)
RETURNS TABLE(path TEXT, views BIGINT, avg_duration NUMERIC)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    e.path,
    COUNT(*)                                    AS views,
    ROUND(AVG(e.duration_ms)::NUMERIC, 2)       AS avg_duration
  FROM events e
  WHERE
    e.site_id   = p_site_id
    AND e.timestamp > now() - (p_days || ' days')::interval
    AND EXISTS (
      SELECT 1 FROM site_members sm
      WHERE sm.site_id = p_site_id
        AND sm.user_id = auth.uid()
    )
  GROUP BY e.path
  ORDER BY views DESC
  LIMIT p_limit;
$$;

-- ------------------------------------------------------------
-- get_top_referrers
-- Returns the most common referrers for a site within p_days days.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_top_referrers(
  p_site_id UUID,
  p_days    INT,
  p_limit   INT
)
RETURNS TABLE(referrer TEXT, views BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    e.referrer,
    COUNT(*) AS views
  FROM events e
  WHERE
    e.site_id   = p_site_id
    AND e.timestamp > now() - (p_days || ' days')::interval
    AND e.referrer IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM site_members sm
      WHERE sm.site_id = p_site_id
        AND sm.user_id = auth.uid()
    )
  GROUP BY e.referrer
  ORDER BY views DESC
  LIMIT p_limit;
$$;

-- ------------------------------------------------------------
-- get_browser_breakdown
-- Returns pageview counts grouped by browser within p_days days.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_browser_breakdown(
  p_site_id UUID,
  p_days    INT
)
RETURNS TABLE(browser TEXT, views BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    e.properties->>'browser' AS browser,
    COUNT(*)                  AS views
  FROM events e
  WHERE
    e.site_id   = p_site_id
    AND e.timestamp > now() - (p_days || ' days')::interval
    AND EXISTS (
      SELECT 1 FROM site_members sm
      WHERE sm.site_id = p_site_id
        AND sm.user_id = auth.uid()
    )
  GROUP BY browser
  ORDER BY views DESC;
$$;

-- ------------------------------------------------------------
-- get_country_breakdown
-- Returns pageview counts grouped by country within p_days days.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_country_breakdown(
  p_site_id UUID,
  p_days    INT
)
RETURNS TABLE(country TEXT, views BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    e.properties->>'country' AS country,
    COUNT(*)                  AS views
  FROM events e
  WHERE
    e.site_id   = p_site_id
    AND e.timestamp > now() - (p_days || ' days')::interval
    AND EXISTS (
      SELECT 1 FROM site_members sm
      WHERE sm.site_id = p_site_id
        AND sm.user_id = auth.uid()
    )
  GROUP BY country
  ORDER BY views DESC;
$$;

-- ------------------------------------------------------------
-- get_os_breakdown
-- Returns pageview counts grouped by OS within p_days days.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_os_breakdown(
  p_site_id UUID,
  p_days    INT
)
RETURNS TABLE(os TEXT, views BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    e.properties->>'os' AS os,
    COUNT(*)             AS views
  FROM events e
  WHERE
    e.site_id   = p_site_id
    AND e.timestamp > now() - (p_days || ' days')::interval
    AND EXISTS (
      SELECT 1 FROM site_members sm
      WHERE sm.site_id = p_site_id
        AND sm.user_id = auth.uid()
    )
  GROUP BY os
  ORDER BY views DESC;
$$;

-- ------------------------------------------------------------
-- get_bounce_rate
-- Returns bounced session count, total session count, and
-- the calculated bounce rate percentage within p_days days.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_bounce_rate(
  p_site_id UUID,
  p_days    INT
)
RETURNS TABLE(bounced BIGINT, total BIGINT, bounce_rate NUMERIC)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    COUNT(*) FILTER (WHERE s.is_bounce = true)                        AS bounced,
    COUNT(*)                                                           AS total,
    ROUND(
      100.0 * COUNT(*) FILTER (WHERE s.is_bounce = true)
      / NULLIF(COUNT(*), 0),
      1
    )                                                                  AS bounce_rate
  FROM sessions s
  WHERE
    s.site_id    = p_site_id
    AND s.started_at > now() - (p_days || ' days')::interval
    AND EXISTS (
      SELECT 1 FROM site_members sm
      WHERE sm.site_id = p_site_id
        AND sm.user_id = auth.uid()
    );
$$;

-- ------------------------------------------------------------
-- get_hourly_breakdown
-- Returns view counts bucketed by hour for the last 24 hours.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_hourly_breakdown(
  p_site_id UUID
)
RETURNS TABLE(hour TIMESTAMPTZ, views BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    date_trunc('hour', e.timestamp) AS hour,
    COUNT(*)                         AS views
  FROM events e
  WHERE
    e.site_id   = p_site_id
    AND e.timestamp > now() - interval '24 hours'
    AND EXISTS (
      SELECT 1 FROM site_members sm
      WHERE sm.site_id = p_site_id
        AND sm.user_id = auth.uid()
    )
  GROUP BY hour
  ORDER BY hour;
$$;
