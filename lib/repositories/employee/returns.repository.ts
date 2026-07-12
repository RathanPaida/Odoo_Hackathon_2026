// lib/repositories/employee/returns.repository.ts
// Prisma access for employee return requests.
// NOTE: uses the `ReturnRequest` model which is contributed by the database
// owner (see DATABASE_CHANGES_REQUIRED.md). Until that model is merged, the
// `prisma.returnRequest` calls will not type-check against the local client.
import { prisma } from "@/lib/db";
import type { Paginated, ReturnRequestDto, ReturnStatus } from "@/types/employee";

const include = {
  asset: { select: { name: true, assetTag: true } },
} as const;

function parseImages(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((x) => typeof x === "string");
  if (typeof value === "string") {
    try {
      const arr = JSON.parse(value);
      return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
    } catch {
      return [];
    }
  }
  return [];
}

function map(row: any): ReturnRequestDto {
  return {
    id: row.id,
    assetId: row.assetId,
    assetName: row.asset?.name ?? "Asset",
    assetTag: row.asset?.assetTag ?? "—",
    conditionNotes: row.conditionNotes,
    imageUrls: parseImages(row.imageUrls),
    status: row.status as ReturnStatus,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    canCancel: row.status === "PENDING",
  };
}

export async function createReturn(data: {
  assetId: string;
  requestedById: string;
  conditionNotes: string | null;
  imageUrls: string[];
}): Promise<ReturnRequestDto> {
  const row = await prisma.returnRequest.create({
    data: {
      assetId: data.assetId,
      requestedById: data.requestedById,
      conditionNotes: data.conditionNotes,
      imageUrls: JSON.stringify(data.imageUrls),
      status: "PENDING",
    },
    include,
  });
  return map(row);
}

export async function listReturnsByUser(
  userId: string,
  opts: { skip: number; take: number }
): Promise<Paginated<ReturnRequestDto>> {
  const where = { requestedById: userId };
  const [rows, total] = await Promise.all([
    prisma.returnRequest.findMany({
      where,
      include,
      orderBy: { createdAt: "desc" },
      skip: opts.skip,
      take: opts.take,
    }),
    prisma.returnRequest.count({ where }),
  ]);
  return {
    data: rows.map(map),
    total,
    page: Math.floor(opts.skip / opts.take) + 1,
    pageSize: opts.take,
    totalPages: Math.max(1, Math.ceil(total / opts.take)),
  };
}

export async function getReturnById(
  id: string,
  userId: string
): Promise<ReturnRequestDto | null> {
  const row = await prisma.returnRequest.findFirst({
    where: { id, requestedById: userId },
    include,
  });
  return row ? map(row) : null;
}

export async function cancelReturn(
  id: string,
  userId: string
): Promise<ReturnRequestDto | null> {
  const existing = await prisma.returnRequest.findFirst({
    where: { id, requestedById: userId },
  });
  if (!existing || existing.status !== "PENDING") return null;
  const row = await prisma.returnRequest.update({
    where: { id },
    data: { status: "CANCELLED" },
    include,
  });
  return map(row);
}
