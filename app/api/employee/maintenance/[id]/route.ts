// app/api/employee/maintenance/[id]/route.ts
// GET /api/employee/maintenance/:id -> maintenance detail
// PATCH /api/employee/maintenance/:id -> employee adds notes/photos
import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/guard";
import { jsonResponse } from "@/lib/request";
import { updateMaintenanceSchema } from "@/validations/employee";
import {
  getMaintenance,
  updateMaintenance,
  MaintenanceError,
} from "@/lib/services/employee/maintenance.service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireUser();
  if (guard.response) return guard.response;
  const { id } = await params;
  const item = await getMaintenance(guard.user!.id, id);
  if (!item) return jsonResponse({ ok: false, message: "Not found." }, 404);
  return jsonResponse({ ok: true, data: item });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireUser();
  if (guard.response) return guard.response;
  const { id } = await params;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const parsed = updateMaintenanceSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse(
      { ok: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
      422
    );
  }
  try {
    const updated = await updateMaintenance(guard.user!.id, id, parsed.data);
    return jsonResponse({ ok: true, message: "Maintenance updated.", data: updated });
  } catch (e) {
    if (e instanceof MaintenanceError) {
      return jsonResponse({ ok: false, message: e.message }, 404);
    }
    return jsonResponse({ ok: false, message: "Could not update maintenance." }, 500);
  }
}
