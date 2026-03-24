import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getBrowserBreakdown, getOsBreakdown, getCountryBreakdown } from '@/lib/queries/events';

type RouteContext = { params: Promise<{ siteId: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { siteId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = Math.min(365, Math.max(1, parseInt(searchParams.get('days') ?? '7', 10) || 7));

    const [browsers, os, countries] = await Promise.all([
      getBrowserBreakdown(supabase, siteId, days),
      getOsBreakdown(supabase, siteId, days),
      getCountryBreakdown(supabase, siteId, days),
    ]);

    return NextResponse.json({ browsers, os, countries });
  } catch (err) {
    console.error('[GET /api/sites/[siteId]/stats/devices]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
