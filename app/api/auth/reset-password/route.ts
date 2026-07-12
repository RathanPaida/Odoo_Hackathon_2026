// app/api/auth/reset-password/route.ts
import { NextRequest } from "next/server";
import { resetPassword } from "@/lib/services/auth-service";
import { resetPasswordSchema } from "@/validations/auth";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { jsonResponse } from "@/lib/request";

export async function POST(req: NextRequest) {
  const rl = rateLimit(rateLimitKey("reset", req.headers.get("x-forwarded-for") ?? "anon"), 5, 60_000);
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

  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse(
      { ok: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
      422
    );
  }

  try {
    await resetPassword(parsed.data.token, parsed.data.password);
    return jsonResponse({
      ok: true,
      message: "Password reset successful. You can now log in.",
    });
  } catch (err: any) {
    return jsonResponse(
      { ok: false, message: err?.message ?? "Reset failed" },
      err?.status ?? 500
    );
  }
}
