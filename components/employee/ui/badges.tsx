// components/employee/ui/badges.tsx
// Status / condition / priority / type chips used across the Employee Module.
import {
  ASSET_CONDITION_BADGE,
  ASSET_CONDITION_LABEL,
  ASSET_STATUS_BADGE,
  ASSET_STATUS_LABEL,
  BOOKING_BADGE,
  BOOKING_LABEL,
  MAINTENANCE_BADGE,
  MAINTENANCE_LABEL,
  MAINTENANCE_PRIORITY,
  NOTIFICATION_TYPE_LABEL,
  PRIORITY_BADGE,
  PRIORITY_LABEL,
  RETURN_BADGE,
  RETURN_LABEL,
  TRANSFER_BADGE,
  TRANSFER_LABEL,
} from "@/lib/constants/employee";
import type {
  AssetCondition,
  AssetStatus,
  BookingStatus,
  MaintenancePriority,
  MaintenanceStatus,
  NotificationType,
  ReturnStatus,
  TransferStatus,
} from "@/types/employee";
import { cn } from "@/lib/utils/employee";

function Chip({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", className)}>
      {children}
    </span>
  );
}

export function AssetStatusBadge({ status }: { status: AssetStatus }) {
  return <Chip className={ASSET_STATUS_BADGE[status]}>{ASSET_STATUS_LABEL[status]}</Chip>;
}
export function ConditionBadge({ condition }: { condition: AssetCondition }) {
  return <Chip className={ASSET_CONDITION_BADGE[condition]}>{ASSET_CONDITION_LABEL[condition]}</Chip>;
}
export function TransferBadge({ status }: { status: TransferStatus }) {
  return <Chip className={TRANSFER_BADGE[status]}>{TRANSFER_LABEL[status]}</Chip>;
}
export function ReturnBadge({ status }: { status: ReturnStatus }) {
  return <Chip className={RETURN_BADGE[status]}>{RETURN_LABEL[status]}</Chip>;
}
export function MaintenanceBadge({ status }: { status: MaintenanceStatus }) {
  return <Chip className={MAINTENANCE_BADGE[status]}>{MAINTENANCE_LABEL[status]}</Chip>;
}
export function PriorityBadge({ priority }: { priority: MaintenancePriority }) {
  return <Chip className={PRIORITY_BADGE[priority]}>{PRIORITY_LABEL[priority]}</Chip>;
}
export function BookingBadge({ status }: { status: BookingStatus }) {
  return <Chip className={BOOKING_BADGE[status]}>{BOOKING_LABEL[status]}</Chip>;
}
export function NotificationTypeBadge({ type }: { type: NotificationType }) {
  return <Chip className="bg-slate-100 text-slate-700">{NOTIFICATION_TYPE_LABEL[type]}</Chip>;
}

export const PRIORITY_OPTIONS = MAINTENANCE_PRIORITY;
