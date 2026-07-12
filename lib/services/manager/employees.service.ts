// lib/services/manager/employees.service.ts
// Business logic for employee lookups.
import * as repo from "@/lib/repositories/manager/employees.repository";
import type { ManagerEmployeeQuery } from "@/validations/manager";
import type { EmployeeSummary, Paginated } from "@/types/manager";
import { paginate } from "@/lib/utils/manager";

export async function listEmployees(
  query: ManagerEmployeeQuery
): Promise<Paginated<EmployeeSummary>> {
  const { skip, take, page, pageSize } = paginate(query.page, query.pageSize);
  return repo.listEmployees({ q: query.q, skip, take });
}
