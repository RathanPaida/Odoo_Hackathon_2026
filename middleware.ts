// middleware.ts
// Protects authenticated routes and enforces AssetFlow RBAC.
// Runs on the Edge runtime, so it only uses `jose` (edge-safe) JWT verification
// and the pure role/permission helpers — no Prisma / DB calls here.
import { NextRequest, NextResponse } from "next/server";
import {
  verifyAccessToken,
  verifyRefreshToken,
  signAccessToken,
} from "@/lib/auth/jwt";
import {
  DASHBOARD_ROUTE_ROLE,
  SUPER_ROLES,
  dashboardForRole,
  isRole,
} from "@/lib/auth/roles";

const ACCESS_COOKIE = "access_token";
const REFRESH_COOKIE = "refresh_token";

// Routes that require authentication.
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/profile",
  "/settings",
];

// Routes only reachable when logged OUT (guests).
const GUEST_ONLY = ["/login", "/register"];

function parseExpiryToSeconds(value: string): number {
  const m = value.trim().match(/^(\d+)\s*(s|m|h|d)?$/);
  if (!m) return 60 * 15;
  const n = parseInt(m[1], 10);
  const mult = m[2] === "d" ? 86400 : m[2] === "h" ? 3600 : m[2] === "m" ? 60 : 1;
  return n * mult;
}
const ACCESS_MAX = parseExpiryToSeconds(
  process.env.ACCESS_TOKEN_EXPIRES_IN ?? "15m"
);

// Resolve an authenticated context: returns the access-token claims (with
// `role`) and, when a valid refresh token was used to mint a fresh access
// token, the response that carries the new cookie.
async function resolveAuth(req: NextRequest) {
  const accessToken = req.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;

  const access = await verifyAccessToken(accessToken ?? "");
  if (access) return { claims: access, response: null as NextResponse | null };

  // Access expired — try the refresh token (stateless check) and re-issue.
  if (refreshToken) {
    const rt = await verifyRefreshToken(refreshToken);
    if (rt) {
      const newAccess = await signAccessToken({
        sub: rt.sub,
        email: rt.email,
        role: rt.role,
      });
      const res = NextResponse.next();
      res.cookies.set(ACCESS_COOKIE, newAccess, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: ACCESS_MAX,
      });
      return { claims: rt, response: res };
    }
  }
  return { claims: null, response: null };
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  const isGuestOnly = GUEST_ONLY.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  // --- Guest-only routes: redirect to the role dashboard if already logged in ---
  if (isGuestOnly) {
    const { claims } = await resolveAuth(req);
    if (claims?.role && isRole(claims.role)) {
      return NextResponse.redirect(
        new URL(dashboardForRole(claims.role), req.url)
      );
    }
    return NextResponse.next();
  }

  if (!isProtected) return NextResponse.next();

  // --- Protected routes ---
  const { claims, response } = await resolveAuth(req);
  if (!claims) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { ok: false, message: "Unauthorized." },
        { status: 401 }
      );
    }
    const url = new URL("/login", req.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  const role = isRole(claims.role) ? claims.role : "EMPLOYEE";

  // Root dashboard -> the user's own role dashboard.
  if (pathname === "/dashboard") {
    return NextResponse.redirect(new URL(dashboardForRole(role), req.url));
  }

  // Role-scoped dashboard areas: enforce role (superusers may view all).
  const requiredRole = Object.keys(DASHBOARD_ROUTE_ROLE).find(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );
  if (requiredRole) {
    const needed = DASHBOARD_ROUTE_ROLE[requiredRole];
    const isSuper = SUPER_ROLES.includes(role);
    if (role !== needed && !isSuper) {
      return NextResponse.redirect(new URL(dashboardForRole(role), req.url));
    }
  }

  // If we minted a fresh access token above, reuse that response (it already
  // called NextResponse.next() and set the cookie).
  return response ?? NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/login/:path*",
    "/register/:path*",
    "/api/user/:path*",
  ],
};
