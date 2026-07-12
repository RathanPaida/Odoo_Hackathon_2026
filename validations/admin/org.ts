import * as z from "zod";

export const departmentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be under 100 characters"),
  code: z.string().min(2, "Code must be at least 2 characters").max(20, "Code must be under 20 characters").toUpperCase(),
  description: z.string().optional().nullable(),
  headId: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be under 100 characters"),
  description: z.string().optional().nullable(),
  customFields: z.string().optional().nullable(), // Stored as JSON string in SQLite
});

export const employeeRoleSchema = z.object({
  role: z.enum(["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD", "EMPLOYEE"]),
});

export const employeeDepartmentSchema = z.object({
  departmentId: z.string().nullable(),
});
