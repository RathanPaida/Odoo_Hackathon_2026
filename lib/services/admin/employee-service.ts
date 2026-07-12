import { prisma as db } from "@/lib/db";

export async function getEmployees() {
  return db.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      employeeId: true,
      lastLoginAt: true,
      department: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateEmployeeRole(id: string, role: string) {
  // If role changes, we could invalidate refresh tokens here to force re-login.
  await db.refreshToken.deleteMany({
    where: { userId: id },
  });
  
  return db.user.update({
    where: { id },
    data: { role },
  });
}

export async function updateEmployeeDepartment(id: string, departmentId: string | null) {
  return db.user.update({
    where: { id },
    data: { departmentId },
  });
}
