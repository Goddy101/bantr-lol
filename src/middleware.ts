import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const url = request.nextUrl;
  
  const isProtectedRoute = url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/duel') || url.pathname.startsWith('/rumble');
  const isAuthRoute = url.pathname.startsWith('/login');

  // --- OUR TERMINAL LOGS ---
  if (url.pathname.startsWith('/dashboard')) {
    console.log("=====================================");
    console.log("🚦 SOMEONE IS TRYING TO ENTER /dashboard");
    if (user) {
      console.log("✅ MIDDLEWARE: User found in cookies! Letting them in.");
    } else {
      console.log("❌ MIDDLEWARE: No User found in cookies! BOUNCING THEM BACK!");
    }
    console.log("=====================================");
  }

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
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};