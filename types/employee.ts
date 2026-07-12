// types/employee.ts
// Shared TypeScript types for the Employee Module.
// These are DTOs returned by the employee APIs; they never expose raw DB rows.

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

export type NotificationType =
  | "ASSET_ASSIGNED"
  | "MAINTENANCE"
  | "TRANSFER"
  | "BOOKING"
  | "RETURN"
  | "REMINDER";

export interface EmployeeSummary {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  departmentId: string | null;
  departmentName: string | null;
}

export interface BookableAsset {
  id: string;
  name: string;
  assetTag: string;
  categoryName: string;
  location: string | null;
}

export interface AssetAllocationDto {
  id: string;
  assetId: string;
  allocatedAt: string;
  expectedReturnDate: string | null;
  actualReturnDate: string | null;
  conditionNotes: string | null;
  isActive: boolean;
  asset: AssetDto;
}

export interface AssetDto {
  id: string;
  name: string;
  assetTag: string;
  serialNumber: string | null;
  condition: AssetCondition;
  location: string | null;
  photoUrl: string | null;
  status: AssetStatus;
  categoryName: string;
  description: string | null;
  isBookable: boolean;
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

export interface AssetDetailsDto extends AssetAllocationDto {
  maintenanceHistory: MaintenanceHistoryItemDto[];
  history: AssetHistoryItemDto[];
}

export interface TransferRequestDto {
  id: string;
  assetId: string;
  assetName: string;
  assetTag: string;
  fromUserId: string;
  toUserId: string;
  toUserName: string;
  reason: string | null;
  status: TransferStatus;
  createdAt: string;
  updatedAt: string;
  canCancel: boolean;
}

export interface ReturnRequestDto {
  id: string;
  assetId: string;
  assetName: string;
  assetTag: string;
  conditionNotes: string | null;
  imageUrls: string[];
  status: ReturnStatus;
  createdAt: string;
  updatedAt: string;
  canCancel: boolean;
}

export interface MaintenanceRequestDto {
  id: string;
  assetId: string;
  assetName: string;
  assetTag: string;
  issueDescription: string;
  priority: MaintenancePriority;
  photoUrl: string | null;
  status: MaintenanceStatus;
  technicianNotes: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

export interface ResourceBookingDto {
  id: string;
  assetId: string;
  assetName: string;
  assetTag: string;
  startTime: string;
  endTime: string;
  purpose: string | null;
  status: BookingStatus; // derived for CURRENT
  createdAt: string;
}

export interface NotificationDto {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export interface ActivityItemDto {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, unknown> | null;
  createdAt: string;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface EmployeeDashboardStats {
  activeAssets: number;
  upcomingReturns: number;
  activeBookings: number;
  pendingMaintenance: number;
  unreadNotifications: number;
}
