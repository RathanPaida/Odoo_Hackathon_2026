// lib/request.ts
// Helpers to extract client metadata from a NextRequest.
import type { NextRequest } from "next/server";

export function getClientIp(req: NextRequest): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip");
}

export function getUserAgent(req: NextRequest): string | null {
  return req.headers.get("user-agent");
}

// Build a safe JSON response with the standard envelope.
export function jsonResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {}
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}
