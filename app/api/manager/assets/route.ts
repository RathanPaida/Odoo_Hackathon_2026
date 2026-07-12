// app/api/manager/assets/route.ts
// GET  — list assets (paginated, filterable)
// POST — create a new asset
import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import { jsonResponse, getClientIp } from "@/lib/request";
import { parseBody } from "@/lib/utils/manager";
import { managerAssetQuerySchema, createAssetSchema } from "@/validations/manager";
import * as assetService from "@/lib/services/manager/assets.service";

export async function GET(req: NextRequest) {
  const guard = await requireRole("ASSET_MANAGER", "ADMIN");
  if (guard.response) return guard.response;

  const sp = req.nextUrl.searchParams;
  const parsed = managerAssetQuerySchema.safeParse({
    q: sp.get("q") ?? undefined,
    status: sp.get("status") ?? undefined,
    condition: sp.get("condition") ?? undefined,
    categoryId: sp.get("categoryId") ?? undefined,
    departmentId: sp.get("departmentId") ?? undefined,
    sort: sp.get("sort") ?? undefined,
    order: sp.get("order") ?? undefined,
    page: sp.get("page") ?? undefined,
    pageSize: sp.get("pageSize") ?? undefined,
  });
  if (!parsed.success) {
    return jsonResponse(
      { ok: false, message: "Invalid query", errors: parsed.error.flatten().fieldErrors },
      422
    );
  }

  const data = await assetService.listAssets(parsed.data);
  return jsonResponse({ ok: true, data });
}

export async function POST(req: NextRequest) {
  const guard = await requireRole("ASSET_MANAGER", "ADMIN");
  if (guard.response) return guard.response;

  const { data, error } = await parseBody(req, createAssetSchema);
  if (error) return error;

  try {
    const created = await assetService.createAsset(
      guard.user!.id,
      {
        name: data.name,
        assetTag: data.assetTag,
        serialNumber: data.serialNumber,
        acquisitionDate: data.acquisitionDate,
        acquisitionCost: data.acquisitionCost,
        condition: data.condition ?? "NEW",
        location: data.location,
        photoUrl: data.photoUrl,
        categoryId: data.categoryId,
        departmentId: data.departmentId,
        holderId: data.holderId,
        isBookable: data.isBookable ?? false,
      },
      getClientIp(req)
    );
    return jsonResponse({ ok: true, message: "Asset created", data: created }, 201);
  } catch (e: any) {
    if (e.code === "DUPLICATE_TAG") {
      return jsonResponse({ ok: false, message: e.message }, 409);
    }
    return jsonResponse({ ok: false, message: "Could not create asset" }, 500);
  }
}
