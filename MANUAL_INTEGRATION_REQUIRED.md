# MANUAL_INTEGRATION_REQUIRED.md

> AssetFlow ERP — Employee Module (Developer 4)
> Documents any touch-points that **must be wired manually** during the final
> 4-way merge, because shared files were intentionally left untouched.

---

## 1. Employee navigation in the shared AppShell

**File:** `components/user/app-shell.tsx` (SHARED — not edited)
**Reason:** The employee dashboard/sidebar nav must include the new employee
pages so users can navigate to them.
**Required changes:** Add the Employee Module routes to the navigation returned
by `getRoleNav("EMPLOYEE")` (in `lib/auth/navigation.ts`) or extend the
`NAV` array inside `AppShell` for the `EMPLOYEE` role. Suggested entries
(constants already exported from `lib/constants/employee.ts` as `EMPLOYEE_NAV`):

```
/dashboard/employee            Dashboard
/dashboard/employee/assets     My Assets
/dashboard/employee/transfers   Transfers
/dashboard/employee/returns     Returns
/dashboard/employee/maintenance Maintenance
/dashboard/employee/bookings    Bookings
/dashboard/employee/notifications Notifications
/dashboard/employee/activity    Activity
```

> The pages already render via the shared `AppShell`; only the nav links need to
> be exposed. The module is fully functional even if nav is added later — direct
> URLs work.

---

## 2. Middleware matcher for `/api/employee/*`

**File:** `middleware.ts` (SHARED — not edited)
**Reason:** Employee API routes use `requireUser()` (server-side guard) for
auth, so they are already protected. However, for defence-in-depth and parity
with `/api/user/*`, the `/api/employee/**` path should be inside the middleware
matcher so the Edge layer refreshes the access token before the route runs.
**Required changes:** Ensure `middleware.ts` config `matcher` includes
`/api/employee/:path*` (it already includes `/api/user/:path*` — mirror that).

---

## 3. Transfer / Return / Maintenance status vocabulary

**File:** `prisma/schema.prisma` + cross-module agreement (SHARED)
**Reason:** The shared `TransferRequest.status` default is `"REQUESTED"`, but the
Employee Module writes/reads `"PENDING"` per the API contract.
**Required changes:** Align the canonical pending value across modules. Either
update the shared model default to `"PENDING"`, or have the Employee Module map
`REQUESTED → PENDING` in `lib/constants/employee.ts`. See
`DATABASE_CHANGES_REQUIRED.md` §2.

---

## 4. Notifications from other modules

**Reason:** The Employee Module writes ActivityLog + Notification rows for the
employee's own actions (transfer/return/maintenance/booking submitted). The
*approval/rejection* notifications (e.g. "Your transfer was approved") are
expected to be written by the Asset Manager / Admin modules when they change
status. No code change is required in the Employee Module — this is a contract
note for the other developers so notification links stay consistent
(`/dashboard/employee/...`).

---

## 5. Employee Module API surface (for reference)

All endpoints are self-contained and require an authenticated session
(`requireUser()`); data is always scoped to the calling employee.

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET  | `/api/employee/dashboard` | Dashboard stats |
| GET  | `/api/employee/assets` | My allocated assets (search/filter/sort/paginate) |
| GET  | `/api/employee/assets/:id` | Asset detail + history + maintenance |
| GET  | `/api/employee/transfers` | List my transfers |
| POST | `/api/employee/transfers` | Create transfer (PENDING) |
| GET  | `/api/employee/transfers/:id` | Transfer detail |
| PATCH| `/api/employee/transfers/:id` | Cancel pending transfer |
| GET  | `/api/employee/returns` | List my returns |
| POST | `/api/employee/returns` | Create return (PENDING) |
| GET  | `/api/employee/returns/:id` | Return detail |
| PATCH| `/api/employee/returns/:id` | Cancel pending return |
| GET  | `/api/employee/maintenance` | List my maintenance requests |
| POST | `/api/employee/maintenance` | Create maintenance (PENDING) |
| GET  | `/api/employee/maintenance/:id` | Maintenance detail |
| GET  | `/api/employee/bookings` | List my bookings |
| POST | `/api/employee/bookings` | Create booking (overlap-checked) |
| GET  | `/api/employee/bookings/:id` | Booking detail |
| PATCH| `/api/employee/bookings/:id` | Cancel / reschedule |
| GET  | `/api/employee/notifications` | List notifications |
| POST | `/api/employee/notifications` | Mark all read |
| PATCH| `/api/employee/notifications/:id` | Mark one read |
| GET  | `/api/employee/activity` | Activity timeline |
| GET  | `/api/employee/employees` | Employee directory (transfer targets) |
| GET  | `/api/employee/resources` | Bookable shared resources |

---

## 6. Files created by this module (no conflicts expected)

```
app/dashboard/employee/**            # 10 pages (dashboard, assets, transfers, returns, maintenance, bookings, notifications, activity, assets/[id])
app/api/employee/**                  # 14 route groups (see table above)
components/employee/**               # client UIs + reusable ui/ + qr-code
lib/services/employee/**             # service layer
lib/repositories/employee/**         # repository layer
lib/constants/employee.ts
lib/utils/employee.ts
lib/utils/employee-qr.ts
validations/employee.ts
types/employee.ts
DATABASE_CHANGES_REQUIRED.md
MANUAL_INTEGRATION_REQUIRED.md
```

These live under employee-only paths and do **not** touch `middleware.ts`,
`app/layout.tsx`, `components/user/*`, `lib/auth/*`, `lib/db.ts`,
`types/index.ts`, `package.json`, `tailwind.config.ts`, `next.config.js`, or
existing services/APIs — keeping merge conflicts minimal.
