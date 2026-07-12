// lib/repositories/manager/maintenance.repository.ts
// Prisma access for the Asset Manager to review and manage maintenance requests.
import { prisma } from "@/lib/db";
import type {
  ManagerMaintenanceDto,
  MaintenanceStatus,
  Paginated,
} from "@/types/manager";

function userName(u: any): string {
  if (!u) return "Unknown";
  return `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email;
}

const include = {
  asset: { select: { name: true, assetTag: true } },
  requestedBy: {
    select: { firstName: true, lastName: true, email: true },
  },
  technician: {
    select: { firstName: true, lastName: true, email: true },
  },
  approvedBy: {
    select: { firstName: true, lastName: true, email: true },
  },
} as const;

function map(row: any): ManagerMaintenanceDto {
  return {
    id: row.id,
    assetId: row.assetId,
    assetName: row.asset?.name ?? "Asset",
    assetTag: row.asset?.assetTag ?? "\u2014",
    requestedById: row.requestedById,
    requestedByName: userName(row.requestedBy),
    issueDescription: row.issueDescription,
    priority: row.priority,
    photoUrl: row.photoUrl,
    status: row.status as MaintenanceStatus,
    technicianId: row.technicianId,
    technicianName: row.technician ? userName(row.technician) : null,
    technicianNotes: row.technicianNotes,
    approvedById: row.approvedById,
    approvedByName: row.approvedBy ? userName(row.approvedBy) : null,
    approvedAt: row.approvedAt ? row.approvedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    resolvedAt: row.resolvedAt ? row.resolvedAt.toISOString() : null,
    canReview: ["PENDING", "IN_PROGRESS"].includes(row.status),
  };
}

export async function listMaintenance(opts: {
  status?: string;
  priority?: string;
  skip: number;
  take: number;
}): Promise<Paginated<ManagerMaintenanceDto>> {
  const where: any = {};
  if (opts.status) where.status = opts.status;
  if (opts.priority) where.priority = opts.priority;

  const [rows, total] = await Promise.all([
    prisma.maintenanceRequest.findMany({
      where,
      include,
      orderBy: { createdAt: "desc" },
      skip: opts.skip,
      take: opts.take,
    }),
    prisma.maintenanceRequest.count({ where }),
  ]);

  return {
    data: rows.map(map),
    total,
    page: Math.floor(opts.skip / opts.take) + 1,
    pageSize: opts.take,
    totalPages: Math.max(1, Math.ceil(total / opts.take)),
  };
}

export async function getMaintenanceById(
  id: string
): Promise<ManagerMaintenanceDto | null> {
  const row = await prisma.maintenanceRequest.findFirst({
    where: { id },
    include,
  });
  return row ? map(row) : null;
}

export async function reviewMaintenance(
  id: string,
  data: {
    status: "APPROVED" | "REJECTED" | "IN_PROGRESS" | "RESOLVED";
    reviewedById: string;
    technicianId?: string | null;
    technicianNotes?: string | null;
  }
): Promise<ManagerMaintenanceDto | null> {
  const existing = await prisma.maintenanceRequest.findFirst({
    where: { id },
  });
  if (!existing) return null;

  const updateData: any = {
    status: data.status,
    approvedById: data.reviewedById,
    approvedAt: new Date(),
  };
  if (data.technicianId) updateData.technicianId = data.technicianId;
  if (data.technicianNotes !== undefined)
    updateData.technicianNotes = data.technicianNotes;
  if (data.status === "RESOLVED") updateData.resolvedAt = new Date();

  const updated = await prisma.maintenanceRequest.update({
    where: { id },
    data: updateData,
    include,
  });

  if (data.status === "APPROVED" || data.status === "IN_PROGRESS") {
    await prisma.asset.update({
      where: { id: existing.assetId },
      data: { status: "IN_MAINTENANCE" },
    });
  } else if (data.status === "RESOLVED") {
    await prisma.asset.update({
      where: { id: existing.assetId },
      data: { status: "AVAILABLE" },
    });
    await prisma.assetHistory.create({
      data: {
        assetId: existing.assetId,
        action: "MAINTENANCE_RESOLVED",
        performedById: data.reviewedById,
        notes: data.technicianNotes ?? null,
      },
    });
  }

  return map(updated);
}
