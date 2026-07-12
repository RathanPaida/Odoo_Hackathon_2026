// lib/repositories/employee/bookings.repository.ts
// Prisma access for employee resource bookings.
import { prisma } from "@/lib/db";
import type { BookingStatus, Paginated, ResourceBookingDto } from "@/types/employee";
import { deriveBookingStatus } from "@/lib/utils/employee";

const include = {
  asset: { select: { name: true, assetTag: true } },
} as const;

function map(row: any): ResourceBookingDto {
  return {
    id: row.id,
    assetId: row.assetId,
    assetName: row.asset?.name ?? "Resource",
    assetTag: row.asset?.assetTag ?? "—",
    startTime: row.startTime.toISOString(),
    endTime: row.endTime.toISOString(),
    purpose: row.purpose,
    status: deriveBookingStatus(row.status, row.startTime, row.endTime),
    createdAt: row.createdAt.toISOString(),
  };
}

export async function bookingOverlaps(
  assetId: string,
  startTime: string | Date,
  endTime: string | Date,
  excludeId?: string
): Promise<boolean> {
  const conflicts = await prisma.resourceBooking.findFirst({
    where: {
      assetId,
      status: { in: ["UPCOMING", "COMPLETED"] },
      AND: [
        { startTime: { lt: new Date(endTime) } },
        { endTime: { gt: new Date(startTime) } },
      ],
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
  return Boolean(conflicts);
}

export async function createBooking(data: {
  assetId: string;
  userId: string;
  startTime: string | Date;
  endTime: string | Date;
  purpose: string | null;
}): Promise<ResourceBookingDto> {
  const row = await prisma.resourceBooking.create({
    data,
    include,
  });
  return map(row);
}

export async function listBookingsByUser(
  userId: string,
  opts: {
    status?: BookingStatus;
    q?: string;
    skip: number;
    take: number;
  }
): Promise<Paginated<ResourceBookingDto>> {
  const where: any = { userId };
  if (opts.q) {
    where.asset = {
      OR: [
        { name: { contains: opts.q } },
        { assetTag: { contains: opts.q } },
      ],
    };
  }
  // Stored statuses only (CURRENT is derived); treat CURRENT filter as UPCOMING/COMPLETED.
  if (opts.status === "CURRENT") {
    where.status = { in: ["UPCOMING", "COMPLETED"] };
  } else if (opts.status) {
    where.status = opts.status;
  }

  const [rows, total] = await Promise.all([
    prisma.resourceBooking.findMany({
      where,
      include,
      orderBy: { startTime: "asc" },
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

export async function getBookingById(
  id: string,
  userId: string
): Promise<ResourceBookingDto | null> {
  const row = await prisma.resourceBooking.findFirst({
    where: { id, userId },
    include,
  });
  return row ? map(row) : null;
}

export async function cancelBooking(
  id: string,
  userId: string
): Promise<ResourceBookingDto | null> {
  const existing = await prisma.resourceBooking.findFirst({
    where: { id, userId },
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

export async function rescheduleBooking(
  id: string,
  userId: string,
  data: { startTime: string | Date; endTime: string | Date; purpose: string | null }
): Promise<ResourceBookingDto | null> {
  const existing = await prisma.resourceBooking.findFirst({
    where: { id, userId },
  });
  if (!existing) return null;
  if (existing.status === "CANCELLED" || existing.status === "COMPLETED")
    return null;
  const row = await prisma.resourceBooking.update({
    where: { id },
    data: {
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      purpose: data.purpose,
    },
    include,
  });
  return map(row);
}

// Bookings for a given month, used by the calendar view.
export async function getBookingsForMonth(
  userId: string,
  start: Date,
  end: Date
): Promise<ResourceBookingDto[]> {
  const rows = await prisma.resourceBooking.findMany({
    where: {
      userId,
      status: { in: ["UPCOMING", "COMPLETED"] },
      startTime: { lt: end },
      endTime: { gt: start },
    },
    include,
    orderBy: { startTime: "asc" },
  });
  return rows.map(map);
}
