// app/api/employee/returns/[id]/route.ts
// GET  /api/employee/returns/:id -> return detail
// PATCH /api/employee/returns/:id -> cancel a PENDING return
import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/guard";
import { jsonResponse, getClientIp } from "@/lib/request";
import {
  cancelReturn,
  getReturn,
  ReturnError,
} from "@/lib/services/employee/returns.service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireUser();
  if (guard.response) return guard.response;
  const { id } = await params;
  const item = await getReturn(guard.user!.id, id);
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
  try {
    const updated = await cancelReturn(guard.user!.id, id, getClientIp(req));
    return jsonResponse({ ok: true, message: "Return cancelled.", data: updated });
  } catch (e) {
    if (e instanceof ReturnError) {
      return jsonResponse({ ok: false, message: e.message }, 404);
    }
    return jsonResponse({ ok: false, message: "Could not cancel return." }, 500);
  }
}
