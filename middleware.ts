import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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

  // Public routes - accessible to everyone
  const publicRoutes = [
    "/",
    "/search",
    "/login",
    "/signup",
    "/forgot-password",
  ];
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith("/listings/"),
  );

  if (isPublicRoute) {
    return response;
  }

  // Auth required for protected routes
  if (!user) {
    const guestRoutes = ["/guest"];
    const hostRoutes = ["/dashboard", "/become-a-host"];

    if (
      guestRoutes.some((route) => pathname.startsWith(route)) ||
      hostRoutes.some((route) => pathname.startsWith(route))
    ) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(redirectUrl);
    }
    return response;
  }

  // Get user roles
  const { data: profile } = await supabase
    .from("profiles")
    .select("roles")
    .eq("id", user.id)
    .single();

  const roles = profile?.roles || [];
  const isGuest = roles.includes("guest");
  const isHost = roles.includes("host");

  // STRICT ROLE SEPARATION - Guest routes (/guest/*)
  if (pathname.startsWith("/guest")) {
    if (!isGuest) {
      // Unauthorized access redirects to home
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // STRICT ROLE SEPARATION - Host routes (/dashboard/*, /become-a-host/*)
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/become-a-host")) {
    if (!isHost) {
      // Unauthorized access redirects to home
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
