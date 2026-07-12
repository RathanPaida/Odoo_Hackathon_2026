// app/api/employee/employees/route.ts
// GET /api/employee/employees -> list employees (transfer targets)
import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/guard";
import { jsonResponse } from "@/lib/request";
import { employeeQuerySchema } from "@/validations/employee";
import { listEmployees } from "@/lib/services/employee/employees.service";

export async function GET(req: NextRequest) {
  const guard = await requireUser();
  if (guard.response) return guard.response;
  const { searchParams } = new URL(req.url);
  const parsed = employeeQuerySchema.safeParse({
    q: searchParams.get("q") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
  });
  if (!parsed.success) {
    return jsonResponse(
      { ok: false, message: "Invalid query", errors: parsed.error.flatten().fieldErrors },
      422
    );
  }
  const data = await listEmployees(guard.user!.id, parsed.data);
  return jsonResponse({ ok: true, data });
}
