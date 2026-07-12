// app/api/auth/verify-email/route.ts
import { NextRequest } from "next/server";
import { verifyEmail } from "@/lib/services/auth-service";
import { verifyEmailSchema } from "@/validations/auth";
import { jsonResponse } from "@/lib/request";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ ok: false, message: "Invalid JSON body." }, 400);
  }

  const parsed = verifyEmailSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse(
      { ok: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
      422
    );
  }

  try {
    await verifyEmail(parsed.data);
    return jsonResponse({ ok: true, message: "Email verified successfully." });
  } catch (err: any) {
    return jsonResponse(
      { ok: false, message: err?.message ?? "Verification failed" },
      err?.status ?? 500
    );
  }
}
