// app/api/manager/bookings/[id]/route.ts
// DELETE — cancel a booking
import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import { jsonResponse, getClientIp } from "@/lib/request";
import * as bookingService from "@/lib/services/manager/bookings.service";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireRole("ASSET_MANAGER", "ADMIN");
  if (guard.response) return guard.response;

  const { id } = await params;
  try {
    const cancelled = await bookingService.cancelBooking(
      guard.user!.id,
      id,
      getClientIp(req)
    );
    return jsonResponse({ ok: true, message: "Booking cancelled", data: cancelled });
  } catch (e: any) {
    return jsonResponse({ ok: false, message: e.message }, 404);
  }
}
