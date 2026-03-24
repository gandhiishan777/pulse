import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTopPages } from '@/lib/queries/events';

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
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '10', 10) || 10));

    const pages = await getTopPages(supabase, siteId, days, limit);
    return NextResponse.json({ pages });
  } catch (err) {
    console.error('[GET /api/sites/[siteId]/stats/pages]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
