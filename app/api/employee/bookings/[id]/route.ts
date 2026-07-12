// app/api/employee/bookings/[id]/route.ts
// GET  /api/employee/bookings/:id -> booking detail
// PATCH /api/employee/bookings/:id -> cancel or reschedule (body decides)
import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/guard";
import { jsonResponse, getClientIp } from "@/lib/request";
import { rescheduleBookingSchema } from "@/validations/employee";
import {
  cancelBooking,
  getBooking,
  rescheduleBooking,
  BookingError,
} from "@/lib/services/employee/bookings.service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireUser();
  if (guard.response) return guard.response;
  const { id } = await params;
  const item = await getBooking(guard.user!.id, id);
  if (!item) return jsonResponse({ ok: false, message: "Not found." }, 404);
  return jsonResponse({ ok: true, data: item });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireUser();
  if (guard.response) return guard.response;
  const { id } = await params;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const action = body?.action;
  try {
    if (action === "cancel") {
      const updated = await cancelBooking(guard.user!.id, id, getClientIp(req));
      return jsonResponse({ ok: true, message: "Booking cancelled.", data: updated });
    }
    if (action === "reschedule") {
      const parsed = rescheduleBookingSchema.safeParse(body);
      if (!parsed.success) {
        return jsonResponse(
          { ok: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
          422
        );
      }
      const updated = await rescheduleBooking(
        guard.user!.id,
        id,
        parsed.data,
        getClientIp(req)
      );
      return jsonResponse({ ok: true, message: "Booking rescheduled.", data: updated });
    }
    return jsonResponse({ ok: false, message: "Unknown action." }, 400);
  } catch (e) {
    if (e instanceof BookingError) {
      const code = e.code === "CONFLICT" ? 409 : 404;
      return jsonResponse({ ok: false, message: e.message }, code);
    }
    return jsonResponse({ ok: false, message: "Could not update booking." }, 500);
  }
}
