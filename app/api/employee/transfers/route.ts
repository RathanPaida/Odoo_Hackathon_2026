// app/api/employee/transfers/route.ts
// GET  /api/employee/transfers -> employee's transfer requests (paginated)
// POST /api/employee/transfers -> create a transfer request (PENDING)
import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/guard";
import { jsonResponse, getClientIp } from "@/lib/request";
import { createTransferSchema } from "@/validations/employee";
import {
  createTransfer,
  listTransfers,
  TransferError,
} from "@/lib/services/employee/transfers.service";
import { parseBody, pageMeta } from "@/lib/utils/employee";

export async function GET(req: NextRequest) {
  const guard = await requireUser();
  if (guard.response) return guard.response;
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") ?? 1) || 1;
  const pageSize = Number(searchParams.get("pageSize") ?? 12) || 12;
  const data = await listTransfers(guard.user!.id, page, pageSize);
  return jsonResponse({ ok: true, data });
}

export async function POST(req: NextRequest) {
  const guard = await requireUser();
  if (guard.response) return guard.response;
  const { data, error } = await parseBody(req, createTransferSchema);
  if (error) return error;
  try {
    const created = await createTransfer(
      guard.user!.id,
      data,
      getClientIp(req)
    );
    return jsonResponse({ ok: true, message: "Transfer request submitted.", data: created }, 201);
  } catch (e) {
    if (e instanceof TransferError) {
      return jsonResponse({ ok: false, message: e.message }, 403);
    }
    return jsonResponse({ ok: false, message: "Could not create transfer." }, 500);
  }
}
