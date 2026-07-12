import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guard";
import { jsonResponse } from "@/lib/request";
import { departmentSchema } from "@/validations/admin/org";
import { getDepartments, createDepartment } from "@/lib/services/admin/department-service";

export async function GET(req: NextRequest) {
  const { response } = await requirePermission("manage_departments");
  if (response) return response;

  try {
    const departments = await getDepartments();
    return jsonResponse({ ok: true, data: departments });
  } catch (error) {
    return jsonResponse({ ok: false, message: "Failed to fetch departments" }, 500);
  }
}

export async function POST(req: NextRequest) {
  const { response } = await requirePermission("manage_departments");
  if (response) return response;

  try {
    const body = await req.json();
    const result = departmentSchema.safeParse(body);

    if (!result.success) {
      return jsonResponse({ ok: false, message: "Validation failed", errors: result.error.errors }, 400);
    }

    const dept = await createDepartment(result.data);
    return jsonResponse({ ok: true, message: "Department created", data: dept }, 201);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return jsonResponse({ ok: false, message: "Department code already exists" }, 400);
    }
    return jsonResponse({ ok: false, message: "Internal server error" }, 500);
  }
}
