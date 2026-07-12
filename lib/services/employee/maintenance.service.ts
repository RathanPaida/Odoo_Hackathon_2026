// lib/services/employee/maintenance.service.ts
import * as repo from "@/lib/repositories/employee/maintenance.repository";
import * as assetRepo from "@/lib/repositories/employee/assets.repository";
import { logEmployeeAction } from "@/lib/repositories/employee/feed.repository";
import type { CreateMaintenanceInput } from "@/validations/employee";
import type { MaintenanceRequestDto, Paginated } from "@/types/employee";

export class MaintenanceError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export async function createMaintenance(
  userId: string,
  input: CreateMaintenanceInput,
  ipAddress?: string | null
): Promise<MaintenanceRequestDto> {
  const owns = await assetRepo.isAssetAllocatedToUser(userId, input.assetId);
  if (!owns) {
    throw new MaintenanceError("You can only raise maintenance for your allocated assets.");
  }
  const created = await repo.createMaintenance({
    assetId: input.assetId,
    requestedById: userId,
    issueDescription: input.issueDescription,
    priority: input.priority,
    photoUrl: input.photoUrl ?? null,
  });
  await logEmployeeAction({
    userId,
    action: "MAINTENANCE_REQUESTED",
    entityType: "MAINTENANCE",
    entityId: created.id,
    details: { assetId: created.assetId, priority: input.priority },
    ipAddress,
    notification: {
      type: "MAINTENANCE",
      title: "Maintenance request submitted",
      message: `Your maintenance request for ${created.assetName} is pending approval.`,
      link: "/dashboard/employee/maintenance",
    },
  });
  return created;
}

export async function listMaintenance(
  userId: string,
  page: number,
  pageSize: number
): Promise<Paginated<MaintenanceRequestDto>> {
  return repo.listMaintenanceByUser(userId, {
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
}

export async function getMaintenance(
  userId: string,
  id: string
): Promise<MaintenanceRequestDto | null> {
  return repo.getMaintenanceById(id, userId);
}
