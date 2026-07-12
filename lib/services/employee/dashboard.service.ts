// lib/services/employee/dashboard.service.ts
import { getDashboardStats } from "@/lib/repositories/employee/stats.repository";
import type { EmployeeDashboardStats } from "@/types/employee";

export async function getDashboardSummary(
  userId: string
): Promise<EmployeeDashboardStats> {
  return getDashboardStats(userId);
}
