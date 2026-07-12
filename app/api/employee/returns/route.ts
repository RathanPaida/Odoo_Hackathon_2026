// app/api/employee/returns/route.ts
// GET  /api/employee/returns -> employee's return requests
// POST /api/employee/returns -> create a return request (PENDING)
import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/guard";
import { jsonResponse, getClientIp } from "@/lib/request";
import { createReturnSchema } from "@/validations/employee";
import {
  createReturn,
  listReturns,
  ReturnError,
} from "@/lib/services/employee/returns.service";
import { parseBody } from "@/lib/utils/employee";

export async function GET(req: NextRequest) {
  const guard = await requireUser();
  if (guard.response) return guard.response;
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") ?? 1) || 1;
  const pageSize = Number(searchParams.get("pageSize") ?? 12) || 12;
  const data = await listReturns(guard.user!.id, page, pageSize);
  return jsonResponse({ ok: true, data });
}

export async function POST(req: NextRequest) {
  const guard = await requireUser();
  if (guard.response) return guard.response;
  const { data, error } = await parseBody(req, createReturnSchema);
  if (error) return error;
  try {
    const created = await createReturn(
      guard.user!.id,
      {
        assetId: data.assetId,
        conditionNotes: data.conditionNotes,
        imageUrls: data.imageUrls ?? [],
      },
      getClientIp(req)
    );
    return jsonResponse({ ok: true, message: "Return request submitted.", data: created }, 201);
  } catch (e) {
    if (e instanceof ReturnError) {
      return jsonResponse({ ok: false, message: e.message }, 403);
    }
    return jsonResponse({ ok: false, message: "Could not create return." }, 500);
  }
}
