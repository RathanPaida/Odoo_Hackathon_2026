// app/api/auth/refresh/route.ts
// Rotates the refresh token, issues a new access token, enforces DB
// revocation. Used by the client when the access token expires.
import { cookies } from "next/headers";
import { rotateSession, REFRESH_COOKIE, ACCESS_COOKIE } from "@/lib/auth/session";
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

export async function POST() {
  const store = await cookies();
  const rawRefresh = store.get(REFRESH_COOKIE)?.value;
  if (!rawRefresh) {
    return jsonResponse({ ok: false, message: "No refresh token." }, 401);
  }
  const rotated = await rotateSession(rawRefresh);
  if (!rotated) {
    store.delete(ACCESS_COOKIE);
    store.delete(REFRESH_COOKIE);
    return jsonResponse({ ok: false, message: "Session expired." }, 401);
  }
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
  return jsonResponse({ ok: true, message: "Token refreshed." });
}
