import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // 1. Create an unmodified response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 2. Initialize the Supabase Client using the new setAll/getAll standard
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Update the request cookies first
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          
          // Re-create the response ONCE with the updated request headers
          response = NextResponse.next({
            request,
          });
          
          // Safely attach ALL cookie chunks to the final response without overwriting
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 3. Get the current user session securely
  const { data: { user } } = await supabase.auth.getUser();

  const url = request.nextUrl;
  
  // Define which paths require the user to be logged in
  // NOTE: I added '/rumble' here to protect your new Rumble routes!
  const isProtectedRoute = url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/duel') || url.pathname.startsWith('/rumble');
  const isAuthRoute = url.pathname.startsWith('/login');

  // 4. The Bouncer Logic
  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (user && url.pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};