import { prisma as db } from "@/lib/db";

export async function getMaintenance(params?: { status?: string }) {
  const where = params?.status ? { status: params.status } : {};
  return await db.maintenanceRequest.findMany({
    where,
    include: {
      asset: { select: { name: true, assetTag: true } },
      requestedBy: { select: { firstName: true, lastName: true, email: true } },
      technician: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function reviewMaintenance(
  id: string,
  status: "IN_PROGRESS" | "COMPLETED" | "REJECTED",
  reviewerId: string,
  technicianNotes?: string
) {
  const req = await db.maintenanceRequest.findUnique({ where: { id } });
  if (!req) throw new Error("Maintenance request not found.");

  const updated = await db.maintenanceRequest.update({
    where: { id },
    data: {
      status,
      approvedById: reviewerId,
      approvedAt: status === "IN_PROGRESS" ? new Date() : req.approvedAt,
      resolvedAt: status === "COMPLETED" ? new Date() : undefined,
      technicianNotes,
    },
  });

  return updated;
}
