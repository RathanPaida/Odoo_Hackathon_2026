// lib/services/manager/returns.service.ts
// Business logic for Asset Manager return review.
import * as repo from "@/lib/repositories/manager/returns.repository";
import * as feed from "@/lib/repositories/manager/feed.repository";
import type { ReviewReturnInput, ManagerReturnQuery } from "@/validations/manager";
import type { ManagerReturnDto, Paginated } from "@/types/manager";
import { paginate } from "@/lib/utils/manager";

export class ReturnError extends Error {
  constructor(
    message: string,
    public code: "NOT_FOUND" | "ALREADY_REVIEWED" = "NOT_FOUND"
  ) {
    super(message);
  }
}

export async function listReturns(
  query: ManagerReturnQuery
): Promise<Paginated<ManagerReturnDto>> {
  const { skip, take, page, pageSize } = paginate(query.page, query.pageSize);
  return repo.listReturns({
    status: query.status,
    skip,
    take,
  });
}

export async function getReturn(id: string): Promise<ManagerReturnDto> {
  const r = await repo.getReturnById(id);
  if (!r) throw new ReturnError("Return not found", "NOT_FOUND");
  return r;
}

export async function reviewReturn(
  userId: string,
  id: string,
  input: ReviewReturnInput,
  ipAddress?: string | null
): Promise<ManagerReturnDto> {
  const existing = await repo.getReturnById(id);
  if (!existing) throw new ReturnError("Return not found", "NOT_FOUND");
  if (!existing.canReview) {
    throw new ReturnError(
      "Return has already been reviewed",
      "ALREADY_REVIEWED"
    );
  }

  const reviewed = await repo.reviewReturn(id, {
    status: input.status,
    reviewedById: userId,
    notes: input.notes,
  });
  if (!reviewed) throw new ReturnError("Return not found", "NOT_FOUND");

  await feed.logManagerAction({
    userId,
    action: `RETURN_${input.status}`,
    entityType: "ReturnRequest",
    entityId: id,
    details: {
      assetName: existing.assetName,
      requestedBy: existing.requestedByName,
      status: input.status,
    },
    ipAddress,
    notification: {
      targetUserId: existing.requestedById,
      type: "RETURN",
      title: `Return ${input.status.toLowerCase()}`,
      message: `Your return request for "${existing.assetName}" has been ${input.status.toLowerCase()}.`,
      link: "/dashboard/employee/returns",
    },
  });

  return reviewed;
}
