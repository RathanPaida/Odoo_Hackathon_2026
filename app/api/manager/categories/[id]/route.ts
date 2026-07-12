// app/api/manager/categories/[id]/route.ts
// GET    — category detail
// PATCH  — update category
// DELETE — delete category
import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import { jsonResponse, getClientIp } from "@/lib/request";
import { parseBody } from "@/lib/utils/manager";
import { updateCategorySchema } from "@/validations/manager";
import * as categoryService from "@/lib/services/manager/categories.service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireRole("ASSET_MANAGER", "ADMIN");
  if (guard.response) return guard.response;

  const { id } = await params;
  try {
    const data = await categoryService.getCategory(id);
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
  const { data, error } = await parseBody(req, updateCategorySchema);
  if (error) return error;

  try {
    const updated = await categoryService.updateCategory(
      guard.user!.id,
      id,
      data,
      getClientIp(req)
    );
    return jsonResponse({ ok: true, message: "Category updated", data: updated });
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
    await categoryService.deleteCategory(guard.user!.id, id, getClientIp(req));
    return jsonResponse({ ok: true, message: "Category deleted" });
  } catch (e: any) {
    if (e.code === "HAS_ASSETS") {
      return jsonResponse({ ok: false, message: e.message }, 409);
    }
    return jsonResponse({ ok: false, message: e.message }, 404);
  }
}
