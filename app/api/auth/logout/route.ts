// app/api/auth/logout/route.ts
import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { destroySession, REFRESH_COOKIE } from "@/lib/auth/session";
import { jsonResponse } from "@/lib/request";

export async function POST() {
  const store = await cookies();
  const rawRefresh = store.get(REFRESH_COOKIE)?.value;
  await destroySession(rawRefresh);
  return jsonResponse({ ok: true, message: "Logged out." });
}
