// app/api/employee/notifications/route.ts
// GET  /api/employee/notifications -> employee's notifications (filter/paginate)
// POST /api/employee/notifications -> mark all as read
import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/guard";
import { jsonResponse } from "@/lib/request";
import { notificationQuerySchema } from "@/validations/employee";
import {
  listNotifications,
  markAllRead,
} from "@/lib/services/employee/notifications.service";

export async function GET(req: NextRequest) {
  const guard = await requireUser();
  if (guard.response) return guard.response;
  const { searchParams } = new URL(req.url);
  const parsed = notificationQuerySchema.safeParse({
    type: searchParams.get("type") ?? undefined,
    unreadOnly: searchParams.get("unreadOnly") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
  });
  if (!parsed.success) {
    return jsonResponse(
      { ok: false, message: "Invalid query", errors: parsed.error.flatten().fieldErrors },
      422
    );
  }
  const data = await listNotifications(guard.user!.id, parsed.data);
  return jsonResponse({ ok: true, data });
}

export async function POST(req: NextRequest) {
  const guard = await requireUser();
  if (guard.response) return guard.response;
  const count = await markAllRead(guard.user!.id);
  return jsonResponse({ ok: true, message: "All notifications marked read.", data: { count } });
}
