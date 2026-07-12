// app/api/employee/transfers/[id]/route.ts
// GET  /api/employee/transfers/:id -> transfer detail
// PATCH /api/employee/transfers/:id -> cancel a PENDING transfer
import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/guard";
import { jsonResponse, getClientIp } from "@/lib/request";
import {
  cancelTransfer,
  getTransfer,
  TransferError,
} from "@/lib/services/employee/transfers.service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireUser();
  if (guard.response) return guard.response;
  const { id } = await params;
  const item = await getTransfer(guard.user!.id, id);
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
    const updated = await cancelTransfer(guard.user!.id, id, getClientIp(req));
    return jsonResponse({ ok: true, message: "Transfer cancelled.", data: updated });
  } catch (e) {
    if (e instanceof TransferError) {
      return jsonResponse({ ok: false, message: e.message }, 404);
    }
    return jsonResponse({ ok: false, message: "Could not cancel transfer." }, 500);
  }
}
