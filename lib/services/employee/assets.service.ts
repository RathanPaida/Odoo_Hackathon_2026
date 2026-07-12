// lib/services/employee/assets.service.ts
import * as repo from "@/lib/repositories/employee/assets.repository";
import type { AssetQuery } from "@/validations/employee";
import type { AssetAllocationDto, AssetDetailsDto, Paginated } from "@/types/employee";

export async function listMyAssets(
  userId: string,
  query: AssetQuery
): Promise<Paginated<AssetAllocationDto>> {
  const { skip, take } = { skip: (query.page - 1) * query.pageSize, take: query.pageSize };
  return repo.getMyAllocations(userId, {
    q: query.q,
    status: query.status,
    condition: query.condition,
    sort: query.sort,
    order: query.order,
    skip,
    take,
  });
}

export async function getMyAssetDetails(
  userId: string,
  allocationId: string
): Promise<AssetDetailsDto | null> {
  return repo.getMyAllocationById(userId, allocationId);
}
