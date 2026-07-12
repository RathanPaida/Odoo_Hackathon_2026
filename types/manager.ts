// types/manager.ts
// Shared TypeScript types for the Asset Manager Module.
// These are DTOs returned by the manager APIs; they never expose raw DB rows.

export type AssetStatus =
  | "AVAILABLE"
  | "ALLOCATED"
  | "IN_MAINTENANCE"
  | "RETURNED"
  | "LOST"
  | "DISPOSED";

export type AssetCondition = "NEW" | "GOOD" | "FAIR" | "POOR" | "DAMAGED";

export type TransferStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export type ReturnStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export type MaintenanceStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "IN_PROGRESS"
  | "RESOLVED";

export type MaintenancePriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type BookingStatus = "UPCOMING" | "CURRENT" | "COMPLETED" | "CANCELLED";

// ---- Asset DTOs (full detail for manager) ----

export interface ManagerAssetDto {
  id: string;
  name: string;
  assetTag: string;
  serialNumber: string | null;
  acquisitionDate: string | null;
  acquisitionCost: number | null;
  condition: AssetCondition;
  location: string | null;
  photoUrl: string | null;
  status: AssetStatus;
  categoryId: string;
  categoryName: string;
  departmentId: string | null;
  departmentName: string | null;
  holderId: string | null;
  holderName: string | null;
  isBookable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ManagerAssetDetailsDto extends ManagerAssetDto {
  allocations: AssetAllocationInfo[];
  maintenanceHistory: MaintenanceHistoryItemDto[];
  history: AssetHistoryItemDto[];
}

export interface AssetAllocationInfo {
  id: string;
  userId: string;
  userName: string;
  allocatedAt: string;
  expectedReturnDate: string | null;
  isActive: boolean;
}

export interface AssetHistoryItemDto {
  id: string;
  action: string;
  fromUserName: string | null;
  toUserName: string | null;
  notes: string | null;
  condition: string | null;
  createdAt: string;
}

export interface MaintenanceHistoryItemDto {
  id: string;
  issueDescription: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  createdAt: string;
  resolvedAt: string | null;
}

// ---- Category DTOs ----

export interface CategoryDto {
  id: string;
  name: string;
  description: string | null;
  customFields: string | null;
  assetCount: number;
  createdAt: string;
  updatedAt: string;
}

// ---- Transfer DTOs (manager view — all pending/approved/rejected) ----

export interface ManagerTransferDto {
  id: string;
  assetId: string;
  assetName: string;
  assetTag: string;
  requestedById: string;
  requestedByName: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  reason: string | null;
  status: TransferStatus;
  reviewedById: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  canReview: boolean;
}

// ---- Return DTOs (manager view) ----

export interface ManagerReturnDto {
  id: string;
  assetId: string;
  assetName: string;
  assetTag: string;
  requestedById: string;
  requestedByName: string;
  conditionNotes: string | null;
  imageUrls: string[];
  status: ReturnStatus;
  createdAt: string;
  updatedAt: string;
  canReview: boolean;
}

// ---- Booking DTOs (manager view — all bookings) ----

export interface ManagerBookingDto {
  id: string;
  assetId: string;
  assetName: string;
  assetTag: string;
  userId: string;
  userName: string;
  startTime: string;
  endTime: string;
  purpose: string | null;
  status: BookingStatus;
  createdAt: string;
}

// ---- Maintenance DTOs (manager view) ----

export interface ManagerMaintenanceDto {
  id: string;
  assetId: string;
  assetName: string;
  assetTag: string;
  requestedById: string;
  requestedByName: string;
  issueDescription: string;
  priority: MaintenancePriority;
  photoUrl: string | null;
  status: MaintenanceStatus;
  technicianId: string | null;
  technicianName: string | null;
  technicianNotes: string | null;
  approvedById: string | null;
  approvedByName: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  canReview: boolean;
}

// ---- Dashboard ----

export interface ManagerDashboardStats {
  totalAssets: number;
  availableAssets: number;
  allocatedAssets: number;
  maintenanceInFlight: number;
  pendingTransfers: number;
  pendingReturns: number;
  activeBookings: number;
  categories: number;
}

// ---- Pagination ----

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ---- Employee summary for dropdowns ----

export interface EmployeeSummary {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  departmentId: string | null;
  departmentName: string | null;
}
