// app/api/employee/dashboard/route.ts
// GET /api/employee/dashboard -> employee dashboard statistics.
import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/guard";
import { jsonResponse } from "@/lib/request";
import { getDashboardSummary } from "@/lib/services/employee/dashboard.service";

export async function GET(_req: NextRequest) {
  const guard = await requireUser();
  if (guard.response) return guard.response;
  const stats = await getDashboardSummary(guard.user!.id);
  return jsonResponse({ ok: true, data: stats });
}
