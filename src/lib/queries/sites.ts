import type { ServerSupabaseClient } from '@/lib/supabase/server';
import type { Site, SiteInsert, SiteUpdate, SitePlan } from '@/lib/supabase/types';

export type SiteWithRole = Site & { role: string };

export async function getUserSites(supabase: ServerSupabaseClient): Promise<SiteWithRole[]> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('site_members')
    .select('role, sites!inner(id, domain, created_by, plan, deleted_at, created_at, updated_at)')
    .eq('user_id', user.id)
    .is('sites.deleted_at', null);

  if (error) throw error;

  return (data ?? []).map((row) => {
    const site = row.sites as unknown as Site;
    return { ...site, role: row.role };
  });
}

export async function getSiteById(
  supabase: ServerSupabaseClient,
  siteId: string
): Promise<Site> {
  const { data, error } = await supabase
    .from('sites')
    .select('*')
    .eq('id', siteId)
    .is('deleted_at', null)
    .single();

  if (error) throw error;
  return data;
}

export async function createSite(
  supabase: ServerSupabaseClient,
  data: { domain: string; plan?: SitePlan }
): Promise<Site> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error('Not authenticated');

  const insert: SiteInsert = {
    domain: data.domain,
    created_by: user.id,
    plan: data.plan ?? 'free',
  };

  const { data: site, error: siteError } = await supabase
    .from('sites')
    .insert(insert)
    .select('*')
    .single();

  if (siteError) throw siteError;

  const { error: memberError } = await supabase.from('site_members').insert({
    user_id: user.id,
    site_id: site.id,
    role: 'owner',
  });

  if (memberError) throw memberError;

  return site;
}

export async function updateSite(
  supabase: ServerSupabaseClient,
  siteId: string,
  data: Pick<SiteUpdate, 'domain' | 'plan'>
): Promise<Site> {
  const { data: site, error } = await supabase
    .from('sites')
    .update(data)
    .eq('id', siteId)
    .is('deleted_at', null)
    .select('*')
    .single();

  if (error) throw error;
  return site;
}

export async function softDeleteSite(
  supabase: ServerSupabaseClient,
  siteId: string
): Promise<void> {
  const { error } = await supabase
    .from('sites')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', siteId);

  if (error) throw error;
}
