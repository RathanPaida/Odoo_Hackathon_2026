// lib/services/employee/notifications.service.ts
import * as repo from "@/lib/repositories/employee/notifications.repository";
import type { NotificationQuery } from "@/validations/employee";
import type { NotificationDto, Paginated } from "@/types/employee";

export async function listNotifications(
  userId: string,
  query: NotificationQuery
): Promise<Paginated<NotificationDto>> {
  return repo.listNotifications(userId, {
    type: query.type,
    unreadOnly: query.unreadOnly,
    skip: (query.page - 1) * query.pageSize,
    take: query.pageSize,
  });
}

export async function getUnreadCount(userId: string): Promise<number> {
  return repo.unreadCount(userId);
}

export async function markRead(
  userId: string,
  id: string
): Promise<NotificationDto | null> {
  return repo.markRead(id, userId);
}

export async function markAllRead(userId: string): Promise<number> {
  return repo.markAllRead(userId);
}
