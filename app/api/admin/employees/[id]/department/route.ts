import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guard";
import { jsonResponse } from "@/lib/request";
import { employeeDepartmentSchema } from "@/validations/admin/org";
import { updateEmployeeDepartment } from "@/lib/services/admin/employee-service";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { response } = await requirePermission("manage_employees");
  if (response) return response;

  try {
    const body = await req.json();
    const result = employeeDepartmentSchema.safeParse(body);

    if (!result.success) {
      return jsonResponse({ ok: false, message: "Validation failed", errors: result.error.errors }, 400);
    }

    await updateEmployeeDepartment(params.id, result.data.departmentId);
    return jsonResponse({ ok: true, message: "Department updated successfully" });
  } catch (error: any) {
    return jsonResponse({ ok: false, message: "Internal server error" }, 500);
  }
}
