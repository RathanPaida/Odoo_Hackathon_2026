// types/index.ts
// Shared TypeScript types used across the app.

export type UserRole =
  | "ADMIN"
  | "ASSET_MANAGER"
  | "DEPARTMENT_HEAD"
  | "EMPLOYEE";
export type AccountStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

// Public user shape (never includes passwordHash).
export interface PublicUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  status: AccountStatus;
  emailVerified: boolean;
  avatarUrl: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  departmentId: string | null;
  employeeId: string | null;
}

// Standard API response envelope.
export interface ApiResponse<T = unknown> {
  ok: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[] | string> | string[];
}

export interface SessionUser {
  id: string;
  email: string;
  role: UserRole;
}
