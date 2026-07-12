// lib/auth/session.ts
// Cookie + session lifecycle management (access & refresh tokens).
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { generateToken, sha256 } from "@/lib/utils";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  verifyAccessToken,
  type AccessTokenClaims,
} from "@/lib/auth/jwt";

export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";

function cookieOpts(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

function parseExpiryToSeconds(value: string): number {
  // supports "15m", "30d", "1h", or raw seconds
  const m = value.trim().match(/^(\d+)\s*(s|m|h|d)?$/);
  if (!m) return 60 * 15;
  const n = parseInt(m[1], 10);
  const unit = m[2] ?? "s";
  const mult = unit === "d" ? 86400 : unit === "h" ? 3600 : unit === "m" ? 60 : 1;
  return n * mult;
}

const ACCESS_MAX_AGE = parseExpiryToSeconds(
  process.env.ACCESS_TOKEN_EXPIRES_IN ?? "15m"
);
const REFRESH_MAX_AGE = parseExpiryToSeconds(
  process.env.REFRESH_TOKEN_EXPIRES_IN ?? "30d"
);

// Create a brand new session (used at login). Writes DB rows + cookies.
export async function createSession(opts: {
  userId: string;
  email: string;
  role: string;
  userAgent?: string | null;
  ip?: string | null;
  remember?: boolean;
}) {
  const store = await cookies();
  const family = generateToken(16);
  const jti = generateToken(16);
  const rawRefresh = await signRefreshToken({
    sub: opts.userId,
    email: opts.email,
    role: opts.role,
    jti,
    family,
  });
  const accessToken = await signAccessToken({
    sub: opts.userId,
    email: opts.email,
    role: opts.role,
  });

  const tokenHash = sha256(rawRefresh);
  const expiresAt = new Date(Date.now() + REFRESH_MAX_AGE * 1000);

  const rt = await prisma.refreshToken.create({
    data: { userId: opts.userId, tokenHash, family, expiresAt },
  });

  await prisma.session.create({
    data: {
      userId: opts.userId,
      refreshTokenId: rt.id,
      userAgent: opts.userAgent ?? null,
      ipAddress: opts.ip ?? null,
      expiresAt,
    },
  });

  const refreshMaxAge = opts.remember ? REFRESH_MAX_AGE : 60 * 60 * 24; // 1 day if not remembered
  store.set(ACCESS_COOKIE, accessToken, cookieOpts(ACCESS_MAX_AGE));
  store.set(REFRESH_COOKIE, rawRefresh, cookieOpts(refreshMaxAge));

  await prisma.user.update({
    where: { id: opts.userId },
    data: { lastLoginAt: new Date() },
  });
}

// Rotate refresh token (used by /api/auth/refresh and middleware). Enforces
// DB revocation. Returns new tokens or null if invalid/revoked.
export async function rotateSession(rawRefresh: string): Promise<{
  accessToken: string;
  refreshToken: string;
} | null> {
  const payload = await verifyRefreshToken(rawRefresh);
  if (!payload) return null;

  const rt = await prisma.refreshToken.findUnique({
    where: { id: payload.jti },
  });
  if (!rt) return null;
  if (rt.revokedAt) return null; // revoked (logout / reuse detected)
  if (rt.expiresAt < new Date()) return null;

  // Rotate: revoke old, issue new in same family.
  const newFamily = payload.family;
  const newJti = generateToken(16);
  const newRaw = await signRefreshToken({
    sub: payload.sub,
    email: payload.email,
    role: payload.role,
    jti: newJti,
    family: newFamily,
  });
  const newAccess = await signAccessToken({
    sub: payload.sub,
    email: payload.email,
    role: payload.role,
  });

  const tokenHash = sha256(newRaw);
  const expiresAt = new Date(Date.now() + REFRESH_MAX_AGE * 1000);

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: rt.id },
      data: { revokedAt: new Date(), replacedBy: newJti },
    }),
    prisma.refreshToken.create({
      data: { userId: payload.sub, tokenHash, family: newFamily, expiresAt },
    }),
  ]);

  return { accessToken: newAccess, refreshToken: newRaw };
}

// Revoke the current refresh token and clear cookies (logout).
export async function destroySession(rawRefresh?: string) {
  const store = await cookies();
  if (rawRefresh) {
    const payload = await verifyRefreshToken(rawRefresh);
    if (payload?.jti) {
      await prisma.refreshToken
        .update({
          where: { id: payload.jti },
          data: { revokedAt: new Date() },
        })
        .catch(() => {});
    }
  }
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}

// Read & verify the access token (server side). Returns payload or null.
export async function getAccessTokenPayload(): Promise<AccessTokenClaims | null> {
  const store = await cookies();
  const token = store.get(ACCESS_COOKIE)?.value;
  if (!token) return null;
  return verifyAccessToken(token);
}

// Load the current user from DB using the access token. Returns null if
// unauthenticated. Does NOT auto-refresh (to keep RSC cookie-safe).
export async function getCurrentUser() {
  const payload = await getAccessTokenPayload();
  if (!payload?.sub) return null;
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || user.deletedAt) return null;
  return user;
}
