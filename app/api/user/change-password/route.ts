// app/api/user/change-password/route.ts
import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/guard";
import { changePassword, verifyCurrentPassword } from "@/lib/services/user-service";
import { changePasswordSchema } from "@/validations/auth";
import { jsonResponse } from "@/lib/request";

export async function POST(req: NextRequest) {
  const guard = await requireUser();
  if (guard.response) return guard.response;
  const user = guard.user!;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ ok: false, message: "Invalid JSON body." }, 400);
  }

  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse(
      { ok: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
      422
    );
  }

  const ok = await verifyCurrentPassword(user.id, parsed.data.currentPassword);
  if (!ok) {
    return jsonResponse({ ok: false, message: "Current password is incorrect." }, 400);
  }

  await changePassword(user.id, parsed.data.newPassword);
  return jsonResponse({ ok: true, message: "Password changed successfully." });
}
