// app/api/auth/forgot-password/route.ts
import { NextRequest } from "next/server";
import { forgotPassword } from "@/lib/services/auth-service";
import { forgotPasswordSchema } from "@/validations/auth";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { jsonResponse } from "@/lib/request";

export async function POST(req: NextRequest) {
  const rl = rateLimit(rateLimitKey("forgot", req.headers.get("x-forwarded-for") ?? "anon"), 5, 60_000);
  if (!rl.success) {
    return jsonResponse(
      { ok: false, message: "Too many requests. Try again later." },
      429
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ ok: false, message: "Invalid JSON body." }, 400);
  }

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse(
      { ok: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
      422
    );
  }

  // Always returns a generic success to avoid account enumeration.
  const result = await forgotPassword(parsed.data.email);
  return jsonResponse({
    ok: true,
    message:
      "If an account exists for that email, a reset link has been sent.",
    data: { devResetLink: result.devResetLink },
  });
}
