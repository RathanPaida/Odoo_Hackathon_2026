import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guard";
import { jsonResponse } from "@/lib/request";
import { departmentSchema } from "@/validations/admin/org";
import { getDepartmentById, updateDepartment, deleteDepartment } from "@/lib/services/admin/department-service";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { response } = await requirePermission("manage_departments");
  if (response) return response;

  try {
    const dept = await getDepartmentById(params.id);
    if (!dept) return jsonResponse({ ok: false, message: "Department not found" }, 404);
    return jsonResponse({ ok: true, data: dept });
  } catch (error) {
    return jsonResponse({ ok: false, message: "Internal server error" }, 500);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { response } = await requirePermission("manage_departments");
  if (response) return response;

  try {
    const body = await req.json();
    const result = departmentSchema.partial().safeParse(body);

    if (!result.success) {
      return jsonResponse({ ok: false, message: "Validation failed", errors: result.error.errors }, 400);
    }

    const dept = await updateDepartment(params.id, result.data);
    return jsonResponse({ ok: true, message: "Department updated", data: dept });
  } catch (error: any) {
    return jsonResponse({ ok: false, message: error.message || "Internal server error" }, 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { response } = await requirePermission("manage_departments");
  if (response) return response;

  try {
    await deleteDepartment(params.id);
    return jsonResponse({ ok: true, message: "Department deactivated" });
  } catch (error: any) {
    return jsonResponse({ ok: false, message: "Internal server error" }, 500);
  }
}
