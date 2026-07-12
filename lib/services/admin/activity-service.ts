// lib/services/admin/activity-service.ts
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

export async function listAllActivity(query: {
  type?: string;
  page: number;
  pageSize: number;
}): Promise<Paginated<ActivityItemDto>> {
  const where: any = {};
  if (query.type) where.entityType = query.type;
  const skip = (query.page - 1) * query.pageSize;
  const [rows, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: query.pageSize,
    }),
    prisma.activityLog.count({ where }),
  ]);
  return {
    data: rows.map((row) => ({
      id: row.id,
      action: row.action,
      entityType: row.entityType,
      entityId: row.entityId,
      details: parseDetails(row.details),
      createdAt: row.createdAt.toISOString(),
    })),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}
