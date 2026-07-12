// lib/auth/roles.ts
// ERP role definitions and role-aware routing for AssetFlow.
// Pure, framework-agnostic — safe to import from server or client.
import type { UserRole } from "@/types";

// All ERP roles (superset of the Prisma UserRole enum).
export const ROLES: UserRole[] = [
  "ADMIN",
  "ASSET_MANAGER",
  "DEPARTMENT_HEAD",
  "EMPLOYEE",
];

// Human-readable labels for UI.
export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrator",
  ASSET_MANAGER: "Asset Manager",
  DEPARTMENT_HEAD: "Department Head",
  EMPLOYEE: "Employee",
};

// The dashboard route each role lands on after login.
export const ROLE_DASHBOARD: Record<UserRole, string> = {
  ADMIN: "/dashboard/admin",
  ASSET_MANAGER: "/dashboard/manager",
  DEPARTMENT_HEAD: "/dashboard/head",
  EMPLOYEE: "/dashboard/employee",
};

// Reverse lookup: dashboard sub-path -> required role.
export const DASHBOARD_ROUTE_ROLE: Record<string, UserRole> = {
  "/dashboard/admin": "ADMIN",
  "/dashboard/manager": "ASSET_MANAGER",
  "/dashboard/head": "DEPARTMENT_HEAD",
  "/dashboard/employee": "EMPLOYEE",
};

// Roles that may access every dashboard area (superusers).
export const SUPER_ROLES: UserRole[] = ["ADMIN"];

export function isRole(value: unknown): value is UserRole {
  return typeof value === "string" && (ROLES as string[]).includes(value);
}

// The dashboard path a user should be sent to.
export function dashboardForRole(role: UserRole): string {
  return ROLE_DASHBOARD[role] ?? "/dashboard/employee";
}

export function roleLabel(role: UserRole): string {
  return ROLE_LABELS[role] ?? role;
}
