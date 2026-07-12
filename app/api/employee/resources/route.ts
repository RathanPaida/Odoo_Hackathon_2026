// app/api/employee/resources/route.ts
// GET /api/employee/resources -> bookable shared resources for booking.
import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/guard";
import { jsonResponse } from "@/lib/request";
import { listBookableResources } from "@/lib/services/employee/bookings.service";

export async function GET(req: NextRequest) {
  const guard = await requireUser();
  if (guard.response) return guard.response;
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? undefined;
  const page = Number(searchParams.get("page") ?? 1) || 1;
  const pageSize = Number(searchParams.get("pageSize") ?? 50) || 50;
  const data = await listBookableResources(q, page, pageSize);
  return jsonResponse({ ok: true, data });
}
