import { NextResponse } from 'next/server';
import { z } from 'zod';
import { adminClient } from '@/lib/supabase/admin';
import { findOrCreateSession } from '@/lib/queries/sessions';

const eventSchema = z.object({
  site_id: z.string().uuid(),
  visitor_id: z.string().min(1).max(100),
  type: z.enum(['pageview', 'custom_event']),
  path: z.string().min(1).max(2048),
  referrer: z.string().url().optional().nullable(),
  duration_ms: z.number().int().min(0).max(86400000).optional().nullable(),
  properties: z.record(z.unknown()).optional().default({}),
});

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const result = eventSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation error', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { site_id, visitor_id, type, path, referrer, duration_ms, properties } = result.data;

    // Verify the site exists and is active
    const { data: site, error: siteError } = await adminClient
      .from('sites')
      .select('id, domain')
      .eq('id', site_id)
      .is('deleted_at', null)
      .single();

    if (siteError || !site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    const sessionId = await findOrCreateSession(adminClient, site_id, visitor_id, referrer ?? null);

    const { error: insertError } = await adminClient.from('events').insert({
      site_id,
      session_id: sessionId,
      type,
      path,
      referrer: referrer ?? null,
      duration_ms: duration_ms ?? null,
      properties: properties ?? {},
    });

    if (insertError) throw insertError;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
