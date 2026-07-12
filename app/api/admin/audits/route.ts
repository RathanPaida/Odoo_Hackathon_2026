import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import { getAudits, createAudit } from "@/lib/services/admin/audit-service";

export async function GET(req: Request) {
  const { response } = await requireRole("ADMIN");
  if (response) return response;

  try {
    const data = await getAudits();
    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  const { user, response } = await requireRole("ADMIN");
  if (response) return response;

  try {
    const body = await req.json();
    const data = await createAudit({ ...body, createdById: user.id });
    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 400 });
  }
}
