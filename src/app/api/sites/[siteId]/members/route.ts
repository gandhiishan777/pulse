import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getSiteMembers, addMember } from '@/lib/queries/members';

const addMemberSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(['owner', 'admin', 'viewer']).optional().default('viewer'),
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

    const members = await getSiteMembers(supabase, siteId);
    return NextResponse.json({ members });
  } catch (err) {
    console.error('[GET /api/sites/[siteId]/members]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteContext) {
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

    const result = addMemberSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation error', details: result.error.flatten() },
        { status: 400 }
      );
    }

    await addMember(supabase, siteId, result.data.user_id, result.data.role);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/sites/[siteId]/members]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
