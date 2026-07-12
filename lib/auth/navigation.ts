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
    { href: ROLE_DASHBOARD.ADMIN, label: "Dashboard" },
    { href: ROLE_DASHBOARD.ADMIN + "/org/departments", label: "Organization" },
    { href: ROLE_DASHBOARD.ADMIN + "/assets", label: "Assets" },
    { href: ROLE_DASHBOARD.ADMIN + "/transfers", label: "Transfers" },
    { href: ROLE_DASHBOARD.ADMIN + "/maintenance", label: "Maintenance" },
    { href: ROLE_DASHBOARD.ADMIN + "/returns", label: "Returns" },
    { href: ROLE_DASHBOARD.ADMIN + "/audits", label: "Audits" },
    { href: ROLE_DASHBOARD.ADMIN + "/activity", label: "Activity" },
  ],
  ASSET_MANAGER: [
    { href: ROLE_DASHBOARD.ASSET_MANAGER, label: "Asset Manager" },
    { href: ROLE_DASHBOARD.ASSET_MANAGER + "/assets", label: "Assets" },
    { href: ROLE_DASHBOARD.ASSET_MANAGER + "/transfers", label: "Transfers" },
    { href: ROLE_DASHBOARD.ASSET_MANAGER + "/maintenance", label: "Maintenance" },
    { href: ROLE_DASHBOARD.ASSET_MANAGER + "/returns", label: "Returns" },
    { href: ROLE_DASHBOARD.ASSET_MANAGER + "/bookings", label: "Bookings" },
    { href: ROLE_DASHBOARD.ASSET_MANAGER + "/categories", label: "Categories" },
  ],
  DEPARTMENT_HEAD: [
    { href: ROLE_DASHBOARD.DEPARTMENT_HEAD, label: "Dashboard" },
    { href: ROLE_DASHBOARD.DEPARTMENT_HEAD + "/assets", label: "Assets" },
    { href: ROLE_DASHBOARD.DEPARTMENT_HEAD + "/requests", label: "Requests" },
    { href: ROLE_DASHBOARD.DEPARTMENT_HEAD + "/booking", label: "Booking" },
  ],
  EMPLOYEE: [
    { href: ROLE_DASHBOARD.EMPLOYEE, label: "Dashboard" },
    { href: ROLE_DASHBOARD.EMPLOYEE + "/assets", label: "My Assets" },
    { href: ROLE_DASHBOARD.EMPLOYEE + "/transfers", label: "Transfers" },
    { href: ROLE_DASHBOARD.EMPLOYEE + "/returns", label: "Returns" },
    { href: ROLE_DASHBOARD.EMPLOYEE + "/maintenance", label: "Maintenance" },
    { href: ROLE_DASHBOARD.EMPLOYEE + "/bookings", label: "Bookings" },
    { href: ROLE_DASHBOARD.EMPLOYEE + "/activity", label: "Activity" },
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
