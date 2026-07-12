// app/api/employee/activity/route.ts
// GET /api/employee/activity -> employee activity timeline (newest first)
import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/guard";
import { jsonResponse } from "@/lib/request";
import { activityQuerySchema } from "@/validations/employee";
import { listActivity } from "@/lib/services/employee/activity.service";

export async function GET(req: NextRequest) {
  const guard = await requireUser();
  if (guard.response) return guard.response;
  const { searchParams } = new URL(req.url);
  const parsed = activityQuerySchema.safeParse({
    type: searchParams.get("type") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
  });
  if (!parsed.success) {
    return jsonResponse(
      { ok: false, message: "Invalid query", errors: parsed.error.flatten().fieldErrors },
      422
    );
  }
  const data = await listActivity(guard.user!.id, parsed.data);
  return jsonResponse({ ok: true, data });
}
