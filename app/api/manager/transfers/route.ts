// app/api/manager/transfers/route.ts
// GET — list all transfer requests (paginated, filterable by status)
import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import { jsonResponse } from "@/lib/request";
import { managerTransferQuerySchema } from "@/validations/manager";
import * as transferService from "@/lib/services/manager/transfers.service";

export async function GET(req: NextRequest) {
  const guard = await requireRole("ASSET_MANAGER", "ADMIN");
  if (guard.response) return guard.response;

  const sp = req.nextUrl.searchParams;
  const parsed = managerTransferQuerySchema.safeParse({
    status: sp.get("status") ?? undefined,
    page: sp.get("page") ?? undefined,
    pageSize: sp.get("pageSize") ?? undefined,
  });
  if (!parsed.success) {
    return jsonResponse(
      { ok: false, message: "Invalid query", errors: parsed.error.flatten().fieldErrors },
      422
    );
  }

  const data = await transferService.listTransfers(parsed.data);
  return jsonResponse({ ok: true, data });
}
