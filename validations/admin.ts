// validations/admin.ts
// Zod schemas for Admin Employee Directory actions.
import { z } from "zod";

export const updateUserSchema = z
  .object({
    role: z
      .enum(["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD", "EMPLOYEE"])
      .optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
    departmentId: z.string().nullable().optional(),
  })
  .refine(
    (d) =>
      d.role !== undefined ||
      d.status !== undefined ||
      d.departmentId !== undefined,
    { message: "Provide at least one of role, status, or departmentId." }
  );

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
