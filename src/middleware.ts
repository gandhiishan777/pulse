import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle OPTIONS preflight for /api/event
  if (pathname === '/api/event' && request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]
        ) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(
              name,
              value,
              options as Parameters<typeof supabaseResponse.cookies.set>[2]
            )
          );
        },
      },
    }
  );

  // Refresh session — must be called before any logic that reads user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect /api/sites/* with session auth.
  // /api/cron/* is intentionally excluded here — it authenticates via its own
  // Bearer token (CRON_SECRET) inside the route handler, not via user session.
  const isSessionProtectedApi = pathname.startsWith('/api/sites');

  if (isSessionProtectedApi && !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Add CORS headers to /api/event responses
  if (pathname === '/api/event') {
    supabaseResponse.headers.set('Access-Control-Allow-Origin', '*');
    supabaseResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    supabaseResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
