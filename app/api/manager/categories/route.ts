// app/api/manager/categories/route.ts
// GET  — list categories
// POST — create category
import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import { jsonResponse, getClientIp } from "@/lib/request";
import { parseBody } from "@/lib/utils/manager";
import { createCategorySchema } from "@/validations/manager";
import * as categoryService from "@/lib/services/manager/categories.service";

export async function GET(req: NextRequest) {
  const guard = await requireRole("ASSET_MANAGER", "ADMIN");
  if (guard.response) return guard.response;

  const sp = req.nextUrl.searchParams;
  const page = Number(sp.get("page")) || 1;
  const pageSize = Number(sp.get("pageSize")) || 20;
  const q = sp.get("q") ?? undefined;

  const data = await categoryService.listCategories({ q, page, pageSize });
  return jsonResponse({ ok: true, data });
}

export async function POST(req: NextRequest) {
  const guard = await requireRole("ASSET_MANAGER", "ADMIN");
  if (guard.response) return guard.response;

  const { data, error } = await parseBody(req, createCategorySchema);
  if (error) return error;

  try {
    const created = await categoryService.createCategory(
      guard.user!.id,
      data,
      getClientIp(req)
    );
    return jsonResponse({ ok: true, message: "Category created", data: created }, 201);
  } catch (e: any) {
    return jsonResponse({ ok: false, message: e.message }, 500);
  }
}
