import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // 1. Create an unmodified response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 2. Initialize the Supabase Client specifically for Middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // 3. Get the current user session securely
  const { data: { user } } = await supabase.auth.getUser();

  const url = request.nextUrl;
  
  // Define which paths require the user to be logged in
  const isProtectedRoute = url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/duel');
  const isAuthRoute = url.pathname.startsWith('/login');

  // 4. The Bouncer Logic
  if (!user && isProtectedRoute) {
    // KICK OUT: Not logged in but trying to access the arena
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (user && isAuthRoute) {
    // REDIRECT: Already logged in, no need to see the login page again
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (user && url.pathname === '/') {
    // REDIRECT: Send active users straight to the dashboard from the landing page
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Allow the request to continue
  return response;
}

// 5. Config to tell Next.js which routes to run this on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/webhooks (CRITICAL: We must not block payment webhooks!)
     * - images, SVGs, etc.
     */
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};