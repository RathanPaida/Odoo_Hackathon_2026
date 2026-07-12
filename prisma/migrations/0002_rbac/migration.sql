-- Migration: AssetFlow RBAC extension
-- Replaces the USER variant with the three new ERP roles, adds the
-- Department table, and extends User with departmentId / employeeId.

-- 1) Replace the UserRole enum (Postgres cannot drop enum values in place).
ALTER TYPE "UserRole" RENAME TO "UserRole_old";

CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD', 'EMPLOYEE');

ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole" USING ("role"::text::"UserRole");

DROP TYPE "UserRole_old";

-- 2) Extend the User model.
ALTER TABLE "users" ADD COLUMN "employeeId" TEXT;
ALTER TABLE "users" ADD COLUMN "departmentId" TEXT;

CREATE INDEX "users_departmentId_idx" ON "users"("departmentId");
CREATE INDEX "users_employeeId_idx" ON "users"("employeeId");

-- 3) Department table (ERP organizational units).
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- 4) FK from User.departmentId -> Department.
ALTER TABLE "users" ADD CONSTRAINT "users_departmentId_fkey"
    FOREIGN KEY ("departmentId") REFERENCES "departments"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
