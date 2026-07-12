import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import { jsonResponse } from "@/lib/request";
import { getAdminKPIs } from "@/lib/services/admin/dashboard-service";

export async function GET(req: NextRequest) {
  const { response } = await requireRole("ADMIN");
  if (response) return response;

  try {
    const kpis = await getAdminKPIs();
    return jsonResponse({ ok: true, data: kpis });
  } catch (error) {
    return jsonResponse({ ok: false, message: "Failed to fetch KPIs" }, 500);
  }
}
