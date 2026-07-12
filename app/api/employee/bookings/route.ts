// app/api/employee/bookings/route.ts
// GET  /api/employee/bookings -> employee's bookings (filter/search/paginate)
// POST /api/employee/bookings -> create a booking (overlap-checked)
import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/guard";
import { jsonResponse, getClientIp } from "@/lib/request";
import { createBookingSchema } from "@/validations/employee";
import {
  createBooking,
  listBookings,
  BookingError,
} from "@/lib/services/employee/bookings.service";
import { parseBody } from "@/lib/utils/employee";

export async function GET(req: NextRequest) {
  const guard = await requireUser();
  if (guard.response) return guard.response;
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") ?? 1) || 1;
  const pageSize = Number(searchParams.get("pageSize") ?? 12) || 12;
  const status = (searchParams.get("status") as any) ?? undefined;
  const q = searchParams.get("q") ?? undefined;
  const data = await listBookings(guard.user!.id, { status, q, page, pageSize });
  return jsonResponse({ ok: true, data });
}

export async function POST(req: NextRequest) {
  const guard = await requireUser();
  if (guard.response) return guard.response;
  const { data, error } = await parseBody(req, createBookingSchema);
  if (error) return error;
  try {
    const created = await createBooking(guard.user!.id, data, getClientIp(req));
    return jsonResponse({ ok: true, message: "Resource booked.", data: created }, 201);
  } catch (e) {
    if (e instanceof BookingError) {
      const code = e.code === "CONFLICT" ? 409 : 403;
      return jsonResponse({ ok: false, message: e.message }, code);
    }
    return jsonResponse({ ok: false, message: "Could not create booking." }, 500);
  }
}
