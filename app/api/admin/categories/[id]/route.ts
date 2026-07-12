import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guard";
import { jsonResponse } from "@/lib/request";
import { categorySchema } from "@/validations/admin/org";
import { getCategoryById, updateCategory, deleteCategory } from "@/lib/services/admin/category-service";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { response } = await requirePermission("manage_categories");
  if (response) return response;

  try {
    const category = await getCategoryById(params.id);
    if (!category) return jsonResponse({ ok: false, message: "Category not found" }, 404);
    return jsonResponse({ ok: true, data: category });
  } catch (error) {
    return jsonResponse({ ok: false, message: "Internal server error" }, 500);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { response } = await requirePermission("manage_categories");
  if (response) return response;

  try {
    const body = await req.json();
    const result = categorySchema.partial().safeParse(body);

    if (!result.success) {
      return jsonResponse({ ok: false, message: "Validation failed", errors: result.error.errors }, 400);
    }

    const category = await updateCategory(params.id, result.data);
    return jsonResponse({ ok: true, message: "Category updated", data: category });
  } catch (error: any) {
    return jsonResponse({ ok: false, message: error.message || "Internal server error" }, 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { response } = await requirePermission("manage_categories");
  if (response) return response;

  try {
    await deleteCategory(params.id);
    return jsonResponse({ ok: true, message: "Category deleted" });
  } catch (error: any) {
    // If it has relations, prisma will throw a constraint error.
    return jsonResponse({ ok: false, message: "Cannot delete category in use" }, 400);
  }
}
