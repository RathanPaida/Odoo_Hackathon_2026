// app/api/manager/maintenance/route.ts
// GET — list all maintenance requests
import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import { jsonResponse } from "@/lib/request";
import { managerMaintenanceQuerySchema } from "@/validations/manager";
import * as maintenanceService from "@/lib/services/manager/maintenance.service";

export async function GET(req: NextRequest) {
  const guard = await requireRole("ASSET_MANAGER", "ADMIN");
  if (guard.response) return guard.response;

  const sp = req.nextUrl.searchParams;
  const parsed = managerMaintenanceQuerySchema.safeParse({
    status: sp.get("status") ?? undefined,
    priority: sp.get("priority") ?? undefined,
    page: sp.get("page") ?? undefined,
    pageSize: sp.get("pageSize") ?? undefined,
  });
  if (!parsed.success) {
    return jsonResponse(
      { ok: false, message: "Invalid query", errors: parsed.error.flatten().fieldErrors },
      422
    );
  }

  const data = await maintenanceService.listMaintenance(parsed.data);
  return jsonResponse({ ok: true, data });
}
