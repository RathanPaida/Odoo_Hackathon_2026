// actions/auth.ts
// Server Actions for authentication. Provided as an alternative to the REST
// API for forms that submit directly from Server Components. The REST API
// under /api/* is the primary interface used by the client components here.
"use server";

import { cookies } from "next/headers";
import { destroySession, REFRESH_COOKIE } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export async function logoutAction() {
  const store = await cookies();
  await destroySession(store.get(REFRESH_COOKIE)?.value);
  redirect("/login");
}
