// lib/services/employee/bookings.service.ts
import * as repo from "@/lib/repositories/employee/bookings.repository";
import * as assetRepo from "@/lib/repositories/employee/assets.repository";
import { logEmployeeAction } from "@/lib/repositories/employee/feed.repository";
import type {
  BookableAsset,
  BookingStatus,
  Paginated,
  ResourceBookingDto,
} from "@/types/employee";
import type { CreateBookingInput, RescheduleBookingInput } from "@/validations/employee";

export class BookingError extends Error {
  constructor(message: string, public code: "CONFLICT" | "FORBIDDEN" = "FORBIDDEN") {
    super(message);
  }
}

export async function createBooking(
  userId: string,
  input: CreateBookingInput,
  ipAddress?: string | null
): Promise<ResourceBookingDto> {
  const bookable = await assetRepo.isAssetBookable(input.assetId);
  if (!bookable) {
    throw new BookingError("This resource is not available for booking.");
  }
  const overlap = await repo.bookingOverlaps(
    input.assetId,
    input.startTime,
    input.endTime
  );
  if (overlap) {
    throw new BookingError(
      "This resource is already booked for the selected time range.",
      "CONFLICT"
    );
  }
  const created = await repo.createBooking({
    assetId: input.assetId,
    userId,
    startTime: input.startTime,
    endTime: input.endTime,
    purpose: input.purpose ?? null,
  });
  await logEmployeeAction({
    userId,
    action: "BOOKING_CREATED",
    entityType: "BOOKING",
    entityId: created.id,
    details: { assetId: created.assetId, startTime: created.startTime, endTime: created.endTime },
    ipAddress,
    notification: {
      type: "BOOKING",
      title: "Booking confirmed",
      message: `Your booking for ${created.assetName} is scheduled.`,
      link: "/dashboard/employee/bookings",
    },
  });
  return created;
}

export async function listBookings(
  userId: string,
  opts: { status?: BookingStatus; q?: string; page: number; pageSize: number }
): Promise<Paginated<ResourceBookingDto>> {
  return repo.listBookingsByUser(userId, {
    status: opts.status,
    q: opts.q,
    skip: (opts.page - 1) * opts.pageSize,
    take: opts.pageSize,
  });
}

export async function getBooking(
  userId: string,
  id: string
): Promise<ResourceBookingDto | null> {
  return repo.getBookingById(id, userId);
}

export async function cancelBooking(
  userId: string,
  id: string,
  ipAddress?: string | null
): Promise<ResourceBookingDto> {
  const updated = await repo.cancelBooking(id, userId);
  if (!updated) {
    throw new BookingError("Booking not found or can no longer be cancelled.", "FORBIDDEN");
  }
  await logEmployeeAction({
    userId,
    action: "BOOKING_CANCELLED",
    entityType: "BOOKING",
    entityId: id,
    ipAddress,
  });
  return updated;
}

export async function rescheduleBooking(
  userId: string,
  id: string,
  input: RescheduleBookingInput,
  ipAddress?: string | null
): Promise<ResourceBookingDto> {
  const existing = await repo.getBookingById(id, userId);
  if (!existing) {
    throw new BookingError("Booking not found.", "FORBIDDEN");
  }
  if (existing.status === "CANCELLED" || existing.status === "COMPLETED") {
    throw new BookingError("This booking can no longer be rescheduled.", "FORBIDDEN");
  }
  const overlap = await repo.bookingOverlaps(
    existing.assetId,
    input.startTime,
    input.endTime,
    id
  );
  if (overlap) {
    throw new BookingError(
      "This resource is already booked for the selected time range.",
      "CONFLICT"
    );
  }
  const updated = await repo.rescheduleBooking(id, userId, {
    startTime: input.startTime,
    endTime: input.endTime,
    purpose: input.purpose ?? null,
  });
  if (!updated) throw new BookingError("Booking not found.", "FORBIDDEN");
  await logEmployeeAction({
    userId,
    action: "BOOKING_RESCHEDULED",
    entityType: "BOOKING",
    entityId: id,
    ipAddress,
  });
  return updated;
}

export async function getBookingsForMonth(
  userId: string,
  start: Date,
  end: Date
): Promise<ResourceBookingDto[]> {
  return repo.getBookingsForMonth(userId, start, end);
}

export async function listBookableResources(
  q?: string,
  page = 1,
  pageSize = 50
): Promise<Paginated<BookableAsset>> {
  return assetRepo.listBookableAssets({
    q,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
}
