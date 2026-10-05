import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { locales, defaultLocale } from "@/lib/i18n/config";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

// Routes that require the user to be authenticated
const protectedPaths = ["/facility-manager", "/business-ops"];

// Routes that authenticated users should not see (login, register)
const guestOnlyPaths = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the current route is in the protected list
  const isProtected = protectedPaths.some((p) => pathname.includes(p));
  const isGuestOnly = guestOnlyPaths.some((p) => pathname.endsWith(p));

  // Detect locale from URL (vi or en) to redirect to the correct language page
  const currentLocale = pathname.startsWith("/en") ? "en" : "vi";
  // HttpOnly cookies set by the backend (see BE utils/cookie.util.ts). The access token
  // expires after 15 min, but a valid refresh token still means the session can be renewed.
  const token = request.cookies.get("accessToken") ?? request.cookies.get("refreshToken");

  // Already signed in → skip the login/register pages
  if (isGuestOnly && token) {
    return NextResponse.redirect(new URL(`/${currentLocale}`, request.url));
  }

  if (isProtected) {
    if (!token) {
      const loginUrl = new URL(`/${currentLocale}/login`, request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return intlMiddleware(request);
}

export const config = {
  // Exclude static files, API routes, and Next.js internals
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
