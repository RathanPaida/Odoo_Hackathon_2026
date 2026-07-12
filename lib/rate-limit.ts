// lib/rate-limit.ts
// Lightweight in-memory fixed-window rate limiter.
// NOTE: For multi-instance production, back this with Redis. This default
// implementation is per-process and works for single-node deployments.

interface Window {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Window>();

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

export function rateLimit(
  key: string,
  max = Number(process.env.RATE_LIMIT_MAX ?? 5),
  windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60000)
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { success: true, limit: max, remaining: max - 1, resetAt };
  }
  existing.count += 1;
  const remaining = Math.max(0, max - existing.count);
  return {
    success: existing.count <= max,
    limit: max,
    remaining,
    resetAt: existing.resetAt,
  };
}

// Helper to build a key from IP + route.
export function rateLimitKey(prefix: string, identifier: string) {
  return `${prefix}:${identifier}`;
}
