import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import { getAssets, createAsset } from "@/lib/services/admin/asset-service";

export async function GET(req: Request) {
  const { response } = await requireRole("ADMIN", "ASSET_MANAGER");
  if (response) return response;

  const url = new URL(req.url);
  const q = url.searchParams.get("q") || undefined;
  const departmentId = url.searchParams.get("departmentId") || undefined;
  const categoryId = url.searchParams.get("categoryId") || undefined;
  const status = url.searchParams.get("status") || undefined;

  try {
    const assets = await getAssets({ q, departmentId, categoryId, status });
    return NextResponse.json({ ok: true, data: assets });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  const { response } = await requireRole("ADMIN", "ASSET_MANAGER");
  if (response) return response;

  try {
    const body = await req.json();
    const asset = await createAsset(body);
    return NextResponse.json({ ok: true, data: asset }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 400 });
  }
}
