import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  // 1. Create an unmodified response
  let supabaseResponse = NextResponse.next({
    request,
  });

  // 2. Initialize the Supabase Server Client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Update the request cookies
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          
          // Update the response cookies
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 3. Securely check if the user is authenticated
  // We use getUser() instead of getSession() because it contacts the Supabase server
  // to guarantee the token hasn't been revoked (e.g., if the user was banned).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 4. Define your protected areas
  const currentPath = request.nextUrl.pathname;
  
  const isProtectedRoute = 
    currentPath.startsWith('/dashboard') || 
    currentPath.startsWith('/duel/create') ||
    currentPath.startsWith('/partner-hub') ||
    currentPath.startsWith('/hq'); // Your admin panel

  // 5. The Bouncer Logic
  if (isProtectedRoute && !user) {
    // Unauthenticated users get kicked back to the login page (root path)
    const url = request.nextUrl.clone();
    url.pathname = '/';
    // Optional: Save where they were trying to go so you can redirect them back after OTP
    url.searchParams.set('redirectedFrom', currentPath); 
    return NextResponse.redirect(url);
  }

  // 6. Return the response with refreshed cookies
  return supabaseResponse;
}

// 7. Route Matcher: Tell Next.js which routes to run this middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - Images and SVGs
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};