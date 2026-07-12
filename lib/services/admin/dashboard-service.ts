import { prisma as db } from "@/lib/db";

export async function getAdminKPIs() {
  // Aggregate data for Admin dashboard
  const [
    totalAssets,
    assetsAvailable,
    assetsAllocated,
    maintenancePending,
    activeBookings,
    pendingTransfers,
    totalEmployees,
    totalDepartments
  ] = await Promise.all([
    db.asset.count(),
    db.asset.count({ where: { status: "AVAILABLE" } }),
    db.asset.count({ where: { status: "ALLOCATED" } }),
    db.maintenanceRequest.count({ where: { status: "PENDING" } }),
    db.resourceBooking.count({ where: { status: { in: ["UPCOMING", "ONGOING"] } } }),
    db.transferRequest.count({ where: { status: "REQUESTED" } }),
    db.user.count(),
    db.department.count()
  ]);

  return {
    totalAssets,
    assetsAvailable,
    assetsAllocated,
    maintenancePending,
    activeBookings,
    pendingTransfers,
    totalEmployees,
    totalDepartments
  };
}
