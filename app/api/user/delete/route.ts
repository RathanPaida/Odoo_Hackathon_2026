// app/api/user/delete/route.ts
// DELETE /api/user/delete -> delete account after password confirmation.
import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/guard";
import { deleteAccount, verifyCurrentPassword } from "@/lib/services/user-service";
import { destroySession, REFRESH_COOKIE } from "@/lib/auth/session";
import { cookies } from "next/headers";
import { deleteAccountSchema } from "@/validations/user";
import { jsonResponse } from "@/lib/request";

export async function DELETE(req: NextRequest) {
  const guard = await requireUser();
  if (guard.response) return guard.response;
  const user = guard.user!;

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const parsed = deleteAccountSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse(
      { ok: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
      422
    );
  }

  const ok = await verifyCurrentPassword(user.id, parsed.data.password);
  if (!ok) {
    return jsonResponse({ ok: false, message: "Password is incorrect." }, 400);
  }

  await deleteAccount(user.id);
  const store = await cookies();
  await destroySession(store.get(REFRESH_COOKIE)?.value);
  return jsonResponse({ ok: true, message: "Account deleted." });
}
