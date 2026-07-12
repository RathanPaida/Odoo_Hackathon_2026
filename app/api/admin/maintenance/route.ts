import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import { getMaintenance } from "@/lib/services/admin/maintenance-service";

export async function GET(req: Request) {
  const { response } = await requireRole("ADMIN", "ASSET_MANAGER");
  if (response) return response;

  const url = new URL(req.url);
  const status = url.searchParams.get("status") || undefined;

  try {
    const data = await getMaintenance({ status });
    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 400 });
  }
}
