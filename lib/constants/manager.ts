// lib/constants/manager.ts
// Status enums, labels, colour maps and navigation for the Asset Manager Module.
import type {
  AssetCondition,
  AssetStatus,
  BookingStatus,
  MaintenancePriority,
  MaintenanceStatus,
  ReturnStatus,
  TransferStatus,
} from "@/types/manager";

// ---- Asset status ----
export const ASSET_STATUS: AssetStatus[] = [
  "AVAILABLE",
  "ALLOCATED",
  "IN_MAINTENANCE",
  "RETURNED",
  "LOST",
  "DISPOSED",
];
export const ASSET_STATUS_LABEL: Record<AssetStatus, string> = {
  AVAILABLE: "Available",
  ALLOCATED: "Allocated",
  IN_MAINTENANCE: "In Maintenance",
  RETURNED: "Returned",
  LOST: "Lost",
  DISPOSED: "Disposed",
};
export const ASSET_STATUS_BADGE: Record<AssetStatus, string> = {
  AVAILABLE: "bg-emerald-100 text-emerald-700",
  ALLOCATED: "bg-indigo-100 text-indigo-700",
  IN_MAINTENANCE: "bg-amber-100 text-amber-700",
  RETURNED: "bg-slate-100 text-slate-600",
  LOST: "bg-rose-100 text-rose-700",
  DISPOSED: "bg-slate-100 text-slate-500",
};

// ---- Asset condition ----
export const ASSET_CONDITION: AssetCondition[] = [
  "NEW",
  "GOOD",
  "FAIR",
  "POOR",
  "DAMAGED",
];
export const ASSET_CONDITION_LABEL: Record<AssetCondition, string> = {
  NEW: "New",
  GOOD: "Good",
  FAIR: "Fair",
  POOR: "Poor",
  DAMAGED: "Damaged",
};
export const ASSET_CONDITION_BADGE: Record<AssetCondition, string> = {
  NEW: "bg-emerald-100 text-emerald-700",
  GOOD: "bg-teal-100 text-teal-700",
  FAIR: "bg-sky-100 text-sky-700",
  POOR: "bg-amber-100 text-amber-700",
  DAMAGED: "bg-rose-100 text-rose-700",
};

// ---- Transfer ----
export const TRANSFER_STATUS: TransferStatus[] = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
];
export const TRANSFER_LABEL: Record<TransferStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};
export const TRANSFER_BADGE: Record<TransferStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
  CANCELLED: "bg-slate-100 text-slate-600",
};

// ---- Return ----
export const RETURN_STATUS: ReturnStatus[] = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
];
export const RETURN_LABEL: Record<ReturnStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};
export const RETURN_BADGE: Record<ReturnStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
  CANCELLED: "bg-slate-100 text-slate-600",
};

// ---- Maintenance ----
export const MAINTENANCE_STATUS: MaintenanceStatus[] = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "IN_PROGRESS",
  "RESOLVED",
];
export const MAINTENANCE_LABEL: Record<MaintenanceStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
};
export const MAINTENANCE_BADGE: Record<MaintenanceStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-indigo-100 text-indigo-700",
  REJECTED: "bg-rose-100 text-rose-700",
  IN_PROGRESS: "bg-sky-100 text-sky-700",
  RESOLVED: "bg-emerald-100 text-emerald-700",
};

export const MAINTENANCE_PRIORITY: MaintenancePriority[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
];
export const PRIORITY_LABEL: Record<MaintenancePriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};
export const PRIORITY_BADGE: Record<MaintenancePriority, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-sky-100 text-sky-700",
  HIGH: "bg-amber-100 text-amber-700",
  CRITICAL: "bg-rose-100 text-rose-700",
};

// ---- Booking ----
export const BOOKING_LABEL: Record<BookingStatus, string> = {
  UPCOMING: "Upcoming",
  CURRENT: "Current",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};
export const BOOKING_BADGE: Record<BookingStatus, string> = {
  UPCOMING: "bg-sky-100 text-sky-700",
  CURRENT: "bg-indigo-100 text-indigo-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-slate-100 text-slate-600",
};

// ---- Navigation ----
export const MANAGER_NAV = [
  { href: "/dashboard/manager", label: "Dashboard" },
  { href: "/dashboard/manager/assets", label: "Assets" },
  { href: "/dashboard/manager/categories", label: "Categories" },
  { href: "/dashboard/manager/transfers", label: "Transfers" },
  { href: "/dashboard/manager/returns", label: "Returns" },
  { href: "/dashboard/manager/maintenance", label: "Maintenance" },
  { href: "/dashboard/manager/bookings", label: "Bookings" },
];
