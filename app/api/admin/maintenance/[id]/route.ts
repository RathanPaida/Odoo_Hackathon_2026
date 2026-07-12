import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import { reviewMaintenance } from "@/lib/services/admin/maintenance-service";

import { UserRole } from "@/types";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireRole("ADMIN", "ASSET_MANAGER");
  if (response) return response;

  try {
    const { id } = await params;
    const body = await req.json();
    const data = await reviewMaintenance(id, body.status, user.id, body.technicianNotes);
    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 400 });
  }
}
