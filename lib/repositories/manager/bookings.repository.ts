// lib/repositories/manager/bookings.repository.ts
// Prisma access for the Asset Manager to view/manage all resource bookings.
import { prisma } from "@/lib/db";
import type { ManagerBookingDto, Paginated } from "@/types/manager";
import { deriveBookingStatus } from "@/lib/utils/manager";

const include = {
  asset: { select: { name: true, assetTag: true } },
  user: { select: { firstName: true, lastName: true, email: true } },
} as const;

function userName(u: any): string {
  if (!u) return "Unknown";
  return `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email;
}

function map(row: any): ManagerBookingDto {
  return {
    id: row.id,
    assetId: row.assetId,
    assetName: row.asset?.name ?? "Resource",
    assetTag: row.asset?.assetTag ?? "\u2014",
    userId: row.userId,
    userName: userName(row.user),
    startTime: row.startTime.toISOString(),
    endTime: row.endTime.toISOString(),
    purpose: row.purpose,
    status: deriveBookingStatus(row.status, row.startTime, row.endTime),
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listAllBookings(opts: {
  q?: string;
  status?: string;
  skip: number;
  take: number;
}): Promise<Paginated<ManagerBookingDto>> {
  const where: any = {};
  if (opts.q) {
    where.OR = [
      { asset: { name: { contains: opts.q } } },
      { asset: { assetTag: { contains: opts.q } } },
      { user: { firstName: { contains: opts.q } } },
      { user: { lastName: { contains: opts.q } } },
    ];
  }
  if (opts.status === "CURRENT") {
    where.status = { in: ["UPCOMING", "COMPLETED"] };
  } else if (opts.status) {
    where.status = opts.status;
  }

  const [rows, total] = await Promise.all([
    prisma.resourceBooking.findMany({
      where,
      include,
      orderBy: { startTime: "desc" },
      skip: opts.skip,
      take: opts.take,
    }),
    prisma.resourceBooking.count({ where }),
  ]);

  let data = rows.map(map);
  if (opts.status) {
    data = data.filter((b) => b.status === opts.status);
  }

  return {
    data,
    total,
    page: Math.floor(opts.skip / opts.take) + 1,
    pageSize: opts.take,
    totalPages: Math.max(1, Math.ceil(total / opts.take)),
  };
}

export async function cancelBooking(
  id: string
): Promise<ManagerBookingDto | null> {
  const existing = await prisma.resourceBooking.findFirst({
    where: { id },
  });
  if (!existing) return null;
  if (existing.status === "CANCELLED" || existing.status === "COMPLETED")
    return null;
  const row = await prisma.resourceBooking.update({
    where: { id },
    data: { status: "CANCELLED" },
    include,
  });
  return map(row);
}
