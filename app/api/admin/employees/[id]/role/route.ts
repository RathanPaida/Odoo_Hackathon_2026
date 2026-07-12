import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guard";
import { jsonResponse } from "@/lib/request";
import { employeeRoleSchema } from "@/validations/admin/org";
import { updateEmployeeRole } from "@/lib/services/admin/employee-service";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requirePermission("assign_roles");
  if (response) return response;

  try {
    const { id } = await params;
    const body = await req.json();
    const result = employeeRoleSchema.safeParse(body);

    if (!result.success) {
      return jsonResponse({ ok: false, message: "Validation failed", errors: result.error.errors }, 400);
    }

    await updateEmployeeRole(id, result.data.role);
    return jsonResponse({ ok: true, message: "Role updated successfully" });
  } catch (error: any) {
    return jsonResponse({ ok: false, message: "Internal server error" }, 500);
  }
}
