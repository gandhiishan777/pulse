import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

/**
 * Service-role client that bypasses Row Level Security.
 * Must NEVER be used in client components or exposed to the browser.
 * Only import this in server-only files (Route Handlers, Server Actions, cron jobs).
 */
export const adminClient = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export type AdminSupabaseClient = typeof adminClient;
