import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getSiteById, updateSite, softDeleteSite } from '@/lib/queries/sites';

const updateSiteSchema = z.object({
  domain: z.string().min(1).max(253).optional(),
  plan: z.enum(['free', 'pro', 'enterprise']).optional(),
});

type RouteContext = { params: Promise<{ siteId: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { siteId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const site = await getSiteById(supabase, siteId);
    return NextResponse.json({ site });
  } catch (err) {
    console.error('[GET /api/sites/[siteId]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { siteId } = await params;
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

    const result = updateSiteSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation error', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const site = await updateSite(supabase, siteId, result.data);
    return NextResponse.json({ site });
  } catch (err) {
    console.error('[PATCH /api/sites/[siteId]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { siteId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await softDeleteSite(supabase, siteId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/sites/[siteId]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
