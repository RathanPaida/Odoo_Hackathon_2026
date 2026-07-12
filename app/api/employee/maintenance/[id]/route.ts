// app/api/employee/maintenance/[id]/route.ts
// GET /api/employee/maintenance/:id -> maintenance detail
import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/guard";
import { jsonResponse } from "@/lib/request";
import { getMaintenance } from "@/lib/services/employee/maintenance.service";

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
