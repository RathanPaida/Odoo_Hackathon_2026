// lib/repositories/employee/stats.repository.ts
// Aggregations backing the employee dashboard cards.
import { prisma } from "@/lib/db";
import type { EmployeeDashboardStats } from "@/types/employee";
import { deriveBookingStatus } from "@/lib/utils/employee";

export async function getDashboardStats(
  userId: string
): Promise<EmployeeDashboardStats> {
  const now = new Date();

  const [activeAssets, upcomingReturns, pendingMaintenance, unread] =
    await Promise.all([
      prisma.assetAllocation.count({
        where: { userId, isActive: true, asset: { deletedAt: null } },
      }),
      prisma.assetAllocation.count({
        where: {
          userId,
          isActive: true,
          expectedReturnDate: { gt: now },
          asset: { deletedAt: null },
        },
      }),
      prisma.maintenanceRequest.count({
        where: { requestedById: userId, status: "PENDING" },
      }),
      prisma.notification.count({ where: { userId, read: false } }),
    ]);

  const bookings = await prisma.resourceBooking.findMany({
    where: { userId, status: { in: ["UPCOMING", "COMPLETED"] } },
    select: { status: true, startTime: true, endTime: true },
  });
  const activeBookings = bookings.filter(
    (b) => deriveBookingStatus(b.status, b.startTime, b.endTime) !== "COMPLETED"
  ).length;

  return {
    activeAssets,
    upcomingReturns,
    activeBookings,
    pendingMaintenance,
    unreadNotifications: unread,
  };
}
