// validations/employee.ts
// Zod validation schemas for the Employee Module APIs.
import { z } from "zod";

// Reusable asset id (cuid-like, but accept any non-empty string).
const assetId = z.string().min(1, "Asset is required");

// ----- Asset search/filter query -----
export const assetQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  status: z.string().trim().max(40).optional(),
  condition: z.string().trim().max(40).optional(),
  sort: z.enum(["name", "allocatedAt", "expectedReturnDate", "condition"]).default("allocatedAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(12),
});
export type AssetQuery = z.infer<typeof assetQuerySchema>;

// ----- Transfer -----
export const createTransferSchema = z.object({
  assetId: assetId,
  targetEmployeeId: z.string().min(1, "Target employee is required"),
  reason: z.string().trim().min(3, "Reason must be at least 3 characters").max(500),
});
export type CreateTransferInput = z.infer<typeof createTransferSchema>;

// ----- Return -----
export const createReturnSchema = z.object({
  assetId: assetId,
  conditionNotes: z.string().trim().max(1000).optional().nullable(),
  imageUrls: z.array(z.string().url()).max(5).default([]),
});
export type CreateReturnInput = z.infer<typeof createReturnSchema>;

// ----- Maintenance -----
export const createMaintenanceSchema = z.object({
  assetId: assetId,
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  issueDescription: z
    .string()
    .trim()
    .min(5, "Please describe the issue (min 5 characters)")
    .max(1000),
  description: z.string().trim().max(2000).optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
});
export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;

// Employee may refine their reported issue / add a photo to their own request.
export const updateMaintenanceSchema = z.object({
  issueDescription: z.string().trim().max(1000).optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
});
export type UpdateMaintenanceInput = z.infer<typeof updateMaintenanceSchema>;

// ----- Booking -----
export const createBookingSchema = z
  .object({
    assetId: assetId,
    startTime: z.string().datetime({ message: "Valid start time required" }),
    endTime: z.string().datetime({ message: "Valid end time required" }),
    purpose: z.string().trim().max(500).optional().nullable(),
  })
  .refine((v) => new Date(v.endTime) > new Date(v.startTime), {
    message: "End time must be after start time",
    path: ["endTime"],
  });
export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const rescheduleBookingSchema = z
  .object({
    startTime: z.string().datetime({ message: "Valid start time required" }),
    endTime: z.string().datetime({ message: "Valid end time required" }),
    purpose: z.string().trim().max(500).optional().nullable(),
  })
  .refine((v) => new Date(v.endTime) > new Date(v.startTime), {
    message: "End time must be after start time",
    path: ["endTime"],
  });
export type RescheduleBookingInput = z.infer<typeof rescheduleBookingSchema>;

// ----- Notifications -----
export const notificationQuerySchema = z.object({
  type: z.string().trim().max(40).optional(),
  unreadOnly: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type NotificationQuery = z.infer<typeof notificationQuerySchema>;

// ----- Activity -----
export const activityQuerySchema = z.object({
  type: z.string().trim().max(40).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});
export type ActivityQuery = z.infer<typeof activityQuerySchema>;

// ----- Employees (transfer target search) -----
export const employeeQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});
export type EmployeeQuery = z.infer<typeof employeeQuerySchema>;
