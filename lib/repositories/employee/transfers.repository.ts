// lib/repositories/employee/transfers.repository.ts
// Prisma access for employee transfer requests.
import { prisma } from "@/lib/db";
import type { Paginated, TransferRequestDto, TransferStatus } from "@/types/employee";

const include = {
  asset: { select: { name: true, assetTag: true } },
  toUser: { select: { firstName: true, lastName: true, email: true } },
} as const;

function map(row: any): TransferRequestDto {
  return {
    id: row.id,
    assetId: row.assetId,
    assetName: row.asset?.name ?? "Asset",
    assetTag: row.asset?.assetTag ?? "—",
    fromUserId: row.fromUserId,
    toUserId: row.toUserId,
    toUserName: row.toUser
      ? `${row.toUser.firstName ?? ""} ${row.toUser.lastName ?? ""}`.trim() ||
        row.toUser.email
      : "Unknown",
    reason: row.reason,
    status: row.status as TransferStatus,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    canCancel: row.status === "PENDING",
  };
}

export async function createTransfer(data: {
  assetId: string;
  fromUserId: string;
  toUserId: string;
  reason: string;
}): Promise<TransferRequestDto> {
  const row = await prisma.transferRequest.create({
    data: {
      assetId: data.assetId,
      requestedById: data.fromUserId,
      fromUserId: data.fromUserId,
      toUserId: data.toUserId,
      reason: data.reason,
      status: "PENDING",
    },
    include,
  });
  return map(row);
}

export async function listTransfersByUser(
  userId: string,
  opts: { skip: number; take: number }
): Promise<Paginated<TransferRequestDto>> {
  const where = { requestedById: userId };
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
  id: string,
  userId: string
): Promise<TransferRequestDto | null> {
  const row = await prisma.transferRequest.findFirst({
    where: { id, requestedById: userId },
    include,
  });
  return row ? map(row) : null;
}

export async function cancelTransfer(
  id: string,
  userId: string
): Promise<TransferRequestDto | null> {
  const existing = await prisma.transferRequest.findFirst({
    where: { id, requestedById: userId },
  });
  if (!existing || existing.status !== "PENDING") return null;
  const row = await prisma.transferRequest.update({
    where: { id },
    data: { status: "CANCELLED" },
    include,
  });
  return map(row);
}
