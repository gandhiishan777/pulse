import type { ServerSupabaseClient } from '@/lib/supabase/server';
import type { AdminSupabaseClient } from '@/lib/supabase/admin';

export type BounceRateResult = {
  bounced: number;
  total: number;
  bounce_rate: number;
};

export async function getBounceRate(
  supabase: ServerSupabaseClient,
  siteId: string,
  days: number
): Promise<BounceRateResult | null> {
  const { data, error } = await supabase.rpc('get_bounce_rate', {
    p_site_id: siteId,
    p_days: days,
  });

  if (error) throw error;
  const rows = data as BounceRateResult[] | null;
  return rows?.[0] ?? null;
}

export async function findOrCreateSession(
  adminSupabase: AdminSupabaseClient,
  siteId: string,
  visitorId: string,
  referrer: string | null
): Promise<string> {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  const { data: existing, error: findError } = await adminSupabase
    .from('sessions')
    .select('id, page_count')
    .eq('site_id', siteId)
    .eq('visitor_id', visitorId)
    .is('ended_at', null)
    .gte('started_at', thirtyMinutesAgo)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (findError) throw findError;

  if (existing) {
    // Do NOT set ended_at here — doing so would cause the next pageview's
    // `.is('ended_at', null)` filter to miss this session and open a new one,
    // breaking multi-page session tracking. ended_at is reserved for explicit
    // session termination (e.g. a cleanup job after true inactivity).
    const { error: updateError } = await adminSupabase
      .from('sessions')
      .update({
        page_count: existing.page_count + 1,
        is_bounce: false,
      })
      .eq('id', existing.id);

    if (updateError) throw updateError;
    return existing.id;
  }

  const { data: newSession, error: insertError } = await adminSupabase
    .from('sessions')
    .insert({
      site_id: siteId,
      visitor_id: visitorId,
      referrer,
      is_bounce: true,
      page_count: 1,
    })
    .select('id')
    .single();

  if (insertError) throw insertError;
  return newSession.id;
}
