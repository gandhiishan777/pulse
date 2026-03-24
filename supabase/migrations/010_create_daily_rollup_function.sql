-- compute_daily_stats(p_site_id, p_date)
-- Recomputes a single daily_stats row from raw events and sessions data,
-- then upserts the result. Intended to be called by a nightly cron job
-- via the service role, so SECURITY DEFINER is required.

CREATE OR REPLACE FUNCTION compute_daily_stats(
  p_site_id UUID,
  p_date    DATE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_views      INTEGER;
  v_unique_visitors  INTEGER;
  v_unique_pages     INTEGER;
  v_avg_duration_ms  INTEGER;
  v_top_page         TEXT;
  v_top_referrer     TEXT;
  v_total_sessions   INTEGER;
  v_bounce_rate      INTEGER;
BEGIN
  -- --------------------------------------------------------
  -- Metrics derived from events
  -- --------------------------------------------------------
  SELECT
    COUNT(*)::INTEGER,
    COUNT(DISTINCT COALESCE(s.visitor_id, e.properties->>'visitor_id'))::INTEGER,
    COUNT(DISTINCT e.path)::INTEGER,
    ROUND(AVG(e.duration_ms) FILTER (WHERE e.duration_ms IS NOT NULL))::INTEGER
  INTO
    v_total_views,
    v_unique_visitors,
    v_unique_pages,
    v_avg_duration_ms
  FROM events e
  LEFT JOIN sessions s ON s.id = e.session_id
  WHERE
    e.site_id         = p_site_id
    AND e.timestamp::date = p_date;

  -- Top page: path with the highest event count for the day
  SELECT path
  INTO v_top_page
  FROM events
  WHERE
    site_id         = p_site_id
    AND timestamp::date = p_date
  GROUP BY path
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  -- Top referrer: non-null referrer with the highest event count for the day
  SELECT referrer
  INTO v_top_referrer
  FROM events
  WHERE
    site_id         = p_site_id
    AND timestamp::date = p_date
    AND referrer IS NOT NULL
  GROUP BY referrer
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  -- --------------------------------------------------------
  -- Metrics derived from sessions
  -- --------------------------------------------------------
  SELECT
    COUNT(*)::INTEGER,
    ROUND(
      100.0 * COUNT(*) FILTER (WHERE is_bounce = true)
      / NULLIF(COUNT(*), 0)
    )::INTEGER
  INTO
    v_total_sessions,
    v_bounce_rate
  FROM sessions
  WHERE
    site_id          = p_site_id
    AND started_at::date = p_date;

  -- --------------------------------------------------------
  -- Upsert into daily_stats
  -- --------------------------------------------------------
  INSERT INTO daily_stats (
    site_id,
    date,
    total_views,
    unique_visitors,
    unique_pages,
    total_sessions,
    avg_duration_ms,
    bounce_rate,
    top_page,
    top_referrer
  ) VALUES (
    p_site_id,
    p_date,
    COALESCE(v_total_views,     0),
    COALESCE(v_unique_visitors, 0),
    COALESCE(v_unique_pages,    0),
    COALESCE(v_total_sessions,  0),
    v_avg_duration_ms,
    v_bounce_rate,
    v_top_page,
    v_top_referrer
  )
  ON CONFLICT (site_id, date) DO UPDATE SET
    total_views      = EXCLUDED.total_views,
    unique_visitors  = EXCLUDED.unique_visitors,
    unique_pages     = EXCLUDED.unique_pages,
    total_sessions   = EXCLUDED.total_sessions,
    avg_duration_ms  = EXCLUDED.avg_duration_ms,
    bounce_rate      = EXCLUDED.bounce_rate,
    top_page         = EXCLUDED.top_page,
    top_referrer     = EXCLUDED.top_referrer;
END;
$$;

-- --------------------------------------------------------
-- compute_all_daily_stats(p_date)
-- Iterates over every active (non-deleted) site and calls
-- compute_daily_stats for each one. Designed for nightly cron.
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION compute_all_daily_stats(
  p_date DATE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id FROM sites WHERE deleted_at IS NULL
  LOOP
    PERFORM compute_daily_stats(r.id, p_date);
  END LOOP;
END;
$$;
