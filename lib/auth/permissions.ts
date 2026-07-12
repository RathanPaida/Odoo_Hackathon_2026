// lib/auth/permissions.ts
// Role-Based Access Control (RBAC) for AssetFlow ERP.
// Defines fine-grained permissions and maps them to roles. Framework-agnostic;
// guards in lib/auth/guard.ts build on these helpers.
import type { UserRole } from "@/types";

// All fine-grained permissions in the system.
export const PERMISSIONS = {
  // Admin
  MANAGE_DEPARTMENTS: "manage_departments",
  MANAGE_EMPLOYEES: "manage_employees",
  ASSIGN_ROLES: "assign_roles",
  MANAGE_CATEGORIES: "manage_categories",
  VIEW_REPORTS: "view_reports",
  VIEW_DASHBOARD: "view_dashboard",
  MANAGE_AUDIT_CYCLES: "manage_audit_cycles",
  // Asset Manager
  REGISTER_ASSETS: "register_assets",
  ALLOCATE_ASSETS: "allocate_assets",
  APPROVE_TRANSFERS: "approve_transfers",
  APPROVE_MAINTENANCE: "approve_maintenance",
  APPROVE_RETURNS: "approve_returns",
  // Department Head
  VIEW_DEPARTMENT_ASSETS: "view_department_assets",
  APPROVE_DEPARTMENT_TRANSFERS: "approve_department_transfers",
  BOOK_SHARED_RESOURCES: "book_shared_resources",
  // Employee
  VIEW_MY_ASSETS: "view_my_assets",
  BOOK_RESOURCES: "book_resources",
  RAISE_MAINTENANCE_REQUESTS: "raise_maintenance_requests",
  INITIATE_TRANSFER_REQUESTS: "initiate_transfer_requests",
  INITIATE_RETURN_REQUESTS: "initiate_return_requests",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Role -> permissions assignment (per AssetFlow spec).
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    PERMISSIONS.MANAGE_DEPARTMENTS,
    PERMISSIONS.MANAGE_EMPLOYEES,
    PERMISSIONS.ASSIGN_ROLES,
    PERMISSIONS.MANAGE_CATEGORIES,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.MANAGE_AUDIT_CYCLES,
    PERMISSIONS.REGISTER_ASSETS,
    PERMISSIONS.ALLOCATE_ASSETS,
    PERMISSIONS.APPROVE_TRANSFERS,
    PERMISSIONS.APPROVE_MAINTENANCE,
    PERMISSIONS.APPROVE_RETURNS,
    PERMISSIONS.VIEW_DEPARTMENT_ASSETS,
    PERMISSIONS.APPROVE_DEPARTMENT_TRANSFERS,
    PERMISSIONS.BOOK_SHARED_RESOURCES,
    PERMISSIONS.VIEW_MY_ASSETS,
    PERMISSIONS.BOOK_RESOURCES,
    PERMISSIONS.RAISE_MAINTENANCE_REQUESTS,
    PERMISSIONS.INITIATE_TRANSFER_REQUESTS,
    PERMISSIONS.INITIATE_RETURN_REQUESTS,
  ],
  ASSET_MANAGER: [
    PERMISSIONS.REGISTER_ASSETS,
    PERMISSIONS.ALLOCATE_ASSETS,
    PERMISSIONS.APPROVE_TRANSFERS,
    PERMISSIONS.APPROVE_MAINTENANCE,
    PERMISSIONS.APPROVE_RETURNS,
    PERMISSIONS.VIEW_DASHBOARD,
  ],
  DEPARTMENT_HEAD: [
    PERMISSIONS.VIEW_DEPARTMENT_ASSETS,
    PERMISSIONS.APPROVE_DEPARTMENT_TRANSFERS,
    PERMISSIONS.BOOK_SHARED_RESOURCES,
    PERMISSIONS.VIEW_DASHBOARD,
  ],
  EMPLOYEE: [
    PERMISSIONS.VIEW_MY_ASSETS,
    PERMISSIONS.BOOK_RESOURCES,
    PERMISSIONS.RAISE_MAINTENANCE_REQUESTS,
    PERMISSIONS.INITIATE_TRANSFER_REQUESTS,
    PERMISSIONS.INITIATE_RETURN_REQUESTS,
    PERMISSIONS.VIEW_DASHBOARD,
  ],
};

// All permissions granted to a role (memo-free, small map).
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

// True if the role holds the given permission.
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return getRolePermissions(role).includes(permission);
}

// True if the role holds EVERY listed permission.
export function hasAllPermissions(
  role: UserRole,
  permissions: Permission[]
): boolean {
  const granted = getRolePermissions(role);
  return permissions.every((p) => granted.includes(p));
}

// True if the role holds AT LEAST ONE listed permission.
export function hasAnyPermission(
  role: UserRole,
  permissions: Permission[]
): boolean {
  const granted = getRolePermissions(role);
  return permissions.some((p) => granted.includes(p));
}
