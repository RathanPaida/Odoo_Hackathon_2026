// app/api/manager/returns/[id]/route.ts
// GET  — return detail
// POST — approve/reject return
import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import { jsonResponse, getClientIp } from "@/lib/request";
import { parseBody } from "@/lib/utils/manager";
import { reviewReturnSchema } from "@/validations/manager";
import * as returnService from "@/lib/services/manager/returns.service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireRole("ASSET_MANAGER", "ADMIN");
  if (guard.response) return guard.response;

  const { id } = await params;
  try {
    const data = await returnService.getReturn(id);
    return jsonResponse({ ok: true, data });
  } catch (e: any) {
    return jsonResponse({ ok: false, message: e.message }, 404);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireRole("ASSET_MANAGER", "ADMIN");
  if (guard.response) return guard.response;

  const { id } = await params;
  const { data, error } = await parseBody(req, reviewReturnSchema);
  if (error) return error;

  try {
    const reviewed = await returnService.reviewReturn(
      guard.user!.id,
      id,
      data,
      getClientIp(req)
    );
    return jsonResponse({
      ok: true,
      message: `Return ${data.status.toLowerCase()}`,
      data: reviewed,
    });
  } catch (e: any) {
    if (e.code === "ALREADY_REVIEWED") {
      return jsonResponse({ ok: false, message: e.message }, 409);
    }
    return jsonResponse({ ok: false, message: e.message }, 404);
  }
}
