// app/api/manager/assets/[id]/route.ts
// GET    — asset details
// PATCH  — update asset
// DELETE — soft-delete asset
import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import { jsonResponse, getClientIp } from "@/lib/request";
import { parseBody } from "@/lib/utils/manager";
import { updateAssetSchema } from "@/validations/manager";
import * as assetService from "@/lib/services/manager/assets.service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireRole("ASSET_MANAGER", "ADMIN");
  if (guard.response) return guard.response;

  const { id } = await params;
  try {
    const data = await assetService.getAssetDetails(id);
    return jsonResponse({ ok: true, data });
  } catch (e: any) {
    return jsonResponse({ ok: false, message: e.message }, 404);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireRole("ASSET_MANAGER", "ADMIN");
  if (guard.response) return guard.response;

  const { id } = await params;
  const { data, error } = await parseBody(req, updateAssetSchema);
  if (error) return error;

  try {
    const updated = await assetService.updateAsset(
      guard.user!.id,
      id,
      data,
      getClientIp(req)
    );
    return jsonResponse({ ok: true, message: "Asset updated", data: updated });
  } catch (e: any) {
    return jsonResponse({ ok: false, message: e.message }, 404);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireRole("ASSET_MANAGER", "ADMIN");
  if (guard.response) return guard.response;

  const { id } = await params;
  try {
    await assetService.deleteAsset(guard.user!.id, id, getClientIp(req));
    return jsonResponse({ ok: true, message: "Asset deleted" });
  } catch (e: any) {
    return jsonResponse({ ok: false, message: e.message }, 404);
  }
}
