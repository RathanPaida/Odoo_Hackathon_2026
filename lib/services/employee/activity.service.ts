// lib/services/employee/activity.service.ts
import * as repo from "@/lib/repositories/employee/activity.repository";
import type { ActivityQuery } from "@/validations/employee";
import type { ActivityItemDto, Paginated } from "@/types/employee";

export async function listActivity(
  userId: string,
  query: ActivityQuery
): Promise<Paginated<ActivityItemDto>> {
  return repo.listActivity(userId, {
    type: query.type,
    skip: (query.page - 1) * query.pageSize,
    take: query.pageSize,
  });
}
