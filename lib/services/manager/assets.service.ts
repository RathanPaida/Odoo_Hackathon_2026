// lib/services/manager/assets.service.ts
// Business logic for Asset Manager asset CRUD.
import * as repo from "@/lib/repositories/manager/assets.repository";
import * as feed from "@/lib/repositories/manager/feed.repository";
import type { CreateAssetInput, UpdateAssetInput, ManagerAssetQuery } from "@/validations/manager";
import type { ManagerAssetDto, ManagerAssetDetailsDto, Paginated } from "@/types/manager";
import { paginate } from "@/lib/utils/manager";

export class AssetError extends Error {
  constructor(
    message: string,
    public code: "NOT_FOUND" | "DUPLICATE_TAG" | "FORBIDDEN" = "NOT_FOUND"
  ) {
    super(message);
  }
}

export async function listAssets(
  query: ManagerAssetQuery
): Promise<Paginated<ManagerAssetDto>> {
  const { skip, take, page, pageSize } = paginate(query.page, query.pageSize);
  return repo.listAssets({
    q: query.q,
    status: query.status,
    condition: query.condition,
    categoryId: query.categoryId,
    departmentId: query.departmentId,
    sort: query.sort,
    order: query.order,
    skip,
    take,
  });
}

export async function getAssetDetails(
  id: string
): Promise<ManagerAssetDetailsDto> {
  const asset = await repo.getAssetById(id);
  if (!asset) throw new AssetError("Asset not found", "NOT_FOUND");
  return asset;
}

export async function createAsset(
  userId: string,
  input: CreateAssetInput,
  ipAddress?: string | null
): Promise<ManagerAssetDto> {
  const existing = await repo.countAssets({ q: input.assetTag });
  if (existing > 0) {
    const match = await repo.listAssets({
      q: input.assetTag,
      sort: "createdAt",
      order: "desc",
      skip: 0,
      take: 1,
    });
    if (match.data.some((a) => a.assetTag === input.assetTag)) {
      throw new AssetError(
        `Asset tag "${input.assetTag}" already exists`,
        "DUPLICATE_TAG"
      );
    }
  }

  const created = await repo.createAsset({
    name: input.name,
    assetTag: input.assetTag,
    serialNumber: input.serialNumber,
    acquisitionDate: input.acquisitionDate
      ? new Date(input.acquisitionDate)
      : null,
    acquisitionCost: input.acquisitionCost,
    condition: input.condition ?? "NEW",
    location: input.location,
    photoUrl: input.photoUrl,
    categoryId: input.categoryId,
    departmentId: input.departmentId,
    holderId: input.holderId,
    isBookable: input.isBookable,
  });

  await feed.logManagerAction({
    userId,
    action: "ASSET_CREATED",
    entityType: "Asset",
    entityId: created.id,
    details: { name: created.name, assetTag: created.assetTag },
    ipAddress,
  });

  return created;
}

export async function updateAsset(
  userId: string,
  id: string,
  input: UpdateAssetInput,
  ipAddress?: string | null
): Promise<ManagerAssetDto> {
  const existing = await repo.getAssetByIdSimple(id);
  if (!existing) throw new AssetError("Asset not found", "NOT_FOUND");

  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.serialNumber !== undefined) data.serialNumber = input.serialNumber;
  if (input.acquisitionDate !== undefined)
    data.acquisitionDate = input.acquisitionDate
      ? new Date(input.acquisitionDate)
      : null;
  if (input.acquisitionCost !== undefined)
    data.acquisitionCost = input.acquisitionCost;
  if (input.condition !== undefined) data.condition = input.condition;
  if (input.location !== undefined) data.location = input.location;
  if (input.photoUrl !== undefined) data.photoUrl = input.photoUrl;
  if (input.status !== undefined) data.status = input.status;
  if (input.categoryId !== undefined) data.categoryId = input.categoryId;
  if (input.departmentId !== undefined) data.departmentId = input.departmentId;
  if (input.holderId !== undefined) data.holderId = input.holderId;
  if (input.isBookable !== undefined) data.isBookable = input.isBookable;

  const updated = await repo.updateAsset(id, data);
  if (!updated) throw new AssetError("Asset not found", "NOT_FOUND");

  await feed.logManagerAction({
    userId,
    action: "ASSET_UPDATED",
    entityType: "Asset",
    entityId: id,
    details: { changes: Object.keys(data) },
    ipAddress,
  });

  return updated;
}

export async function deleteAsset(
  userId: string,
  id: string,
  ipAddress?: string | null
): Promise<void> {
  const existing = await repo.getAssetByIdSimple(id);
  if (!existing) throw new AssetError("Asset not found", "NOT_FOUND");

  const deleted = await repo.deleteAsset(id);
  if (!deleted) throw new AssetError("Asset not found", "NOT_FOUND");

  await feed.logManagerAction({
    userId,
    action: "ASSET_DELETED",
    entityType: "Asset",
    entityId: id,
    details: { name: existing.name, assetTag: existing.assetTag },
    ipAddress,
  });
}
