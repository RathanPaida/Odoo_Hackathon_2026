// lib/services/manager/bookings.service.ts
// Business logic for Asset Manager booking management.
import * as repo from "@/lib/repositories/manager/bookings.repository";
import * as feed from "@/lib/repositories/manager/feed.repository";
import type { ManagerBookingQuery } from "@/validations/manager";
import type { ManagerBookingDto, Paginated } from "@/types/manager";
import { paginate } from "@/lib/utils/manager";

export class BookingError extends Error {
  constructor(
    message: string,
    public code: "NOT_FOUND" | "CANNOT_CANCEL" = "NOT_FOUND"
  ) {
    super(message);
  }
}

export async function listBookings(
  query: ManagerBookingQuery
): Promise<Paginated<ManagerBookingDto>> {
  const { skip, take, page, pageSize } = paginate(query.page, query.pageSize);
  return repo.listAllBookings({
    q: query.q,
    status: query.status,
    skip,
    take,
  });
}

export async function cancelBooking(
  userId: string,
  id: string,
  ipAddress?: string | null
): Promise<ManagerBookingDto> {
  const existing = await repo.cancelBooking(id);
  if (!existing) {
    throw new BookingError(
      "Booking not found or cannot be cancelled",
      "NOT_FOUND"
    );
  }

  await feed.logManagerAction({
    userId,
    action: "BOOKING_CANCELLED",
    entityType: "ResourceBooking",
    entityId: id,
    details: {
      assetName: existing.assetName,
      bookedBy: existing.userName,
    },
    ipAddress,
    notification: {
      targetUserId: existing.userId,
      type: "BOOKING",
      title: "Booking cancelled",
      message: `Your booking for "${existing.assetName}" has been cancelled by a manager.`,
      link: "/dashboard/employee/bookings",
    },
  });

  return existing;
}
