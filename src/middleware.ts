import { NextResponse, type NextRequest } from "next/server";
import { isPublicPath } from "@/lib/auth/public-routes";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let user: Awaited<ReturnType<typeof updateSession>>["user"];
  let response: NextResponse;
  try {
    ({ response, user } = await updateSession(request));
  } catch (error) {
    console.error("[middleware] session lookup failed:", error);
    // Free-tier Supabase projects can be briefly unreachable; serve a
    // friendly fallback instead of a generic 500. Avoid loops by letting
    // /unavailable through without re-checking auth.
    if (pathname === "/unavailable") {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname = "/unavailable";
    return NextResponse.rewrite(url);
  }

  // Block unauthenticated access to non-public routes.
  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Signed-in users shouldn't see the login / forgot pages.
  // (Intentionally not redirecting away from /reset-password or /auth/callback,
  // since the reset flow authenticates the user before landing there.)
  if (user && (pathname === "/login" || pathname === "/forgot-password")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Run on everything except Next internals and common static assets.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
