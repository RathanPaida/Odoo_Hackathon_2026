// validations/manager.ts
// Zod validation schemas for the Asset Manager Module APIs.
import { z } from "zod";

// ----- Asset search/filter query -----
export const managerAssetQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  status: z.string().trim().max(40).optional(),
  condition: z.string().trim().max(40).optional(),
  categoryId: z.string().trim().optional(),
  departmentId: z.string().trim().optional(),
  sort: z
    .enum(["name", "assetTag", "createdAt", "status", "condition"])
    .default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(12),
});
export type ManagerAssetQuery = z.infer<typeof managerAssetQuerySchema>;

// ----- Create Asset -----
export const createAssetSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  assetTag: z.string().trim().min(1, "Asset tag is required").max(100),
  serialNumber: z.string().trim().max(200).optional().nullable(),
  acquisitionDate: z
    .string()
    .datetime({ message: "Valid date required" })
    .optional()
    .nullable(),
  acquisitionCost: z.number().min(0).optional().nullable(),
  condition: z
    .enum(["NEW", "GOOD", "FAIR", "POOR", "DAMAGED"])
    .default("NEW"),
  location: z.string().trim().max(200).optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
  categoryId: z.string().min(1, "Category is required"),
  departmentId: z.string().optional().nullable(),
  holderId: z.string().optional().nullable(),
  isBookable: z.boolean().default(false),
});
export type CreateAssetInput = z.infer<typeof createAssetSchema>;

// ----- Update Asset -----
export const updateAssetSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  serialNumber: z.string().trim().max(200).optional().nullable(),
  acquisitionDate: z
    .string()
    .datetime()
    .optional()
    .nullable(),
  acquisitionCost: z.number().min(0).optional().nullable(),
  condition: z.enum(["NEW", "GOOD", "FAIR", "POOR", "DAMAGED"]).optional(),
  location: z.string().trim().max(200).optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
  status: z
    .enum([
      "AVAILABLE",
      "ALLOCATED",
      "IN_MAINTENANCE",
      "RETURNED",
      "LOST",
      "DISPOSED",
    ])
    .optional(),
  categoryId: z.string().min(1).optional(),
  departmentId: z.string().optional().nullable(),
  holderId: z.string().optional().nullable(),
  isBookable: z.boolean().optional(),
});
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;

// ----- Category -----
export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  description: z.string().trim().max(500).optional().nullable(),
  customFields: z.string().max(5000).optional().nullable(),
});
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(500).optional().nullable(),
  customFields: z.string().max(5000).optional().nullable(),
});
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

// ----- Transfer review -----
export const reviewTransferSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  notes: z.string().trim().max(500).optional().nullable(),
});
export type ReviewTransferInput = z.infer<typeof reviewTransferSchema>;

// ----- Return review -----
export const reviewReturnSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  notes: z.string().trim().max(500).optional().nullable(),
});
export type ReviewReturnInput = z.infer<typeof reviewReturnSchema>;

// ----- Maintenance review -----
export const reviewMaintenanceSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "IN_PROGRESS", "RESOLVED"]),
  technicianId: z.string().optional().nullable(),
  technicianNotes: z.string().trim().max(1000).optional().nullable(),
});
export type ReviewMaintenanceInput = z.infer<typeof reviewMaintenanceSchema>;

// ----- Booking query (manager sees all) -----
export const managerBookingQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  status: z.string().trim().max(40).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ManagerBookingQuery = z.infer<typeof managerBookingQuerySchema>;

// ----- Transfer query -----
export const managerTransferQuerySchema = z.object({
  status: z.string().trim().max(40).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ManagerTransferQuery = z.infer<typeof managerTransferQuerySchema>;

// ----- Return query -----
export const managerReturnQuerySchema = z.object({
  status: z.string().trim().max(40).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ManagerReturnQuery = z.infer<typeof managerReturnQuerySchema>;

// ----- Maintenance query -----
export const managerMaintenanceQuerySchema = z.object({
  status: z.string().trim().max(40).optional(),
  priority: z.string().trim().max(40).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ManagerMaintenanceQuery = z.infer<
  typeof managerMaintenanceQuerySchema
>;

// ----- Employee query (for dropdowns) -----
export const managerEmployeeQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});
export type ManagerEmployeeQuery = z.infer<typeof managerEmployeeQuerySchema>;
