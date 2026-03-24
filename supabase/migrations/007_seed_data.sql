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
  ('b1b2c3d4-0000-0000-0000-000000000001', CURRENT_DATE,     8, 3, 5, 3, 20514, 33, '/pricing',  'https://google.com'),
  ('b1b2c3d4-0000-0000-0000-000000000001', CURRENT_DATE - 1, 6, 2, 5, 2, 19800, 50, '/pricing',  'https://google.com'),
  ('b1b2c3d4-0000-0000-0000-000000000001', CURRENT_DATE - 2, 4, 3, 3, 0, 18000, 25, '/',         'https://google.com'),
  ('b1b2c3d4-0000-0000-0000-000000000001', CURRENT_DATE - 3, 3, 2, 3, 1, 20833, 33, '/pricing',  'https://linkedin.com'),
  ('b1b2c3d4-0000-0000-0000-000000000001', CURRENT_DATE - 4, 0, 0, 0, 0, NULL,  NULL, NULL,      NULL),
  ('b1b2c3d4-0000-0000-0000-000000000001', CURRENT_DATE - 5, 3, 2, 3, 0, 15167, 33, '/pricing',  'https://google.com'),
  ('b1b2c3d4-0000-0000-0000-000000000001', CURRENT_DATE - 6, 0, 0, 0, 0, NULL,  NULL, NULL,      NULL),
  ('b1b2c3d4-0000-0000-0000-000000000001', CURRENT_DATE - 7, 3, 1, 3, 0, 23667,  0,  '/pricing', 'https://producthunt.com');
