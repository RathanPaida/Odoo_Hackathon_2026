// lib/auth/guard.ts
// Server-side guard helpers for API routes and server actions.
import { getCurrentUser } from "@/lib/auth/session";
import { jsonResponse } from "@/lib/request";
import { hasAllPermissions } from "@/lib/auth/permissions";
import type { UserRole } from "@/types";
import type { Permission } from "@/lib/auth/permissions";

// Returns the user or a 401 Response you can return directly.
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    return {
      user: null,
      response: jsonResponse({ ok: false, message: "Unauthenticated." }, 401),
    } as const;
  }
  return { user, response: null } as const;
}

// Requires the authenticated user to hold one of the given roles.
// Returns `{ user, response: null }` on success, or a 401/403 Response.
export async function requireRole(...roles: UserRole[]) {
  const user = await getCurrentUser();
  if (!user) {
    return {
      user: null,
      response: jsonResponse({ ok: false, message: "Unauthenticated." }, 401),
    } as const;
  }
  if (!roles.includes(user.role as UserRole)) {
    return {
      user,
      response: jsonResponse(
        { ok: false, message: "You do not have access to this area." },
        403
      ),
    } as const;
  }
  return { user, response: null } as const;
}

// Requires the authenticated user to hold ALL given permissions.
export async function requirePermission(...permissions: Permission[]) {
  const user = await getCurrentUser();
  if (!user) {
    return {
      user: null,
      response: jsonResponse({ ok: false, message: "Unauthenticated." }, 401),
    } as const;
  }
  if (!hasAllPermissions(user.role as UserRole, permissions)) {
    return {
      user,
      response: jsonResponse(
        { ok: false, message: "You are missing required permissions." },
        403
      ),
    } as const;
  }
  return { user, response: null } as const;
}
