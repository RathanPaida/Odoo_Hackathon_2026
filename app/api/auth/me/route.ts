// app/api/auth/me/route.ts
import { cookies } from "next/headers";
import { getAccessTokenPayload, REFRESH_COOKIE, ACCESS_COOKIE } from "@/lib/auth/session";
import { rotateSession } from "@/lib/auth/session";
import { getCurrentUser } from "@/lib/auth/session";
import { toPublicUser } from "@/lib/services/user-service";
import { tokenConfig } from "@/lib/auth/jwt";
import { jsonResponse } from "@/lib/request";

function parseExpiryToSeconds(value: string): number {
  const m = value.trim().match(/^(\d+)\s*(s|m|h|d)?$/);
  if (!m) return 60 * 15;
  const n = parseInt(m[1], 10);
  const mult = m[2] === "d" ? 86400 : m[2] === "h" ? 3600 : m[2] === "m" ? 60 : 1;
  return n * mult;
}
const ACCESS_MAX = parseExpiryToSeconds(tokenConfig.accessExpires);
const REFRESH_MAX = parseExpiryToSeconds(tokenConfig.refreshExpires);

export async function GET() {
  const payload = await getAccessTokenPayload();
  if (payload?.sub) {
    const user = await getCurrentUser();
    if (user) return jsonResponse({ ok: true, data: toPublicUser(user) });
  }

  // Access token missing/expired → try silent refresh via refresh cookie.
  const store = await cookies();
  const rawRefresh = store.get(REFRESH_COOKIE)?.value;
  if (rawRefresh) {
    const rotated = await rotateSession(rawRefresh);
    if (rotated) {
      store.set(ACCESS_COOKIE, rotated.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: ACCESS_MAX,
      });
      store.set(REFRESH_COOKIE, rotated.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: REFRESH_MAX,
      });
      const user = await getCurrentUser();
      if (user) return jsonResponse({ ok: true, data: toPublicUser(user) });
    }
  }

  return jsonResponse({ ok: false, message: "Unauthenticated." }, 401);
}
