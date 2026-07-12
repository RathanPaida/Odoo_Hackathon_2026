// app/api/employee/assets/[id]/route.ts
// GET /api/employee/assets/:id -> single allocated asset with full details.
import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/guard";
import { jsonResponse } from "@/lib/request";
import { getMyAssetDetails } from "@/lib/services/employee/assets.service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireUser();
  if (guard.response) return guard.response;

  const { id } = await params;
  const asset = await getMyAssetDetails(guard.user!.id, id);
  if (!asset) {
    return jsonResponse({ ok: false, message: "Asset not found." }, 404);
  }
  return jsonResponse({ ok: true, data: asset });
}
