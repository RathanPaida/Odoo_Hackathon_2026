// lib/auth/jwt.ts
// JWT signing/verification using `jose` (works in Edge middleware too).
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const accessSecret = new TextEncoder().encode(
  process.env.JWT_ACCESS_SECRET ?? "dev-insecure-access-secret-change-me"
);
const refreshSecret = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET ?? "dev-insecure-refresh-secret-change-me"
);

// Plain claim shapes (do NOT extend jose's JWTPayload to avoid `unknown`).
export interface AccessTokenClaims {
  sub: string;
  email: string;
  role: string;
}

export interface RefreshTokenClaims {
  sub: string;
  email: string;
  role: string;
  jti: string;
  family: string;
}

function parseExpiry(value: string | undefined, fallback: string): string {
  return value && value.length > 0 ? value : fallback;
}

export const tokenConfig = {
  accessExpires: parseExpiry(process.env.ACCESS_TOKEN_EXPIRES_IN, "15m"),
  refreshExpires: parseExpiry(process.env.REFRESH_TOKEN_EXPIRES_IN, "30d"),
};

export async function signAccessToken(
  claims: AccessTokenClaims
): Promise<string> {
  return new SignJWT({ email: claims.email, role: claims.role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(tokenConfig.accessExpires)
    .setSubject(claims.sub)
    .sign(accessSecret);
}

export async function verifyAccessToken(
  token: string
): Promise<(AccessTokenClaims & JWTPayload) | null> {
  try {
    const { payload } = await jwtVerify(token, accessSecret);
    return payload as AccessTokenClaims & JWTPayload;
  } catch {
    return null;
  }
}

export async function signRefreshToken(
  claims: RefreshTokenClaims
): Promise<string> {
  return new SignJWT({
    email: claims.email,
    role: claims.role,
    jti: claims.jti,
    family: claims.family,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(tokenConfig.refreshExpires)
    .setSubject(claims.sub)
    .sign(refreshSecret);
}

export async function verifyRefreshToken(
  token: string
): Promise<(RefreshTokenClaims & JWTPayload) | null> {
  try {
    const { payload } = await jwtVerify(token, refreshSecret);
    return payload as RefreshTokenClaims & JWTPayload;
  } catch {
    return null;
  }
}
