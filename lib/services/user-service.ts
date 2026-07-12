// lib/services/user-service.ts
// Reusable user database operations. Keeps Prisma logic out of routes.
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import type { PublicUser } from "@/types";

type UserRecord = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  status: string;
  emailVerified: boolean;
  avatarUrl: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  departmentId: string | null;
  employeeId: string | null;
};

// Strip sensitive fields and normalize dates to ISO strings.
export function toPublicUser(u: UserRecord): PublicUser {
  return {
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    role: u.role as PublicUser["role"],
    status: u.status as PublicUser["status"],
    emailVerified: u.emailVerified,
    avatarUrl: u.avatarUrl,
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
    createdAt: u.createdAt.toISOString(),
    departmentId: u.departmentId,
    employeeId: u.employeeId,
  };
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id, deletedAt: null } });
}

export async function updateProfile(
  id: string,
  data: { firstName?: string; lastName?: string; avatarUrl?: string | null }
) {
  return prisma.user.update({ where: { id }, data });
}

export async function changeEmail(id: string, newEmail: string) {
  return prisma.user.update({
    where: { id },
    data: { email: newEmail, emailVerified: false },
  });
}

export async function changePassword(id: string, newPlain: string) {
  const passwordHash = await hashPassword(newPlain);
  return prisma.user.update({ where: { id }, data: { passwordHash } });
}

export async function verifyCurrentPassword(id: string, plain: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return false;
  return verifyPassword(plain, user.passwordHash);
}

export async function deleteAccount(id: string) {
  // Hard delete cascades (email verifications, resets, sessions, tokens).
  // Swap to soft delete by setting deletedAt if preferred.
  return prisma.user.delete({ where: { id } });
}

// ERP admin helper: assign a role to a user (Admin "Assign Roles" permission).
export async function assignRole(id: string, role: UserRecord["role"]) {
  return prisma.user.update({ where: { id }, data: { role } });
}

// ERP admin helper: set a user's home department and/or employee reference.
export async function setDepartment(
  id: string,
  departmentId: string | null,
  employeeId?: string | null
) {
  return prisma.user.update({
    where: { id },
    data: { departmentId, ...(employeeId !== undefined ? { employeeId } : {}) },
  });
}
