import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import { allocateAsset } from "@/lib/services/manager/assets.service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response, user } = await requireRole("ASSET_MANAGER");
  if (response) return response;

  try {
    const { id } = await params;
    const body = await req.json();
    const asset = await allocateAsset(user!.id, id, body.holderId || null, req.headers.get("x-forwarded-for"));
    return NextResponse.json({ ok: true, data: asset }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 400 });
  }
}
