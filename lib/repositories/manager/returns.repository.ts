// lib/repositories/manager/returns.repository.ts
// Prisma access for the Asset Manager to review return requests.
// NOTE: The ReturnRequest model is not yet in the Prisma schema.
// This module returns empty results until the model is added.
import type { ManagerReturnDto, Paginated, ReturnStatus } from "@/types/manager";

export async function listReturns(opts: {
  status?: string;
  skip: number;
  take: number;
}): Promise<Paginated<ManagerReturnDto>> {
  return {
    data: [],
    total: 0,
    page: Math.floor(opts.skip / opts.take) + 1,
    pageSize: opts.take,
    totalPages: 1,
  };
}

export async function getReturnById(
  _id: string
): Promise<ManagerReturnDto | null> {
  return null;
}

export async function reviewReturn(
  _id: string,
  _data: {
    status: "APPROVED" | "REJECTED";
    reviewedById: string;
    notes?: string | null;
  }
): Promise<ManagerReturnDto | null> {
  return null;
}
