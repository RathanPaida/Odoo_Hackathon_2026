// lib/repositories/employee/assets.repository.ts
// Prisma access for an employee's allocated assets and asset history.
import { prisma } from "@/lib/db";
import type {
  AssetAllocationDto,
  AssetDetailsDto,
  AssetHistoryItemDto,
  BookableAsset,
  MaintenanceHistoryItemDto,
  Paginated,
} from "@/types/employee";

const assetInclude = {
  asset: {
    include: { category: { select: { name: true } } },
  },
} as const;

function mapAllocation(row: any): AssetAllocationDto {
  return {
    id: row.id,
    assetId: row.assetId,
    allocatedAt: row.allocatedAt.toISOString(),
    expectedReturnDate: row.expectedReturnDate
      ? row.expectedReturnDate.toISOString()
      : null,
    actualReturnDate: row.actualReturnDate
      ? row.actualReturnDate.toISOString()
      : null,
    conditionNotes: row.conditionNotes,
    isActive: row.isActive,
    asset: {
      id: row.asset.id,
      name: row.asset.name,
      assetTag: row.asset.assetTag,
      serialNumber: row.asset.serialNumber,
      condition: row.asset.condition,
      location: row.asset.location,
      photoUrl: row.asset.photoUrl,
      status: row.asset.status,
      categoryName: row.asset.category?.name ?? "Uncategorized",
      description: null,
      isBookable: row.asset.isBookable,
    },
  };
}

export async function countMyAllocations(
  userId: string,
  filters: { q?: string; status?: string; condition?: string }
): Promise<number> {
  return prisma.assetAllocation.count({
    where: {
      userId,
      isActive: true,
      asset: {
        deletedAt: null,
        ...(filters.q
          ? {
              OR: [
                { name: { contains: filters.q } },
                { assetTag: { contains: filters.q } },
                { serialNumber: { contains: filters.q } },
              ],
            }
          : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.condition ? { condition: filters.condition } : {}),
      },
    },
  });
}

export async function getMyAllocations(
  userId: string,
  opts: {
    q?: string;
    status?: string;
    condition?: string;
    sort: string;
    order: "asc" | "desc";
    skip: number;
    take: number;
  }
): Promise<Paginated<AssetAllocationDto>> {
  const where = {
    userId,
    isActive: true,
    asset: {
      deletedAt: null,
      ...(opts.q
        ? {
            OR: [
              { name: { contains: opts.q } },
              { assetTag: { contains: opts.q } },
              { serialNumber: { contains: opts.q } },
            ],
          }
        : {}),
      ...(opts.status ? { status: opts.status } : {}),
      ...(opts.condition ? { condition: opts.condition } : {}),
    },
  };

  const orderBy: any = {
    allocatedAt: "desc",
  };
  if (opts.sort === "name") orderBy.asset = { name: opts.order };
  else if (opts.sort === "expectedReturnDate")
    orderBy.expectedReturnDate = opts.order;
  else if (opts.sort === "condition") orderBy.asset = { condition: opts.order };
  else orderBy.allocatedAt = opts.order;

  const [rows, total] = await Promise.all([
    prisma.assetAllocation.findMany({
      where,
      include: assetInclude,
      orderBy,
      skip: opts.skip,
      take: opts.take,
    }),
    countMyAllocations(userId, {
      q: opts.q,
      status: opts.status,
      condition: opts.condition,
    }),
  ]);

  return {
    data: rows.map(mapAllocation),
    total,
    page: Math.floor(opts.skip / opts.take) + 1,
    pageSize: opts.take,
    totalPages: Math.max(1, Math.ceil(total / opts.take)),
  };
}

export async function getMyAllocationById(
  userId: string,
  allocationId: string
): Promise<AssetDetailsDto | null> {
  const row = await prisma.assetAllocation.findFirst({
    where: { id: allocationId, userId, isActive: true },
    include: {
      asset: {
        include: {
          category: { select: { name: true, description: true } },
          maintenanceRequests: {
            orderBy: { createdAt: "desc" },
            take: 50,
          },
          history: { orderBy: { createdAt: "desc" }, take: 50 },
        },
      },
    },
  });
  if (!row) return null;

  const maintenanceHistory: MaintenanceHistoryItemDto[] = (
    row.asset.maintenanceRequests ?? []
  ).map((m: any) => ({
    id: m.id,
    issueDescription: m.issueDescription,
    priority: m.priority,
    status: m.status,
    createdAt: m.createdAt.toISOString(),
    resolvedAt: m.resolvedAt ? m.resolvedAt.toISOString() : null,
  }));

  const history: AssetHistoryItemDto[] = (row.asset.history ?? []).map(
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

  return {
    ...mapAllocation(row),
    asset: {
      ...mapAllocation(row).asset,
      description: row.asset.category?.description ?? null,
    },
    maintenanceHistory,
    history,
  };
}

// True when the given asset exists, is not deleted, and is marked bookable.
export async function isAssetBookable(assetId: string): Promise<boolean> {
  const row = await prisma.asset.findFirst({
    where: { id: assetId, deletedAt: null, isBookable: true },
    select: { id: true },
  });
  return Boolean(row);
}

// True when the given asset is currently allocated to the given employee.
export async function isAssetAllocatedToUser(
  userId: string,
  assetId: string
): Promise<boolean> {
  const row = await prisma.assetAllocation.findFirst({
    where: { userId, assetId, isActive: true, asset: { deletedAt: null } },
    select: { id: true },
  });
  return Boolean(row);
}

// Bookable resources (shared resources) the employee can reserve. Not limited
// to the employee's own allocations.
export async function listBookableAssets(opts: {
  q?: string;
  skip: number;
  take: number;
}): Promise<Paginated<BookableAsset>> {
  const where: any = { isBookable: true, deletedAt: null };
  if (opts.q) {
    where.OR = [
      { name: { contains: opts.q } },
      { assetTag: { contains: opts.q } },
    ];
  }
  const [rows, total] = await Promise.all([
    prisma.asset.findMany({
      where,
      include: { category: { select: { name: true } } },
      orderBy: { name: "asc" },
      skip: opts.skip,
      take: opts.take,
    }),
    prisma.asset.count({ where }),
  ]);
  return {
    data: rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      assetTag: r.assetTag,
      categoryName: r.category?.name ?? "Uncategorized",
      location: r.location,
    })),
    total,
    page: Math.floor(opts.skip / opts.take) + 1,
    pageSize: opts.take,
    totalPages: Math.max(1, Math.ceil(total / opts.take)),
  };
}

export async function getAssetMaintenanceHistory(
  assetId: string
): Promise<MaintenanceHistoryItemDto[]> {
  const rows = await prisma.maintenanceRequest.findMany({
    where: { assetId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return rows.map((m: any) => ({
    id: m.id,
    issueDescription: m.issueDescription,
    priority: m.priority,
    status: m.status,
    createdAt: m.createdAt.toISOString(),
    resolvedAt: m.resolvedAt ? m.resolvedAt.toISOString() : null,
  }));
}
