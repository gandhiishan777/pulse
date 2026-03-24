import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getUserSites, createSite } from '@/lib/queries/sites';

const createSiteSchema = z.object({
  domain: z.string().min(1).max(253),
  plan: z.enum(['free', 'pro', 'enterprise']).optional(),
});

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sites = await getUserSites(supabase);
    return NextResponse.json({ sites });
  } catch (err) {
    console.error('[GET /api/sites]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const result = createSiteSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation error', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const site = await createSite(supabase, result.data);
    return NextResponse.json({ site }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/sites]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
