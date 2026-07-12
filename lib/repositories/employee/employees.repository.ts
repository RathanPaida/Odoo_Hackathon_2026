// lib/repositories/employee/employees.repository.ts
// Prisma access for the employee directory used as transfer targets.
// Independent of the Admin module: lists EMPLOYEE-role users only, scoped to
// what an employee needs to pick a transfer recipient.
import { prisma } from "@/lib/db";
import type { EmployeeSummary, Paginated } from "@/types/employee";

function map(row: any): EmployeeSummary {
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    departmentId: row.departmentId,
    departmentName: row.department?.name ?? null,
  };
}

export async function listEmployees(
  opts: { q?: string; skip: number; take: number },
  excludeId?: string
): Promise<Paginated<EmployeeSummary>> {
  const where: any = {
    role: "EMPLOYEE",
    deletedAt: null,
    ...(excludeId ? { id: { not: excludeId } } : {}),
    ...(opts.q
      ? {
          OR: [
            { email: { contains: opts.q } },
            { firstName: { contains: opts.q } },
            { lastName: { contains: opts.q } },
          ],
        }
      : {}),
  };
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
      orderBy: [{ firstName: "asc" }, { email: "asc" }],
      skip: opts.skip,
      take: opts.take,
    }),
    prisma.user.count({ where }),
  ]);
  return {
    data: rows.map(map),
    total,
    page: Math.floor(opts.skip / opts.take) + 1,
    pageSize: opts.take,
    totalPages: Math.max(1, Math.ceil(total / opts.take)),
  };
}

export async function getEmployeeById(
  id: string
): Promise<EmployeeSummary | null> {
  const row = await prisma.user.findFirst({
    where: { id, role: "EMPLOYEE", deletedAt: null },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      departmentId: true,
      department: { select: { name: true } },
    },
  });
  return row ? map(row) : null;
}
