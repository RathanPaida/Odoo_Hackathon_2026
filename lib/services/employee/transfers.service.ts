// lib/services/employee/transfers.service.ts
import * as repo from "@/lib/repositories/employee/transfers.repository";
import * as assetRepo from "@/lib/repositories/employee/assets.repository";
import { logEmployeeAction } from "@/lib/repositories/employee/feed.repository";
import type { CreateTransferInput } from "@/validations/employee";
import type { Paginated, TransferRequestDto } from "@/types/employee";

export class TransferError extends Error {
  constructor(message: string, public code: "FORBIDDEN" | "NOT_FOUND" = "FORBIDDEN") {
    super(message);
  }
}

export async function createTransfer(
  userId: string,
  input: CreateTransferInput,
  ipAddress?: string | null
): Promise<TransferRequestDto> {
  const owns = await assetRepo.isAssetAllocatedToUser(userId, input.assetId);
  if (!owns) {
    throw new TransferError("You can only transfer assets allocated to you.");
  }
  const created = await repo.createTransfer({
    assetId: input.assetId,
    fromUserId: userId,
    toUserId: input.targetEmployeeId,
    reason: input.reason,
  });
  await logEmployeeAction({
    userId,
    action: "TRANSFER_REQUESTED",
    entityType: "TRANSFER",
    entityId: created.id,
    details: { assetId: created.assetId, toUserId: input.targetEmployeeId },
    ipAddress,
    notification: {
      type: "TRANSFER",
      title: "Transfer request submitted",
      message: `Your request to transfer ${created.assetName} is pending approval.`,
      link: "/dashboard/employee/transfers",
    },
  });
  return created;
}

export async function listTransfers(
  userId: string,
  page: number,
  pageSize: number
): Promise<Paginated<TransferRequestDto>> {
  return repo.listTransfersByUser(userId, {
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
}

export async function getTransfer(
  userId: string,
  id: string
): Promise<TransferRequestDto | null> {
  return repo.getTransferById(id, userId);
}

export async function cancelTransfer(
  userId: string,
  id: string,
  ipAddress?: string | null
): Promise<TransferRequestDto> {
  const updated = await repo.cancelTransfer(id, userId);
  if (!updated) {
    throw new TransferError(
      "Transfer request not found or can no longer be cancelled.",
      "NOT_FOUND"
    );
  }
  await logEmployeeAction({
    userId,
    action: "TRANSFER_CANCELLED",
    entityType: "TRANSFER",
    entityId: id,
    ipAddress,
  });
  return updated;
}
