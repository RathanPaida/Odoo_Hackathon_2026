// app/api/employee/assets/route.ts
// GET /api/employee/assets -> employee's allocated assets (search/filter/sort/paginate).
import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/guard";
import { jsonResponse } from "@/lib/request";
import { assetQuerySchema } from "@/validations/employee";
import { listMyAssets } from "@/lib/services/employee/assets.service";

export async function GET(req: NextRequest) {
  const guard = await requireUser();
  if (guard.response) return guard.response;

  const { searchParams } = new URL(req.url);
  const parsed = assetQuerySchema.safeParse({
    q: searchParams.get("q") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    condition: searchParams.get("condition") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
    order: searchParams.get("order") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
  });
  if (!parsed.success) {
    return jsonResponse(
      { ok: false, message: "Invalid query", errors: parsed.error.flatten().fieldErrors },
      422
    );
  }

  const data = await listMyAssets(guard.user!.id, parsed.data);
  return jsonResponse({ ok: true, data });
}
