// lib/repositories/employee/maintenance.repository.ts
// Prisma access for employee maintenance requests.
import { prisma } from "@/lib/db";
import type {
  MaintenanceRequestDto,
  MaintenanceStatus,
  Paginated,
} from "@/types/employee";

const include = {
  asset: { select: { name: true, assetTag: true } },
} as const;

function map(row: any): MaintenanceRequestDto {
  return {
    id: row.id,
    assetId: row.assetId,
    assetName: row.asset?.name ?? "Asset",
    assetTag: row.asset?.assetTag ?? "—",
    issueDescription: row.issueDescription,
    priority: row.priority,
    photoUrl: row.photoUrl,
    status: row.status as MaintenanceStatus,
    technicianNotes: row.technicianNotes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    resolvedAt: row.resolvedAt ? row.resolvedAt.toISOString() : null,
  };
}

export async function createMaintenance(data: {
  assetId: string;
  requestedById: string;
  issueDescription: string;
  priority: string;
  photoUrl: string | null;
}): Promise<MaintenanceRequestDto> {
  const row = await prisma.maintenanceRequest.create({
    data: {
      assetId: data.assetId,
      requestedById: data.requestedById,
      issueDescription: data.issueDescription,
      priority: data.priority,
      photoUrl: data.photoUrl,
      status: "PENDING",
    },
    include,
  });
  return map(row);
}

export async function listMaintenanceByUser(
  userId: string,
  opts: { skip: number; take: number }
): Promise<Paginated<MaintenanceRequestDto>> {
  const where = { requestedById: userId };
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
  id: string,
  userId: string
): Promise<MaintenanceRequestDto | null> {
  const row = await prisma.maintenanceRequest.findFirst({
    where: { id, requestedById: userId },
    include,
  });
  return row ? map(row) : null;
}

export async function updateMaintenance(
  id: string,
  userId: string,
  data: { issueDescription?: string | null; photoUrl?: string | null }
): Promise<MaintenanceRequestDto | null> {
  const existing = await prisma.maintenanceRequest.findFirst({
    where: { id, requestedById: userId },
  });
  if (!existing) return null;
  const row = await prisma.maintenanceRequest.update({
    where: { id },
    data: {
      issueDescription: data.issueDescription ?? undefined,
      photoUrl: data.photoUrl,
    },
    include,
  });
  return map(row);
}
