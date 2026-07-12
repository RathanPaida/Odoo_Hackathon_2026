// lib/repositories/employee/notifications.repository.ts
// Prisma access for employee notifications.
import { prisma } from "@/lib/db";
import type { NotificationDto, NotificationType, Paginated } from "@/types/employee";

function map(row: any): NotificationDto {
  return {
    id: row.id,
    type: row.type as NotificationType,
    title: row.title,
    message: row.message,
    link: row.link,
    read: row.read,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listNotifications(
  userId: string,
  opts: {
    type?: string;
    unreadOnly: boolean;
    skip: number;
    take: number;
  }
): Promise<Paginated<NotificationDto>> {
  const where: any = { userId };
  if (opts.type) where.type = opts.type;
  if (opts.unreadOnly) where.read = false;

  const [rows, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: opts.skip,
      take: opts.take,
    }),
    prisma.notification.count({ where }),
  ]);
  return {
    data: rows.map(map),
    total,
    page: Math.floor(opts.skip / opts.take) + 1,
    pageSize: opts.take,
    totalPages: Math.max(1, Math.ceil(total / opts.take)),
  };
}

export async function unreadCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, read: false } });
}

export async function markRead(
  id: string,
  userId: string
): Promise<NotificationDto | null> {
  const existing = await prisma.notification.findFirst({
    where: { id, userId },
  });
  if (!existing) return null;
  const row = await prisma.notification.update({
    where: { id },
    data: { read: true },
  });
  return map(row);
}

export async function markAllRead(userId: string): Promise<number> {
  const res = await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
  return res.count;
}

export async function createNotification(data: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
}): Promise<void> {
  await prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      link: data.link ?? null,
    },
  });
}
