// lib/repositories/manager/dashboard.repository.ts
// Aggregations backing the Asset Manager dashboard cards.
import { prisma } from "@/lib/db";
import type { ManagerDashboardStats } from "@/types/manager";

export async function getDashboardStats(): Promise<ManagerDashboardStats> {
  const [
    totalAssets,
    availableAssets,
    allocatedAssets,
    maintenanceInFlight,
    pendingTransfers,
    pendingReturns,
    activeBookings,
    categories,
  ] = await Promise.all([
    prisma.asset.count({ where: { deletedAt: null } }),
    prisma.asset.count({ where: { deletedAt: null, status: "AVAILABLE" } }),
    prisma.asset.count({ where: { deletedAt: null, status: "ALLOCATED" } }),
    prisma.maintenanceRequest.count({
      where: { status: { in: ["PENDING", "APPROVED", "IN_PROGRESS"] } },
    }),
    prisma.transferRequest.count({ where: { status: "PENDING" } }),
    0, // pendingReturns — returnRequest model not yet added to schema
    prisma.resourceBooking.count({
      where: { status: { in: ["UPCOMING", "COMPLETED"] } },
    }),
    prisma.assetCategory.count(),
  ]);

  return {
    totalAssets,
    availableAssets,
    allocatedAssets,
    maintenanceInFlight,
    pendingTransfers,
    pendingReturns,
    activeBookings,
    categories,
  };
}
