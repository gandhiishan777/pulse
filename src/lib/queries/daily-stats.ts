import type { ServerSupabaseClient } from '@/lib/supabase/server';
import type { DailyStat } from '@/lib/supabase/types';

export type SummaryStats = {
  total_views: number;
  total_visitors: number;
  avg_duration_ms: number | null;
  avg_bounce_rate: number | null;
};

function subtractDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

export async function getDailyStats(
  supabase: ServerSupabaseClient,
  siteId: string,
  days: number
): Promise<DailyStat[]> {
  const fromDate = subtractDays(days);

  const { data, error } = await supabase
    .from('daily_stats')
    .select('*')
    .eq('site_id', siteId)
    .gte('date', fromDate)
    .order('date', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getSummaryStats(
  supabase: ServerSupabaseClient,
  siteId: string,
  days: number
): Promise<SummaryStats> {
  const stats = await getDailyStats(supabase, siteId, days);

  if (stats.length === 0) {
    return { total_views: 0, total_visitors: 0, avg_duration_ms: null, avg_bounce_rate: null };
  }

  const total_views = stats.reduce((sum, row) => sum + row.total_views, 0);
  const total_visitors = stats.reduce((sum, row) => sum + row.unique_visitors, 0);

  const durRows = stats.filter((r) => r.avg_duration_ms !== null);
  const avg_duration_ms =
    durRows.length > 0
      ? Math.round(durRows.reduce((sum, r) => sum + r.avg_duration_ms!, 0) / durRows.length)
      : null;

  const bounceRows = stats.filter((r) => r.bounce_rate !== null);
  const avg_bounce_rate =
    bounceRows.length > 0
      ? Math.round(bounceRows.reduce((sum, r) => sum + r.bounce_rate!, 0) / bounceRows.length)
      : null;

  return { total_views, total_visitors, avg_duration_ms, avg_bounce_rate };
}
