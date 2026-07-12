// app/api/user/profile/route.ts
// PATCH /api/user/profile -> update first/last name and avatar URL.
import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/guard";
import { updateProfile, toPublicUser } from "@/lib/services/user-service";
import { updateProfileSchema } from "@/validations/user";
import { jsonResponse } from "@/lib/request";

export async function PATCH(req: NextRequest) {
  const guard = await requireUser();
  if (guard.response) return guard.response;
  const user = guard.user!;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ ok: false, message: "Invalid JSON body." }, 400);
  }

  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse(
      { ok: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
      422
    );
  }

  const updated = await updateProfile(user.id, {
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    avatarUrl: parsed.data.avatarUrl,
  });
  return jsonResponse({
    ok: true,
    message: "Profile updated.",
    data: toPublicUser(updated as any),
  });
}
