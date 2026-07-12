import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guard";
import { jsonResponse } from "@/lib/request";
import { categorySchema } from "@/validations/admin/org";
import { getCategories, createCategory } from "@/lib/services/admin/category-service";

export async function GET(req: NextRequest) {
  const { response } = await requirePermission("manage_categories");
  if (response) return response;

  try {
    const categories = await getCategories();
    return jsonResponse({ ok: true, data: categories });
  } catch (error) {
    return jsonResponse({ ok: false, message: "Failed to fetch categories" }, 500);
  }
}

export async function POST(req: NextRequest) {
  const { response } = await requirePermission("manage_categories");
  if (response) return response;

  try {
    const body = await req.json();
    const result = categorySchema.safeParse(body);

    if (!result.success) {
      return jsonResponse({ ok: false, message: "Validation failed", errors: result.error.errors }, 400);
    }

    const category = await createCategory(result.data);
    return jsonResponse({ ok: true, message: "Category created", data: category }, 201);
  } catch (error: any) {
    return jsonResponse({ ok: false, message: "Internal server error" }, 500);
  }
}
