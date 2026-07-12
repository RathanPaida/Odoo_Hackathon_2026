import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guard";
import { jsonResponse } from "@/lib/request";
import { getEmployees } from "@/lib/services/admin/employee-service";

export async function GET(req: NextRequest) {
  const { response } = await requirePermission("manage_employees");
  if (response) return response;

  try {
    const employees = await getEmployees();
    return jsonResponse({ ok: true, data: employees });
  } catch (error) {
    return jsonResponse({ ok: false, message: "Failed to fetch employees" }, 500);
  }
}
