// app/api/auth/login/route.ts
import { NextRequest } from "next/server";
import { loginUser } from "@/lib/services/auth-service";
import { loginSchema } from "@/validations/auth";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { getClientIp, getUserAgent, jsonResponse } from "@/lib/request";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req) ?? "anon";
  const rl = rateLimit(rateLimitKey("login", ip), 5, 60_000);
  if (!rl.success) {
    return jsonResponse(
      { ok: false, message: "Too many login attempts. Try again later." },
      429
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ ok: false, message: "Invalid JSON body." }, 400);
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse(
      { ok: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
      422
    );
  }

  try {
    const user = await loginUser(parsed.data, {
      userAgent: getUserAgent(req),
      ip,
    });
    return jsonResponse({
      ok: true,
      message: "Login successful.",
      data: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err: any) {
    return jsonResponse(
      { ok: false, message: err?.message ?? "Login failed" },
      err?.status ?? 500
    );
  }
}
