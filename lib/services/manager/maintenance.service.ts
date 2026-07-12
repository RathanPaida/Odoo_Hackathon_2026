// lib/services/manager/maintenance.service.ts
// Business logic for Asset Manager maintenance review.
import * as repo from "@/lib/repositories/manager/maintenance.repository";
import * as feed from "@/lib/repositories/manager/feed.repository";
import type {
  ReviewMaintenanceInput,
  ManagerMaintenanceQuery,
} from "@/validations/manager";
import type { ManagerMaintenanceDto, Paginated } from "@/types/manager";
import { paginate } from "@/lib/utils/manager";

export class MaintenanceError extends Error {
  constructor(
    message: string,
    public code: "NOT_FOUND" | "ALREADY_REVIEWED" = "NOT_FOUND"
  ) {
    super(message);
  }
}

export async function listMaintenance(
  query: ManagerMaintenanceQuery
): Promise<Paginated<ManagerMaintenanceDto>> {
  const { skip, take, page, pageSize } = paginate(query.page, query.pageSize);
  return repo.listMaintenance({
    status: query.status,
    priority: query.priority,
    skip,
    take,
  });
}

export async function getMaintenance(
  id: string
): Promise<ManagerMaintenanceDto> {
  const m = await repo.getMaintenanceById(id);
  if (!m) throw new MaintenanceError("Maintenance request not found", "NOT_FOUND");
  return m;
}

export async function reviewMaintenance(
  userId: string,
  id: string,
  input: ReviewMaintenanceInput,
  ipAddress?: string | null
): Promise<ManagerMaintenanceDto> {
  const existing = await repo.getMaintenanceById(id);
  if (!existing)
    throw new MaintenanceError("Maintenance request not found", "NOT_FOUND");
  if (!existing.canReview) {
    throw new MaintenanceError(
      "Maintenance request cannot be reviewed in its current state",
      "ALREADY_REVIEWED"
    );
  }

  const reviewed = await repo.reviewMaintenance(id, {
    status: input.status,
    reviewedById: userId,
    technicianId: input.technicianId,
    technicianNotes: input.technicianNotes,
  });
  if (!reviewed)
    throw new MaintenanceError("Maintenance request not found", "NOT_FOUND");

  await feed.logManagerAction({
    userId,
    action: `MAINTENANCE_${input.status}`,
    entityType: "MaintenanceRequest",
    entityId: id,
    details: {
      assetName: existing.assetName,
      priority: existing.priority,
      status: input.status,
    },
    ipAddress,
    notification: {
      targetUserId: existing.requestedById,
      type: "MAINTENANCE",
      title: `Maintenance ${input.status.toLowerCase()}`,
      message: `Maintenance request for "${existing.assetName}" has been ${input.status.toLowerCase()}.`,
      link: "/dashboard/employee/maintenance",
    },
  });

  return reviewed;
}
