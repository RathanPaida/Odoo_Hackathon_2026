// lib/repositories/manager/feed.repository.ts
// Atomic helper that writes an ActivityLog entry and optionally a Notification.
import { prisma } from "@/lib/db";

export async function logManagerAction(data: {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
  notification?: {
    targetUserId: string;
    type: string;
    title: string;
    message: string;
    link?: string | null;
  };
}): Promise<void> {
  await prisma.$transaction([
    prisma.activityLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        details: data.details ? JSON.stringify(data.details) : null,
        ipAddress: data.ipAddress ?? null,
      },
    }),
    ...(data.notification
      ? [
          prisma.notification.create({
            data: {
              userId: data.notification.targetUserId,
              type: data.notification.type,
              title: data.notification.title,
              message: data.notification.message,
              link: data.notification.link ?? null,
            },
          }),
        ]
      : []),
  ]);
}
