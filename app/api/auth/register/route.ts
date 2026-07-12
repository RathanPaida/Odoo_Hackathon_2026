// app/api/auth/register/route.ts
import { NextRequest } from "next/server";
import { registerUser } from "@/lib/services/auth-service";
import { registerSchema } from "@/validations/auth";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { jsonResponse } from "@/lib/request";

export async function POST(req: NextRequest) {
  const rl = rateLimit(rateLimitKey("register", req.headers.get("x-forwarded-for") ?? "anon"));
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

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse(
      { ok: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
      422
    );
  }

  try {
    const { user, dev } = await registerUser(parsed.data);
    return jsonResponse(
      {
        ok: true,
        message:
          "Registration successful. Please check your email to verify your account.",
        data: { id: user.id, email: user.email, dev },
      },
      201
    );
  } catch (err: any) {
    return jsonResponse(
      { ok: false, message: err?.message ?? "Registration failed" },
      err?.status ?? 500
    );
  }
}
