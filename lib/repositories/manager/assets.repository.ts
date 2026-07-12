// lib/repositories/manager/assets.repository.ts
// Prisma access for the Asset Manager's full asset CRUD.
import { prisma } from "@/lib/db";
import type {
  ManagerAssetDto,
  ManagerAssetDetailsDto,
  AssetAllocationInfo,
  AssetHistoryItemDto,
  MaintenanceHistoryItemDto,
  Paginated,
} from "@/types/manager";

function mapAsset(row: any): ManagerAssetDto {
  return {
    id: row.id,
    name: row.name,
    assetTag: row.assetTag,
    serialNumber: row.serialNumber,
    acquisitionDate: row.acquisitionDate
      ? row.acquisitionDate.toISOString()
      : null,
    acquisitionCost: row.acquisitionCost,
    condition: row.condition,
    location: row.location,
    photoUrl: row.photoUrl,
    status: row.status,
    categoryId: row.categoryId,
    categoryName: row.category?.name ?? "Uncategorized",
    departmentId: row.departmentId,
    departmentName: row.department?.name ?? null,
    holderId: row.holderId,
    holderName: row.holder
      ? `${row.holder.firstName ?? ""} ${row.holder.lastName ?? ""}`.trim() ||
        row.holder.email
      : null,
    isBookable: row.isBookable,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

const assetInclude = {
  category: { select: { name: true } },
  department: { select: { name: true } },
  holder: {
    select: { firstName: true, lastName: true, email: true },
  },
} as const;

export async function countAssets(filters: {
  q?: string;
  status?: string;
  condition?: string;
  categoryId?: string;
  departmentId?: string;
}): Promise<number> {
  const where: any = { deletedAt: null };
  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q } },
      { assetTag: { contains: filters.q } },
      { serialNumber: { contains: filters.q } },
    ];
  }
  if (filters.status) where.status = filters.status;
  if (filters.condition) where.condition = filters.condition;
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.departmentId) where.departmentId = filters.departmentId;
  return prisma.asset.count({ where });
}

export async function listAssets(opts: {
  q?: string;
  status?: string;
  condition?: string;
  categoryId?: string;
  departmentId?: string;
  sort: string;
  order: "asc" | "desc";
  skip: number;
  take: number;
}): Promise<Paginated<ManagerAssetDto>> {
  const where: any = { deletedAt: null };
  if (opts.q) {
    where.OR = [
      { name: { contains: opts.q } },
      { assetTag: { contains: opts.q } },
      { serialNumber: { contains: opts.q } },
    ];
  }
  if (opts.status) where.status = opts.status;
  if (opts.condition) where.condition = opts.condition;
  if (opts.categoryId) where.categoryId = opts.categoryId;
  if (opts.departmentId) where.departmentId = opts.departmentId;

  const orderBy: any = {};
  if (opts.sort === "name") orderBy.name = opts.order;
  else if (opts.sort === "assetTag") orderBy.assetTag = opts.order;
  else if (opts.sort === "status") orderBy.status = opts.order;
  else if (opts.sort === "condition") orderBy.condition = opts.order;
  else orderBy.createdAt = opts.order;

  const [rows, total] = await Promise.all([
    prisma.asset.findMany({
      where,
      include: assetInclude,
      orderBy,
      skip: opts.skip,
      take: opts.take,
    }),
    countAssets({
      q: opts.q,
      status: opts.status,
      condition: opts.condition,
      categoryId: opts.categoryId,
      departmentId: opts.departmentId,
    }),
  ]);

  return {
    data: rows.map(mapAsset),
    total,
    page: Math.floor(opts.skip / opts.take) + 1,
    pageSize: opts.take,
    totalPages: Math.max(1, Math.ceil(total / opts.take)),
  };
}

export async function getAssetById(
  id: string
): Promise<ManagerAssetDetailsDto | null> {
  const row = await prisma.asset.findFirst({
    where: { id, deletedAt: null },
    include: {
      ...assetInclude,
      allocations: {
        where: { isActive: true },
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { allocatedAt: "desc" },
      },
      maintenanceRequests: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      history: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
  if (!row) return null;

  const allocations: AssetAllocationInfo[] = (row.allocations ?? []).map(
    (a: any) => ({
      id: a.id,
      userId: a.userId,
      userName: a.user
        ? `${a.user.firstName ?? ""} ${a.user.lastName ?? ""}`.trim() ||
          a.user.email
        : "Unknown",
      allocatedAt: a.allocatedAt.toISOString(),
      expectedReturnDate: a.expectedReturnDate
        ? a.expectedReturnDate.toISOString()
        : null,
      isActive: a.isActive,
    })
  );

  const maintenanceHistory: MaintenanceHistoryItemDto[] = (
    row.maintenanceRequests ?? []
  ).map((m: any) => ({
    id: m.id,
    issueDescription: m.issueDescription,
    priority: m.priority,
    status: m.status,
    createdAt: m.createdAt.toISOString(),
    resolvedAt: m.resolvedAt ? m.resolvedAt.toISOString() : null,
  }));

  const history: AssetHistoryItemDto[] = (row.history ?? []).map(
    (h: any) => ({
      id: h.id,
      action: h.action,
      fromUserName: h.fromUser
        ? `${h.fromUser.firstName ?? ""} ${h.fromUser.lastName ?? ""}`.trim() ||
          h.fromUser.email
        : null,
      toUserName: h.toUser
        ? `${h.toUser.firstName ?? ""} ${h.toUser.lastName ?? ""}`.trim() ||
          h.toUser.email
        : null,
      notes: h.notes,
      condition: h.condition,
      createdAt: h.createdAt.toISOString(),
    })
  );

  const base = mapAsset(row);
  return { ...base, allocations, maintenanceHistory, history };
}

export async function createAsset(data: {
  name: string;
  assetTag: string;
  serialNumber?: string | null;
  acquisitionDate?: Date | null;
  acquisitionCost?: number | null;
  condition: string;
  location?: string | null;
  photoUrl?: string | null;
  categoryId: string;
  departmentId?: string | null;
  holderId?: string | null;
  isBookable: boolean;
}): Promise<ManagerAssetDto> {
  const row = await prisma.asset.create({
    data: {
      name: data.name,
      assetTag: data.assetTag,
      serialNumber: data.serialNumber ?? null,
      acquisitionDate: data.acquisitionDate ?? null,
      acquisitionCost: data.acquisitionCost ?? null,
      condition: data.condition,
      location: data.location ?? null,
      photoUrl: data.photoUrl ?? null,
      categoryId: data.categoryId,
      departmentId: data.departmentId ?? null,
      holderId: data.holderId ?? null,
      isBookable: data.isBookable,
      status: data.holderId ? "ALLOCATED" : "AVAILABLE",
    },
    include: assetInclude,
  });
  return mapAsset(row);
}

export async function updateAsset(
  id: string,
  data: Record<string, unknown>
): Promise<ManagerAssetDto | null> {
  const existing = await prisma.asset.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) return null;
  const row = await prisma.asset.update({
    where: { id },
    data,
    include: assetInclude,
  });
  return mapAsset(row);
}

export async function deleteAsset(
  id: string
): Promise<boolean> {
  const existing = await prisma.asset.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) return false;
  await prisma.asset.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  return true;
}

export async function getAssetByIdSimple(id: string): Promise<ManagerAssetDto | null> {
  const row = await prisma.asset.findFirst({
    where: { id, deletedAt: null },
    include: assetInclude,
  });
  return row ? mapAsset(row) : null;
}
