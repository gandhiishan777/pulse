import type { ServerSupabaseClient } from '@/lib/supabase/server';

export type TopPage = { path: string; views: number; avg_duration: number };
export type TopReferrer = { referrer: string; views: number };
export type BrowserBreakdown = { browser: string; views: number };
export type CountryBreakdown = { country: string; views: number };
export type OsBreakdown = { os: string; views: number };
export type HourlyBreakdown = { hour: string; views: number };

export async function getTopPages(
  supabase: ServerSupabaseClient,
  siteId: string,
  days: number,
  limit: number
): Promise<TopPage[]> {
  const { data, error } = await supabase.rpc('get_top_pages', {
    p_site_id: siteId,
    p_days: days,
    p_limit: limit,
  });

  if (error) throw error;
  return (data ?? []) as TopPage[];
}

export async function getTopReferrers(
  supabase: ServerSupabaseClient,
  siteId: string,
  days: number,
  limit: number
): Promise<TopReferrer[]> {
  const { data, error } = await supabase.rpc('get_top_referrers', {
    p_site_id: siteId,
    p_days: days,
    p_limit: limit,
  });

  if (error) throw error;
  return (data ?? []) as TopReferrer[];
}

export async function getBrowserBreakdown(
  supabase: ServerSupabaseClient,
  siteId: string,
  days: number
): Promise<BrowserBreakdown[]> {
  const { data, error } = await supabase.rpc('get_browser_breakdown', {
    p_site_id: siteId,
    p_days: days,
  });

  if (error) throw error;
  return (data ?? []) as BrowserBreakdown[];
}

export async function getCountryBreakdown(
  supabase: ServerSupabaseClient,
  siteId: string,
  days: number
): Promise<CountryBreakdown[]> {
  const { data, error } = await supabase.rpc('get_country_breakdown', {
    p_site_id: siteId,
    p_days: days,
  });

  if (error) throw error;
  return (data ?? []) as CountryBreakdown[];
}

export async function getOsBreakdown(
  supabase: ServerSupabaseClient,
  siteId: string,
  days: number
): Promise<OsBreakdown[]> {
  const { data, error } = await supabase.rpc('get_os_breakdown', {
    p_site_id: siteId,
    p_days: days,
  });

  if (error) throw error;
  return (data ?? []) as OsBreakdown[];
}

export async function getHourlyBreakdown(
  supabase: ServerSupabaseClient,
  siteId: string
): Promise<HourlyBreakdown[]> {
  const { data, error } = await supabase.rpc('get_hourly_breakdown', {
    p_site_id: siteId,
  });

  if (error) throw error;
  return (data ?? []) as HourlyBreakdown[];
}
