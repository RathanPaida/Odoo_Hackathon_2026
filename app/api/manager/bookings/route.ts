// app/api/manager/bookings/route.ts
// GET  — list all bookings
// POST — cancel a booking (manager action)
import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import { jsonResponse, getClientIp } from "@/lib/request";
import { managerBookingQuerySchema } from "@/validations/manager";
import * as bookingService from "@/lib/services/manager/bookings.service";

export async function GET(req: NextRequest) {
  const guard = await requireRole("ASSET_MANAGER", "ADMIN");
  if (guard.response) return guard.response;

  const sp = req.nextUrl.searchParams;
  const parsed = managerBookingQuerySchema.safeParse({
    q: sp.get("q") ?? undefined,
    status: sp.get("status") ?? undefined,
    page: sp.get("page") ?? undefined,
    pageSize: sp.get("pageSize") ?? undefined,
  });
  if (!parsed.success) {
    return jsonResponse(
      { ok: false, message: "Invalid query", errors: parsed.error.flatten().fieldErrors },
      422
    );
  }

  const data = await bookingService.listBookings(parsed.data);
  return jsonResponse({ ok: true, data });
}
