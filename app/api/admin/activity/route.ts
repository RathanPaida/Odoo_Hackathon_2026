// app/api/admin/activity/route.ts
// GET /api/admin/activity -> all activity logs across the system
import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import { jsonResponse } from "@/lib/request";
import { activityQuerySchema } from "@/validations/employee";
import { listAllActivity } from "@/lib/services/admin/activity-service";

export async function GET(req: NextRequest) {
  const guard = await requireRole("ADMIN");
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
  const data = await listAllActivity(parsed.data);
  return jsonResponse({ ok: true, data });
}
