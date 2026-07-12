# DATABASE_CHANGES_REQUIRED.md

> AssetFlow ERP — Employee Module (Developer 4)
> This document lists the **database changes required** for the Employee Module.
> Per the merge rules, `prisma/schema.prisma` was **NOT** edited. The database
> owner must merge these models/migrations so the module compiles and runs.

---

## 1. ReturnRequest model (REQUIRED — blocks the Returns feature)

All other ERP models needed by the Employee Module already exist in
`prisma/schema.prisma` (Asset, AssetAllocation, TransferRequest,
ResourceBooking, MaintenanceRequest, Notification, ActivityLog, AssetHistory).
The only **missing** model is `ReturnRequest`, referenced by:

- `lib/repositories/employee/returns.repository.ts` → `prisma.returnRequest`
- `lib/services/employee/returns.service.ts`
- `app/api/employee/returns/**`
- `app/api/employee/returns/[id]/**`

### Proposed Prisma model

```prisma
model ReturnRequest {
  id              String   @id @default(cuid())
  assetId         String
  requestedById   String
  conditionNotes  String?
  imageUrls       String?  // JSON string of string[] (urls)
  status          String   @default("PENDING") // PENDING | APPROVED | REJECTED | CANCELLED
  reviewedById    String?
  reviewedAt      DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  asset       Asset @relation(fields: [assetId], references: [id], onDelete: Cascade)
  requestedBy User  @relation("ReturnRequestedBy", fields: [requestedById], references: [id])

  @@index([assetId])
  @@index([requestedById])
  @@index([status])
  @@map("return_requests")
}
```

Add the inverse relation to `User`:

```prisma
returnRequests ReturnRequest[] @relation("ReturnRequestedBy")
```

(And optionally to `Asset`: `returnRequests ReturnRequest[]`.)

---

## 2. Column / relation notes (optional, for parity)

- `MaintenanceRequest.photoUrl` already exists — used by the Employee maintenance
  form (`photoUrl` field). ✅ No change needed.
- `ResourceBooking` already supports the `UPCOMING|COMPLETED|CANCELLED` stored
  statuses; `CURRENT` is derived at read time in
  `lib/utils/employee.ts → deriveBookingStatus`. ✅ No DB change.
- `TransferRequest.status` default is `"REQUESTED"` in the shared schema. The
  Employee Module writes `"PENDING"` (per the API contract). **Decision needed
  by the DB owner / other modules:** align the enum/values. The Employee Module
  constants live in `lib/constants/employee.ts` (`TRANSFER_STATUS`). Recommended:
  keep `"PENDING"` as the canonical pending value and update the shared model's
  default to `"PENDING"` for consistency across modules.

---

## 3. Migration notes

- Create a new migration (e.g. `prisma/migrations/<ts>_employee_returns/`) that
  adds the `ReturnRequest` table and the `User.returnRequests` relation.
- No destructive changes to existing tables.
- After merging, run `npm run prisma:migrate` (or `prisma:deploy` in prod) and
  `npm run typecheck` — the `prisma.returnRequest` references will then resolve.

---

## 4. Seed / sample data (optional)

No seed changes required for the Employee Module. Managers/Admins (built by other
developers) are expected to allocate assets and create bookable resources; the
Employee Module only reads/creates records scoped to the logged-in employee.
