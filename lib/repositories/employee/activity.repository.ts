// lib/repositories/employee/activity.repository.ts
// Prisma access for the employee activity timeline.
import { prisma } from "@/lib/db";
import type { ActivityItemDto, Paginated } from "@/types/employee";

function parseDetails(value: unknown): Record<string, unknown> | null {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return value as Record<string, unknown>;
}

function map(row: any): ActivityItemDto {
  return {
    id: row.id,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    details: parseDetails(row.details),
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listActivity(
  userId: string,
  opts: { type?: string; skip: number; take: number }
): Promise<Paginated<ActivityItemDto>> {
  const where: any = { userId };
  if (opts.type) where.entityType = opts.type;
  const [rows, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: opts.skip,
      take: opts.take,
    }),
    prisma.activityLog.count({ where }),
  ]);
  return {
    data: rows.map(map),
    total,
    page: Math.floor(opts.skip / opts.take) + 1,
    pageSize: opts.take,
    totalPages: Math.max(1, Math.ceil(total / opts.take)),
  };
}

export async function createActivity(data: {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
}): Promise<void> {
  await prisma.activityLog.create({
    data: {
      userId: data.userId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      details: data.details ? JSON.stringify(data.details) : null,
      ipAddress: data.ipAddress ?? null,
    },
  });
}
