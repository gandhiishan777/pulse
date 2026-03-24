import { timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('[POST /api/cron/rollup] CRON_SECRET is not set');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const expected = `Bearer ${cronSecret}`;
  const provided = authHeader ?? '';
  const isValid =
    provided.length === expected.length &&
    timingSafeEqual(Buffer.from(provided), Buffer.from(expected));

  if (!isValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get('date');

  const date = dateParam ?? new Date().toISOString().split('T')[0];

  const { error } = await adminClient.rpc('compute_all_daily_stats', { p_date: date });

  if (error) {
    console.error('[POST /api/cron/rollup] RPC error:', error);
    return NextResponse.json({ error: 'Failed to compute daily stats' }, { status: 500 });
  }

  return NextResponse.json({ success: true, date });
}
