import { prisma as db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function getDepartments() {
  return db.department.findMany({
    include: {
      head: { select: { id: true, firstName: true, lastName: true, email: true } },
      parent: { select: { id: true, name: true, code: true } },
      _count: { select: { users: true, assets: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getDepartmentById(id: string) {
  return db.department.findUnique({
    where: { id },
    include: {
      head: { select: { id: true, firstName: true, lastName: true, email: true } },
      parent: { select: { id: true, name: true } },
    },
  });
}

export async function createDepartment(data: {
  name: string;
  code: string;
  description?: string | null;
  headId?: string | null;
  parentId?: string | null;
  status: string;
}) {
  return db.department.create({
    data: {
      ...data,
      headId: data.headId || null,
      parentId: data.parentId || null,
    },
  });
}

export async function updateDepartment(
  id: string,
  data: Partial<{
    name: string;
    code: string;
    description: string | null;
    headId: string | null;
    parentId: string | null;
    status: string;
  }>
) {
  // Prevent circular parent dependency
  if (data.parentId === id) {
    throw new Error("A department cannot be its own parent.");
  }

  return db.department.update({
    where: { id },
    data: {
      ...data,
      headId: data.headId || null,
      parentId: data.parentId || null,
    },
  });
}

export async function deleteDepartment(id: string) {
  // We do soft-delete or check if there are users/assets.
  // SQLite schema doesn't have deletedAt on department, so we can set status to INACTIVE
  return db.department.update({
    where: { id },
    data: { status: "INACTIVE" },
  });
}
