# AssetFlow ERP — Project Structure & RBAC Implementation

> Auth module = the existing **oodoprep** authentication system, extended with
> Role-Based Access Control (RBAC) for AssetFlow ERP. No auth-core logic
> (JWT, sessions, refresh, password reset, email verification, register/login
> pages, base middleware) was rewritten — only extended.

---

## 1. Present Project Structure

```
oodoprep/
├── middleware.ts                 # Edge route guard + role authorization + dashboard redirect
├── ANALYSIS.md                   # prior auth-system analysis
├── README.md
├── next.config.js · tailwind.config.ts · tsconfig.json · postcss.config.js
├── .env · .env.example · .gitignore
│
├── app/
│   ├── layout.tsx · page.tsx · globals.css
│   ├── dashboard/
│   │   ├── page.tsx             # redirects (via middleware) to role dashboard
│   │   ├── admin/page.tsx       # ADMIN console
│   │   ├── manager/page.tsx     # ASSET_MANAGER
│   │   ├── head/page.tsx        # DEPARTMENT_HEAD
│   │   └── employee/page.tsx    # EMPLOYEE
│   ├── login/ · register/ · forgot-password/ · reset-password/ · verify-email/  # public auth pages
│   ├── profile/ · settings/     # protected user pages
│   ├── dev/mailbox/page.tsx     # dev mail viewer
│   ├── api/auth/                # register, login, logout, me, refresh,
│   │                           #   verify-email, resend-verification,
│   │                           #   forgot-password, reset-password
│   └── api/user/                # profile(PATCH), change-password,
│                               #   change-email, delete
│
├── actions/auth.ts              # server action (logout)
│
├── components/
│   ├── auth/   (auth-shell, login-form, register-form, forgot-form,
│   │            reset-form, verify-email, verify-email-shell, resend-verification-form)
│   ├── ui/     (spinner, toast)
│   └── user/   (app-shell, logout-button, profile-form, settings-forms,
│                role-dashboard)            # role-dashboard added for RBAC
│
├── hooks/use-api.ts             # client fetch helper
│
├── lib/
│   ├── db.ts · email.ts · rate-limit.ts · request.ts · utils.ts
│   ├── auth/
│   │   ├── jwt.ts               # HS256 JWT sign/verify (edge-safe)
│   │   ├── session.ts           # cookie + session lifecycle, refresh rotation
│   │   ├── password.ts          # bcrypt hashing
│   │   ├── guard.ts             # requireUser / requireRole / requirePermission
│   │   ├── roles.ts             # NEW: roles, labels, ROLE_DASHBOARD map
│   │   ├── permissions.ts       # NEW: RBAC permissions + role→permission map
│   │   └── navigation.ts        # NEW: role-filtered nav items
│   ├── email/templates.ts
│   └── services/
│       ├── auth-service.ts      # register/login/verify/reset logic
│       └── user-service.ts      # profile/email/password + assignRole/setDepartment
│
├── prisma/
│   ├── schema.prisma            # extended: 4-role enum, Department, User.departmentId/employeeId
│   ├── seed.ts                  # seeds ADMIN user
│   └── migrations/
│       ├── 0_init/              # base auth schema
│       └── 0002_rbac/           # NEW: RBAC schema delta
│
├── validations/ (auth.ts, user.ts)   # Zod schemas
├── types/index.ts                    # shared types (UserRole updated)
└── scripts/dev-mailserver.mjs
```

---

## 2. What Was Implemented (RBAC for AssetFlow ERP)

### 2.1 Database changes (`prisma/schema.prisma`)
- **`UserRole` enum** changed from `USER | ADMIN` →
  `ADMIN | ASSET_MANAGER | DEPARTMENT_HEAD | EMPLOYEE` (default `EMPLOYEE`).
- **New `Department` model** (`id, name, code @unique, description, timestamps`) with `users User[]`.
- **`User` extended** with `employeeId String?` and `departmentId String?`
  (FK → `Department`, `onDelete: SetNull`) + indexes on both.
- All existing auth models/tables kept intact.

### 2.2 New migration
- `prisma/migrations/0002_rbac/migration.sql` — renames the enum, adds columns,
  creates `departments`, and adds the FK. Apply with `npm run prisma:migrate`
  (or `prisma:deploy` in production).

### 2.3 Roles & permissions (`lib/auth/roles.ts`, `lib/auth/permissions.ts`)
- `ROLE_DASHBOARD`: ADMIN→`/dashboard/admin`, ASSET_MANAGER→`/dashboard/manager`,
  DEPARTMENT_HEAD→`/dashboard/head`, EMPLOYEE→`/dashboard/employee`.
- `SUPER_ROLES = ["ADMIN"]` (may access every dashboard area).
- `PERMISSIONS` constant (21 fine-grained permissions) and `ROLE_PERMISSIONS`
  map implementing the exact spec:
  - **ADMIN**: manage departments/employees, assign roles, manage categories,
    view reports, view dashboard, manage audit cycles (+ all lower).
  - **ASSET_MANAGER**: register/allocate assets, approve transfers/maintenance/returns, view dashboard.
  - **DEPARTMENT_HEAD**: view department assets, approve department transfers, book shared resources, view dashboard.
  - **EMPLOYEE**: view my assets, book resources, raise maintenance / initiate transfer / initiate return requests, view dashboard.
- Helpers: `hasPermission`, `hasAllPermissions`, `hasAnyPermission`, `getRolePermissions`, `isRole`, `dashboardForRole`, `roleLabel`.

### 2.4 Server guards (`lib/auth/guard.ts`)
- Extended (not rewritten) with `requireRole(...roles)` and `requirePermission(...perms)`
  built on the existing `getCurrentUser`. Both return `{ user, response }` so API
  routes/server actions can early-return a 401/403.

### 2.5 Middleware (`middleware.ts`)
- Preserved all existing auth behavior (edge JWT verify, silent access-token
  refresh, guest-only redirects).
- Added **role authorization**: `/dashboard/<role>` enforces the matching role
  (ADMIN superuser bypasses), redirecting unauthorized users to their own dashboard.
- Added **dashboard redirection**: `/dashboard` → the user's role dashboard.

### 2.6 Navigation filtering (`lib/auth/navigation.ts` + `components/user/app-shell.tsx`)
- `getRoleNav(role)` returns role-specific nav items (role module links + Profile + Settings).
- `AppShell` now filters nav by role, shows the role badge, and rebrands to **AssetFlow**.

### 2.7 User service (`lib/services/user-service.ts`)
- `toPublicUser` now exposes `departmentId` / `employeeId`.
- Added `assignRole(id, role)` (Admin "Assign Roles") and `setDepartment(id, departmentId, employeeId?)`.

### 2.8 Role dashboard pages
- `app/dashboard/{admin,manager,head,employee}/page.tsx` + shared
  `components/user/role-dashboard.tsx` rendering role label, blurb, and the
  granted-permission chips (demonstrates RBAC wiring).

### 2.9 Types (`types/index.ts`)
- `UserRole` updated to the 4 ERP roles; `PublicUser` extended with
  `departmentId` / `employeeId`.

---

## 3. What Was NOT Touched
JWT signing/verification, refresh-token rotation, session lifecycle, password
hashing, email verification, forgot/reset password, register/login pages,
`auth-service.ts` core flows, and the base authentication middleware.

---

## 4. How to protect new ERP endpoints
Wrap API routes / server actions with the existing guard helpers:
```ts
import { requireRole, requirePermission } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/lib/auth/permissions";

// role-gated
const g = await requireRole("ASSET_MANAGER");
if (g.response) return g.response;

// permission-gated
const p = await requirePermission(PERMISSIONS.REGISTER_ASSETS);
if (p.response) return p.response;
```

## 5. Required follow-up
```
npm run prisma:migrate      # generate+apply RBAC migration, regenerate client
# production:
npm run prisma:deploy
```
