// app/api/auth/resend-verification/route.ts
import { NextRequest } from "next/server";
import { resendVerification } from "@/lib/services/auth-service";
import { resendVerificationSchema } from "@/validations/auth";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { jsonResponse } from "@/lib/request";

export async function POST(req: NextRequest) {
  const rl = rateLimit(rateLimitKey("resend", req.headers.get("x-forwarded-for") ?? "anon"), 3, 60_000);
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

  const parsed = resendVerificationSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse(
      { ok: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
      422
    );
  }

  try {
    const result = await resendVerification(parsed.data.email);
    return jsonResponse({
      ok: true,
      message: "Verification email sent. Please check your inbox.",
      data: { dev: result.dev },
    });
  } catch (err: any) {
    return jsonResponse(
      { ok: false, message: err?.message ?? "Failed to resend." },
      err?.status ?? 500
    );
  }
}
