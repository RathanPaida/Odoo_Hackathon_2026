// app/api/user/change-email/route.ts
// Changes email after password confirmation, then requires re-verification.
import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/guard";
import { changeEmail, verifyCurrentPassword, getUserById } from "@/lib/services/user-service";
import { issueVerification } from "@/lib/services/auth-service";
import { changeEmailSchema } from "@/validations/user";
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

  const parsed = changeEmailSchema.safeParse(body);
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

  const exists = await getUserById(parsed.data.email);
  // Reuse the email if it's a different record.
  if (exists && exists.id !== user.id) {
    return jsonResponse({ ok: false, message: "Email already in use." }, 409);
  }

  const updated = await changeEmail(user.id, parsed.data.email);
  await issueVerification(updated.id, updated.email, updated.firstName ?? "there");
  return jsonResponse({
    ok: true,
    message: "Email updated. Please verify your new address.",
  });
}
