// lib/services/manager/transfers.service.ts
// Business logic for Asset Manager transfer review.
import * as repo from "@/lib/repositories/manager/transfers.repository";
import * as feed from "@/lib/repositories/manager/feed.repository";
import type { ReviewTransferInput, ManagerTransferQuery } from "@/validations/manager";
import type { ManagerTransferDto, Paginated } from "@/types/manager";
import { paginate } from "@/lib/utils/manager";

export class TransferError extends Error {
  constructor(
    message: string,
    public code: "NOT_FOUND" | "ALREADY_REVIEWED" = "NOT_FOUND"
  ) {
    super(message);
  }
}

export async function listTransfers(
  query: ManagerTransferQuery
): Promise<Paginated<ManagerTransferDto>> {
  const { skip, take, page, pageSize } = paginate(query.page, query.pageSize);
  return repo.listTransfers({
    status: query.status,
    skip,
    take,
  });
}

export async function getTransfer(id: string): Promise<ManagerTransferDto> {
  const t = await repo.getTransferById(id);
  if (!t) throw new TransferError("Transfer not found", "NOT_FOUND");
  return t;
}

export async function reviewTransfer(
  userId: string,
  id: string,
  input: ReviewTransferInput,
  ipAddress?: string | null
): Promise<ManagerTransferDto> {
  const existing = await repo.getTransferById(id);
  if (!existing) throw new TransferError("Transfer not found", "NOT_FOUND");
  if (!existing.canReview) {
    throw new TransferError(
      "Transfer has already been reviewed",
      "ALREADY_REVIEWED"
    );
  }

  const reviewed = await repo.reviewTransfer(id, {
    status: input.status,
    reviewedById: userId,
    notes: input.notes,
  });
  if (!reviewed) throw new TransferError("Transfer not found", "NOT_FOUND");

  await feed.logManagerAction({
    userId,
    action: `TRANSFER_${input.status}`,
    entityType: "TransferRequest",
    entityId: id,
    details: {
      assetName: existing.assetName,
      from: existing.fromUserName,
      to: existing.toUserName,
      status: input.status,
    },
    ipAddress,
    notification: {
      targetUserId: existing.requestedById,
      type: "TRANSFER",
      title: `Transfer ${input.status.toLowerCase()}`,
      message: `Your transfer of "${existing.assetName}" to ${existing.toUserName} has been ${input.status.toLowerCase()}.`,
      link: "/dashboard/employee/transfers",
    },
  });

  return reviewed;
}
