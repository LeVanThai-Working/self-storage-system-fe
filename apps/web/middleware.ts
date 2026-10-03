import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { locales, defaultLocale } from "@/lib/i18n/config";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

// Routes that require the user to be authenticated
const protectedPaths = ["/facility-manager", "/business-ops"]; // Tạm thời bỏ "/system-admin" để code giao diện

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the current route is in the protected list
  const isProtected = protectedPaths.some((p) => pathname.includes(p));

  if (isProtected) {
    // Access token stored as an HttpOnly cookie (name depends on backend config)
    const token = request.cookies.get("access_token");

    if (!token) {
      // Detect locale from URL (vi or en) to redirect to the correct language login page
      const currentLocale = pathname.startsWith("/en") ? "en" : "vi";
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
