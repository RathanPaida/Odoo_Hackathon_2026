// app/api/admin/users/route.ts
// GET /api/admin/users -> Employee Directory (Admin only).
// Lists users with optional ?q= search and ?departmentId= filter.
import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import { jsonResponse } from "@/lib/request";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const guard = await requireRole("ADMIN");
  if (guard.response) return guard.response;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const departmentId = searchParams.get("departmentId");

  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      ...(q
        ? {
            OR: [
              { email: { contains: q } },
              { firstName: { contains: q } },
              { lastName: { contains: q } },
            ],
          }
        : {}),
      ...(departmentId ? { departmentId } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      status: true,
      emailVerified: true,
      departmentId: true,
      department: { select: { id: true, name: true, code: true } },
      lastLoginAt: true,
      createdAt: true,
    },
  });

  return jsonResponse({ ok: true, data: users });
}
