// lib/auth/navigation.ts
// Role-aware navigation for the authenticated app shell.
// Keeps nav definitions in one place so UI and guards stay consistent.
import type { UserRole } from "@/types";
import { ROLE_DASHBOARD, ROLE_LABELS } from "@/lib/auth/roles";

export interface NavItem {
  href: string;
  label: string;
}

// Base items every authenticated user sees.
const COMMON: NavItem[] = [
  { href: "/profile", label: "Profile" },
  { href: "/settings", label: "Settings" },
];

// Role-specific primary navigation (the role dashboard + extras).
const ROLE_NAV: Record<UserRole, NavItem[]> = {
  ADMIN: [
    { href: ROLE_DASHBOARD.ADMIN, label: "Admin Console" },
    { href: ROLE_DASHBOARD.ADMIN + "#departments", label: "Departments" },
    { href: ROLE_DASHBOARD.ADMIN + "#employees", label: "Employees" },
    { href: ROLE_DASHBOARD.ADMIN + "#audit", label: "Audit Cycles" },
  ],
  ASSET_MANAGER: [
    { href: ROLE_DASHBOARD.ASSET_MANAGER, label: "Asset Manager" },
    { href: ROLE_DASHBOARD.ASSET_MANAGER + "#assets", label: "Assets" },
    { href: ROLE_DASHBOARD.ASSET_MANAGER + "#transfers", label: "Transfers" },
  ],
  DEPARTMENT_HEAD: [
    { href: ROLE_DASHBOARD.DEPARTMENT_HEAD, label: "Overview" },
    { href: ROLE_DASHBOARD.DEPARTMENT_HEAD + "/assets", label: "Assets" },
    { href: ROLE_DASHBOARD.DEPARTMENT_HEAD + "/requests", label: "Requests" },
    { href: ROLE_DASHBOARD.DEPARTMENT_HEAD + "/booking", label: "Booking" },
  ],
  EMPLOYEE: [
    { href: ROLE_DASHBOARD.EMPLOYEE, label: "My Workspace" },
    { href: ROLE_DASHBOARD.EMPLOYEE + "#assets", label: "My Assets" },
    { href: ROLE_DASHBOARD.EMPLOYEE + "#requests", label: "My Requests" },
  ],
};

// Full navigation for a role: role module links first, then common links.
export function getRoleNav(role: UserRole): NavItem[] {
  const base = (ROLE_NAV[role] ?? ROLE_NAV.EMPLOYEE).map((n) => ({
    ...n,
    label: n.label === "Dashboard" ? ROLE_LABELS[role] : n.label,
  }));
  return [...base, ...COMMON];
}
