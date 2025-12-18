import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware - Intent-aware route protection
 * 
 * Key principles:
 * 1. Public routes require no auth
 * 2. /become-a-host is a TRANSITIONAL route (anyone logged in can access)
 * 3. /guest/* requires auth (redirects with mode=guest)
 * 4. /dashboard/* requires auth + host role (redirects non-hosts to become-a-host)
 * 5. Never redirect arbitrarily based on role alone
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  // ============================================
  // PUBLIC ROUTES - No auth required
  // ============================================
  const publicRoutes = [
    "/",
    "/listings",
    "/login",
    "/signup",
    "/forgot-password",
  ];
  
  const isPublicRoute = 
    publicRoutes.includes(pathname) || 
    pathname.startsWith("/listings/") ||
    pathname.startsWith("/api/");

  if (isPublicRoute) {
    return response;
  }

  // ============================================
  // AUTH REQUIRED ROUTES
  // ============================================
  
  // --- BECOME-A-HOST: Transitional route ---
  // Anyone logged in can access (to begin host onboarding)
  // Not logged in → redirect to login with host mode
  if (pathname.startsWith("/become-a-host")) {
    if (!user) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("mode", "host");
      redirectUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(redirectUrl);
    }
    // User is logged in → allow access (page handles rest)
    return response;
  }

  // --- GUEST ROUTES: /guest/* ---
  // Requires auth, redirects with guest mode
  if (pathname.startsWith("/guest")) {
    if (!user) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("mode", "guest");
      redirectUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(redirectUrl);
    }
    // User is logged in → allow access
    // (All users have guest role by default)
    return response;
  }

  // --- HOST ROUTES: /dashboard/* ---
  // Requires auth + host role
  if (pathname.startsWith("/dashboard")) {
    if (!user) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("mode", "host");
      redirectUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Check if user has host role
    const { data: profile } = await supabase
      .from("profiles")
      .select("roles")
      .eq("id", user.id)
      .single();

    const roles = profile?.roles || [];
    const isHost = roles.includes("host");

    if (!isHost) {
      // Not a host → redirect to onboarding (helpful, not blocking)
      return NextResponse.redirect(new URL("/become-a-host", request.url));
    }

    // User is a host → allow access
    return response;
  }

  // ============================================
  // DEFAULT: Allow access
  // ============================================
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
