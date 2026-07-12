// lib/services/employee/returns.service.ts
import * as repo from "@/lib/repositories/employee/returns.repository";
import * as assetRepo from "@/lib/repositories/employee/assets.repository";
import { logEmployeeAction } from "@/lib/repositories/employee/feed.repository";
import type { CreateReturnInput } from "@/validations/employee";
import type { Paginated, ReturnRequestDto } from "@/types/employee";

export class ReturnError extends Error {
  constructor(message: string, public code: "FORBIDDEN" | "NOT_FOUND" = "FORBIDDEN") {
    super(message);
  }
}

export async function createReturn(
  userId: string,
  input: CreateReturnInput,
  ipAddress?: string | null
): Promise<ReturnRequestDto> {
  const owns = await assetRepo.isAssetAllocatedToUser(userId, input.assetId);
  if (!owns) {
    throw new ReturnError("You can only return assets allocated to you.");
  }
  const created = await repo.createReturn({
    assetId: input.assetId,
    requestedById: userId,
    conditionNotes: input.conditionNotes ?? null,
    imageUrls: input.imageUrls,
  });
  await logEmployeeAction({
    userId,
    action: "RETURN_REQUESTED",
    entityType: "RETURN",
    entityId: created.id,
    details: { assetId: created.assetId },
    ipAddress,
    notification: {
      type: "RETURN",
      title: "Return request submitted",
      message: `Your return request for ${created.assetName} is pending approval.`,
      link: "/dashboard/employee/returns",
    },
  });
  return created;
}

export async function listReturns(
  userId: string,
  page: number,
  pageSize: number
): Promise<Paginated<ReturnRequestDto>> {
  return repo.listReturnsByUser(userId, {
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
}

export async function getReturn(
  userId: string,
  id: string
): Promise<ReturnRequestDto | null> {
  return repo.getReturnById(id, userId);
}

export async function cancelReturn(
  userId: string,
  id: string,
  ipAddress?: string | null
): Promise<ReturnRequestDto> {
  const updated = await repo.cancelReturn(id, userId);
  if (!updated) {
    throw new ReturnError(
      "Return request not found or can no longer be cancelled.",
      "NOT_FOUND"
    );
  }
  await logEmployeeAction({
    userId,
    action: "RETURN_CANCELLED",
    entityType: "RETURN",
    entityId: id,
    ipAddress,
  });
  return updated;
}
