import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { locales, defaultLocale } from "@/lib/i18n/config";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

// Routes that require the user to be authenticated
const protectedPaths = ["/facility-manager", "/facility-staff"];

// Routes that authenticated users should not see (login, register)
const guestOnlyPaths = ["/login", "/register"];

const ROLE_HOME: Record<string, string> = {
  system_admin: "system-admin",
  business_ops_manager: "business-ops",
  facility_manager: "facility-manager",
  facility_staff: "facility-staff",
};

function decodeJwtPayload(tokenString?: string): Record<string, unknown> | null {
  if (!tokenString) return null;
  try {
    const parts = tokenString.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function isJwtExpired(tokenString?: string): boolean {
  if (!tokenString) return true;
  const payload = decodeJwtPayload(tokenString);
  if (!payload) return false;
  if (typeof payload.exp === "number" && payload.exp * 1000 < Date.now()) {
    return true;
  }
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Check if the current route is in the protected list
  const isProtected = protectedPaths.some((p) => pathname.includes(p));
  const isGuestOnly = guestOnlyPaths.some((p) => pathname.endsWith(p));

  // Detect locale from URL (vi or en) to redirect to the correct language page
  const currentLocale = pathname.startsWith("/en") ? "en" : "vi";
  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;
  const hasToken = Boolean(accessToken || refreshToken);

  // A session is active only if at least one token is present and not expired
  const isSessionActive = Boolean(
    (accessToken && !isJwtExpired(accessToken)) || (refreshToken && !isJwtExpired(refreshToken))
  );

  // Already signed in with active session → skip the login/register pages
  if (isGuestOnly && isSessionActive) {
    const redirectParam = searchParams.get("redirect");
    if (redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//")) {
      return NextResponse.redirect(new URL(redirectParam, request.url));
    }
    const payload = decodeJwtPayload(accessToken) ?? decodeJwtPayload(refreshToken);
    const role = typeof payload?.role === "string" ? payload.role.toLowerCase() : "";
    const home = ROLE_HOME[role];
    return NextResponse.redirect(
      new URL(`/${currentLocale}${home ? `/${home}` : ""}`, request.url)
    );
  }

  if (isProtected) {
    if (!hasToken || !isSessionActive) {
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
