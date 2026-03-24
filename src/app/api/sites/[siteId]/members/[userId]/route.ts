import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { updateMemberRole, removeMember } from '@/lib/queries/members';

const updateRoleSchema = z.object({
  role: z.enum(['owner', 'admin', 'viewer']),
});

type RouteContext = { params: Promise<{ siteId: string; userId: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { siteId, userId } = await params;
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

    const result = updateRoleSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation error', details: result.error.flatten() },
        { status: 400 }
      );
    }

    await updateMemberRole(supabase, siteId, userId, result.data.role);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[PATCH /api/sites/[siteId]/members/[userId]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { siteId, userId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await removeMember(supabase, siteId, userId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/sites/[siteId]/members/[userId]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
