// lib/services/manager/dashboard.service.ts
// Business logic for the Asset Manager dashboard.
import * as repo from "@/lib/repositories/manager/dashboard.repository";
import type { ManagerDashboardStats } from "@/types/manager";

export async function getDashboardSummary(): Promise<ManagerDashboardStats> {
  return repo.getDashboardStats();
}
