-- Row-Level Security policies for all 6 tables.
-- The ingestion API uses the service role key, which bypasses RLS entirely,
-- so no service-role INSERT policies are needed on analytics tables.

-- ============================================================
-- users
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can only read their own profile.
CREATE POLICY users_select_own
  ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Users can only update their own profile.
CREATE POLICY users_update_own
  ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- sites
-- ============================================================
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

-- A user can see a site only if they are a member AND the site is not soft-deleted.
CREATE POLICY sites_select_members
  ON sites
  FOR SELECT
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM site_members
      WHERE site_members.site_id = sites.id
        AND site_members.user_id = auth.uid()
    )
  );

-- Any authenticated user can create a new site.
CREATE POLICY sites_insert_authenticated
  ON sites
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Only owners and admins can update non-deleted site details.
CREATE POLICY sites_update_owner_admin
  ON sites
  FOR UPDATE
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM site_members
      WHERE site_members.site_id = sites.id
        AND site_members.user_id = auth.uid()
        AND site_members.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM site_members
      WHERE site_members.site_id = sites.id
        AND site_members.user_id = auth.uid()
        AND site_members.role IN ('owner', 'admin')
    )
  );

-- No DELETE policy — hard deletes are prevented; use soft deletes (deleted_at).

-- ============================================================
-- site_members
-- ============================================================
ALTER TABLE site_members ENABLE ROW LEVEL SECURITY;

-- Members can see all other members of sites they belong to.
CREATE POLICY site_members_select_own_sites
  ON site_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM site_members sm
      WHERE sm.site_id = site_members.site_id
        AND sm.user_id = auth.uid()
    )
  );

-- Only owners and admins of a site can add new members.
CREATE POLICY site_members_insert_owner_admin
  ON site_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM site_members sm
      WHERE sm.site_id = site_members.site_id
        AND sm.user_id = auth.uid()
        AND sm.role IN ('owner', 'admin')
    )
  );

-- Only owners can change member roles.
CREATE POLICY site_members_update_owner
  ON site_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM site_members sm
      WHERE sm.site_id = site_members.site_id
        AND sm.user_id = auth.uid()
        AND sm.role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM site_members sm
      WHERE sm.site_id = site_members.site_id
        AND sm.user_id = auth.uid()
        AND sm.role = 'owner'
    )
  );

-- Owners and admins can remove any member; users can remove themselves.
CREATE POLICY site_members_delete_owner_admin_or_self
  ON site_members
  FOR DELETE
  USING (
    -- The user is removing themselves
    site_members.user_id = auth.uid()
    OR
    -- The user is an owner or admin of the same site
    EXISTS (
      SELECT 1
      FROM site_members sm
      WHERE sm.site_id = site_members.site_id
        AND sm.user_id = auth.uid()
        AND sm.role IN ('owner', 'admin')
    )
  );

-- ============================================================
-- sessions  (read-only via RLS; writes go through service role)
-- ============================================================
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY sessions_select_site_members
  ON sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM site_members
      WHERE site_members.site_id = sessions.site_id
        AND site_members.user_id = auth.uid()
    )
  );

-- ============================================================
-- events  (read-only via RLS; writes go through service role)
-- ============================================================
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY events_select_site_members
  ON events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM site_members
      WHERE site_members.site_id = events.site_id
        AND site_members.user_id = auth.uid()
    )
  );

-- ============================================================
-- daily_stats  (read-only via RLS; writes go through service role)
-- ============================================================
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY daily_stats_select_site_members
  ON daily_stats
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM site_members
      WHERE site_members.site_id = daily_stats.site_id
        AND site_members.user_id = auth.uid()
    )
  );
