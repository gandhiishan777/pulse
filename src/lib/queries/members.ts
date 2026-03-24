import type { ServerSupabaseClient } from '@/lib/supabase/server';
import type { SiteRole, User } from '@/lib/supabase/types';

export type MemberWithUser = {
  user_id: string;
  site_id: string;
  role: SiteRole;
  created_at: string;
  user: Pick<User, 'id' | 'name' | 'email' | 'avatar_url'>;
};

export async function getSiteMembers(
  supabase: ServerSupabaseClient,
  siteId: string
): Promise<MemberWithUser[]> {
  const { data, error } = await supabase
    .from('site_members')
    .select('user_id, site_id, role, created_at, users!inner(id, name, email, avatar_url)')
    .eq('site_id', siteId);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    user_id: row.user_id,
    site_id: row.site_id,
    role: row.role as SiteRole,
    created_at: row.created_at,
    user: row.users as unknown as Pick<User, 'id' | 'name' | 'email' | 'avatar_url'>,
  }));
}

export async function addMember(
  supabase: ServerSupabaseClient,
  siteId: string,
  userId: string,
  role: SiteRole
): Promise<void> {
  const { error } = await supabase.from('site_members').insert({
    site_id: siteId,
    user_id: userId,
    role,
  });

  if (error) throw error;
}

export async function removeMember(
  supabase: ServerSupabaseClient,
  siteId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('site_members')
    .delete()
    .eq('site_id', siteId)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function updateMemberRole(
  supabase: ServerSupabaseClient,
  siteId: string,
  userId: string,
  role: SiteRole
): Promise<void> {
  const { error } = await supabase
    .from('site_members')
    .update({ role })
    .eq('site_id', siteId)
    .eq('user_id', userId);

  if (error) throw error;
}
