// app/api/employee/maintenance/route.ts
// GET  /api/employee/maintenance -> employee's maintenance requests
// POST /api/employee/maintenance -> create a maintenance request (PENDING)
import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/guard";
import { jsonResponse, getClientIp } from "@/lib/request";
import { createMaintenanceSchema } from "@/validations/employee";
import {
  createMaintenance,
  listMaintenance,
  MaintenanceError,
} from "@/lib/services/employee/maintenance.service";
import { parseBody } from "@/lib/utils/employee";

export async function GET(req: NextRequest) {
  const guard = await requireUser();
  if (guard.response) return guard.response;
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") ?? 1) || 1;
  const pageSize = Number(searchParams.get("pageSize") ?? 12) || 12;
  const data = await listMaintenance(guard.user!.id, page, pageSize);
  return jsonResponse({ ok: true, data });
}

export async function POST(req: NextRequest) {
  const guard = await requireUser();
  if (guard.response) return guard.response;
  const { data, error } = await parseBody(req, createMaintenanceSchema);
  if (error) return error;
  try {
    const created = await createMaintenance(
      guard.user!.id,
      {
        assetId: data.assetId,
        priority: data.priority ?? "MEDIUM",
        issueDescription: data.issueDescription,
        description: data.description,
        photoUrl: data.photoUrl,
      },
      getClientIp(req)
    );
    return jsonResponse(
      { ok: true, message: "Maintenance request submitted.", data: created },
      201
    );
  } catch (e) {
    if (e instanceof MaintenanceError) {
      return jsonResponse({ ok: false, message: e.message }, 403);
    }
    return jsonResponse({ ok: false, message: "Could not create request." }, 500);
  }
}
