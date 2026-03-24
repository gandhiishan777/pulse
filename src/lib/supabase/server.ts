import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from './types';

export type ServerSupabaseClient = SupabaseClient<Database>;

export async function createClient(): Promise<ServerSupabaseClient> {
  const cookieStore = await cookies();

  const client = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
            );
          } catch {
            // setAll called from a Server Component — cookies cannot be set here.
            // The middleware handles session refresh instead.
          }
        },
      },
    }
  );

  // The SSR package's d.ts was compiled against an older 3-generic SupabaseClient.
  // At runtime these are identical — the cast just aligns TypeScript's view.
  return client as unknown as ServerSupabaseClient;
}
