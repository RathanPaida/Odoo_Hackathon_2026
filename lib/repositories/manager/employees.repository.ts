// lib/repositories/manager/employees.repository.ts
// Prisma access for employee lookups (used in dropdowns).
import { prisma } from "@/lib/db";
import type { EmployeeSummary, Paginated } from "@/types/manager";

export async function listEmployees(opts: {
  q?: string;
  skip: number;
  take: number;
}): Promise<Paginated<EmployeeSummary>> {
  const where: any = { deletedAt: null, status: "ACTIVE" };
  if (opts.q) {
    where.OR = [
      { firstName: { contains: opts.q } },
      { lastName: { contains: opts.q } },
      { email: { contains: opts.q } },
    ];
  }
  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        departmentId: true,
        department: { select: { name: true } },
      },
      orderBy: { firstName: "asc" },
      skip: opts.skip,
      take: opts.take,
    }),
    prisma.user.count({ where }),
  ]);
  return {
    data: rows.map((r: any) => ({
      id: r.id,
      firstName: r.firstName,
      lastName: r.lastName,
      email: r.email,
      departmentId: r.departmentId,
      departmentName: r.department?.name ?? null,
    })),
    total,
    page: Math.floor(opts.skip / opts.take) + 1,
    pageSize: opts.take,
    totalPages: Math.max(1, Math.ceil(total / opts.take)),
  };
}
