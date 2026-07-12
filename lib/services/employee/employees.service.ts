// lib/services/employee/employees.service.ts
import * as repo from "@/lib/repositories/employee/employees.repository";
import type { EmployeeQuery } from "@/validations/employee";
import type { EmployeeSummary, Paginated } from "@/types/employee";

export async function listEmployees(
  userId: string,
  query: EmployeeQuery
): Promise<Paginated<EmployeeSummary>> {
  return repo.listEmployees(
    { q: query.q, skip: (query.page - 1) * query.pageSize, take: query.pageSize },
    userId
  );
}
