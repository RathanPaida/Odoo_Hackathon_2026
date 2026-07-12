# AssetFlow ERP — Admin Employee Directory (RBAC Extension)

> Part of the RBAC work on the **oodoprep** authentication module. The core
> authentication (JWT, sessions, refresh rotation, password reset, email
> verification, register/login pages, base middleware) was NOT rewritten — only
> extended. This document covers the Admin Employee Directory APIs added on top
> of the existing RBAC layer (`lib/auth/roles.ts`, `lib/auth/permissions.ts`,
> `lib/auth/guard.ts`).

-------------

## 1. Goal

Give the **ADMIN** role control over user roles and account statuses from the
Employee Directory, per the problem statement: *"Admin promotes an Employee to
Department Head or Asset Manager here — this is the only place roles are
assigned."*

--------------

## 2. Security Review Decision

> **Token revocation on role change — AGREED and implemented.**

When an Admin changes a user's `role`, all of that user's active
`RefreshToken` and `Session` rows are revoked. This forces the user to
re-authenticate, so their next JWT carries the updated role. The behavior is
identical to the existing password-reset revocation already in
`lib/services/auth-service.ts` (`resetPassword`).

------------

## 3. What Was Implemented

### 3.1 Zod validation — `validations/admin.ts` (NEW)
- `updateUserSchema`
  - `role`: enum `ADMIN | ASSET_MANAGER | DEPARTMENT_HEAD | EMPLOYEE` (optional)
  - `status`: enum `ACTIVE | INACTIVE | SUSPENDED` (optional)
  - `departmentId`: `string | null` (optional)
  - Refinement: at least one of `role`, `status`, `departmentId` must be present.
- Exported type `UpdateUserInput`.

### 3.2 Employee Directory API — `app/api/admin/users/route.ts` (NEW)
- **Method:** `GET`
- **Authz:** `requireRole("ADMIN")` (reuses existing `lib/auth/guard.ts`).
- **Functionality:** Lists all non-deleted users, ordered by `createdAt desc`.
- **Response shape (select):** `id, firstName, lastName, email, role, status,
  emailVerified, departmentId, department { id, name, code }, lastLoginAt, createdAt`.
- **Filters:**
  - `?q=` — case-insensitive match on email / first name / last name.
  - `?departmentId=` — exact department filter.
- **Returns:** `{ ok: true, data: User[] }`.

### 3.3 Role / Status Update API — `app/api/admin/users/[id]/route.ts` (NEW)
- **Method:** `PATCH`
- **Authz:** `requireRole("ADMIN")`.
- **Validation:** `updateUserSchema` (422 on failure with field errors).
- **Behavior:**
  - 404 if the target user does not exist / is soft-deleted.
  - Applies `role`, `status`, and/or `departmentId` as provided.
  - **If `role` changed:** revokes all active `RefreshToken` and `Session`
    rows for the user inside a `prisma.$transaction` (forces re-login).
- **Returns:** `{ ok: true, message: "User updated.", data: { id, role, status } }`.

--------------

## 4. Architecture Notes

- Both endpoints are **server-side enforced** via `requireRole("ADMIN")`, which
  returns a `{ user, response }` object so the route can early-return a 401/403.
- `/api/admin/*` is intentionally **outside** the `middleware.ts` matcher, so
  the route handler is the single authorization point — consistent with the
  existing `/api/user/*` handlers.
- No new DB migrations were required; the schema already had `role`, `status`,
  `departmentId`, `RefreshToken`, and `Session` (with `revokedAt`).
- All code typechecks (`npx tsc --noEmit` → exit 0).

-------------------

## 5. Manual Verification

1. `npm run db:seed` → admin `admin@oodoprep.com` / `Admin@123456`.
2. Log in as Admin (lands on `/dashboard/admin`).
3. `GET /api/admin/users` → returns the user list.
4. `PATCH /api/admin/users/<id>` with body `{ "role": "ASSET_MANAGER" }`.
5. DB check: the user's `role` is updated.
6. DB check: the user's `refresh_tokens.revokedAt` and `sessions.revokedAt`
   are set, so they must log in again to get a JWT with the new role.

------------------

## 6. Not Yet Built (out of scope of this change)

- An **Employee Directory UI page** that consumes these endpoints. The Admin
  dashboard nav already links to `#employees`, but no page renders the list or
  the role/status controls yet. Can be added on request.
