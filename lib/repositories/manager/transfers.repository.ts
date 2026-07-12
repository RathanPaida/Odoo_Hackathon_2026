// lib/repositories/manager/transfers.repository.ts
// Prisma access for the Asset Manager to review transfer requests.
import { prisma } from "@/lib/db";
import type { ManagerTransferDto, Paginated, TransferStatus } from "@/types/manager";

const include = {
  asset: { select: { name: true, assetTag: true } },
  requestedBy: {
    select: { firstName: true, lastName: true, email: true },
  },
  fromUser: {
    select: { firstName: true, lastName: true, email: true },
  },
  toUser: {
    select: { firstName: true, lastName: true, email: true },
  },
  reviewedBy: {
    select: { firstName: true, lastName: true, email: true },
  },
} as const;

function userName(u: any): string {
  if (!u) return "Unknown";
  return `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email;
}

function map(row: any): ManagerTransferDto {
  return {
    id: row.id,
    assetId: row.assetId,
    assetName: row.asset?.name ?? "Asset",
    assetTag: row.asset?.assetTag ?? "\u2014",
    requestedById: row.requestedById,
    requestedByName: userName(row.requestedBy),
    fromUserId: row.fromUserId,
    fromUserName: userName(row.fromUser),
    toUserId: row.toUserId,
    toUserName: userName(row.toUser),
    reason: row.reason,
    status: row.status as TransferStatus,
    reviewedById: row.reviewedById,
    reviewedByName: row.reviewedBy ? userName(row.reviewedBy) : null,
    reviewedAt: row.reviewedAt ? row.reviewedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    canReview: row.status === "PENDING",
  };
}

export async function listTransfers(opts: {
  status?: string;
  skip: number;
  take: number;
}): Promise<Paginated<ManagerTransferDto>> {
  const where: any = {};
  if (opts.status) where.status = opts.status;

  const [rows, total] = await Promise.all([
    prisma.transferRequest.findMany({
      where,
      include,
      orderBy: { createdAt: "desc" },
      skip: opts.skip,
      take: opts.take,
    }),
    prisma.transferRequest.count({ where }),
  ]);

  return {
    data: rows.map(map),
    total,
    page: Math.floor(opts.skip / opts.take) + 1,
    pageSize: opts.take,
    totalPages: Math.max(1, Math.ceil(total / opts.take)),
  };
}

export async function getTransferById(
  id: string
): Promise<ManagerTransferDto | null> {
  const row = await prisma.transferRequest.findFirst({
    where: { id },
    include,
  });
  return row ? map(row) : null;
}

export async function reviewTransfer(
  id: string,
  data: {
    status: "APPROVED" | "REJECTED";
    reviewedById: string;
    notes?: string | null;
  }
): Promise<ManagerTransferDto | null> {
  const existing = await prisma.transferRequest.findFirst({
    where: { id, status: "PENDING" },
  });
  if (!existing) return null;

  const updated = await prisma.$transaction(async (tx) => {
    const tr = await tx.transferRequest.update({
      where: { id },
      data: {
        status: data.status,
        reviewedById: data.reviewedById,
        reviewedAt: new Date(),
      },
      include,
    });

    if (data.status === "APPROVED") {
      await tx.assetAllocation.updateMany({
        where: { assetId: existing.assetId, isActive: true },
        data: { isActive: false, actualReturnDate: new Date() },
      });
      await tx.asset.update({
        where: { id: existing.assetId },
        data: { holderId: existing.toUserId, status: "ALLOCATED" },
      });
      await tx.assetAllocation.create({
        data: {
          assetId: existing.assetId,
          userId: existing.toUserId,
          allocatedById: data.reviewedById,
          isActive: true,
        },
      });
      await tx.assetHistory.create({
        data: {
          assetId: existing.assetId,
          action: "TRANSFER_APPROVED",
          performedById: data.reviewedById,
          fromUserId: existing.fromUserId,
          toUserId: existing.toUserId,
          notes: data.notes ?? null,
        },
      });
    }

    return tr;
  });

  return map(updated);
}
