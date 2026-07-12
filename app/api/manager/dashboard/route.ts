// app/api/manager/dashboard/route.ts
// GET — dashboard stats for the asset manager
import { requireRole } from "@/lib/auth/guard";
import { jsonResponse } from "@/lib/request";
import * as dashboardService from "@/lib/services/manager/dashboard.service";

export async function GET() {
  const guard = await requireRole("ASSET_MANAGER", "ADMIN");
  if (guard.response) return guard.response;

  const data = await dashboardService.getDashboardSummary();
  return jsonResponse({ ok: true, data });
}
