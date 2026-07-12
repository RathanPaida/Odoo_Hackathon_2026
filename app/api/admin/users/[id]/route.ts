// app/api/admin/users/[id]/route.ts
// PATCH /api/admin/users/[id] -> update role / status / department (Admin only).
// Changing the role revokes the user's active sessions & refresh tokens,
// forcing re-authentication so their new JWT carries the updated role.
import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import { jsonResponse } from "@/lib/request";
import { prisma } from "@/lib/db";
import { updateUserSchema } from "@/validations/admin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireRole("ADMIN");
  if (guard.response) return guard.response;

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ ok: false, message: "Invalid JSON body." }, 400);
  }

  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse(
      {
        ok: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      },
      422
    );
  }

  const target = await prisma.user.findUnique({
    where: { id, deletedAt: null },
  });
  if (!target) {
    return jsonResponse({ ok: false, message: "User not found." }, 404);
  }

  const { role, status, departmentId } = parsed.data;
  const data: Record<string, unknown> = {};
  if (role !== undefined) data.role = role;
  if (status !== undefined) data.status = status;
  if (departmentId !== undefined) data.departmentId = departmentId;

  const updated = await prisma.user.update({ where: { id }, data });

  // Security: a role change must invalidate existing tokens so the user
  // re-authenticates and receives a JWT with the new role.
  if (role !== undefined && role !== target.role) {
    await prisma.$transaction([
      prisma.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      prisma.session.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  return jsonResponse({
    ok: true,
    message: "User updated.",
    data: { id: updated.id, role: updated.role, status: updated.status },
  });
}
