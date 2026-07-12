import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import { allocateAsset } from "@/lib/services/admin/asset-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response, user } = await requireRole("ADMIN", "ASSET_MANAGER");
  if (response) return response;

  try {
    const { id } = await params;
    const body = await req.json();
    const asset = await allocateAsset(id, body.holderId || null, user!.id);
    return NextResponse.json({ ok: true, data: asset }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 400 });
  }
}
