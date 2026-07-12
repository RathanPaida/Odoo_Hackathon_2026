import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import { reviewTransfer } from "@/lib/services/admin/transfer-service";

import { UserRole } from "@/types";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireRole("ADMIN", "ASSET_MANAGER");
  if (response) return response;

  try {
    const { id } = await params;
    const body = await req.json();
    const data = await reviewTransfer(id, body.status, user.id);
    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 400 });
  }
}
