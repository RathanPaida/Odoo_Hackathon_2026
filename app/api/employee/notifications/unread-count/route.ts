// app/api/employee/notifications/unread-count/route.ts
import { requireUser } from "@/lib/auth/guard";
import { jsonResponse } from "@/lib/request";
import { getUnreadCount } from "@/lib/services/employee/notifications.service";

export async function GET() {
  const guard = await requireUser();
  if (guard.response) return guard.response;

  const count = await getUnreadCount(guard.user!.id);
  return jsonResponse({ ok: true, data: { count } });
}
