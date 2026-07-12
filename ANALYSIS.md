# oodoprep — Analysis

## What `oodoprep` is

A **production-ready authentication system** built from scratch. The `odoo` folder is just the
parent workspace; the actual application lives in `oodoprep` (a portmanteau of "Odoo prep").
It is a full-stack **Next.js 15 (App Router) + TypeScript + Prisma + PostgreSQL** application
that implements secure user authentication end-to-end.

## What was built

### Auth flows (all implemented end-to-end)
- **Register** → email verification (verification **link** or **6-digit OTP**)
- **Login** with bcrypt-hashed passwords + "remember me"
- **Logout** (DB refresh-token revocation)
- **Forgot / reset password** (single-use, expiring tokens; logs out all devices)
- **Change password**, **change email** (re-verify), **delete account**
- **Refresh-token rotation + family tracking** with reuse/invalidation detection
  (`lib/auth/session.ts:98`)
- **Session management** with device/IP tracking

### Security measures
- `jose` JWTs stored in **HTTP-only, Secure, SameSite=Lax** cookies (`lib/auth/jwt.ts`)
- Edge **middleware** route protection + silent access-token refresh (`middleware.ts`)
- In-memory **rate limiting** on sensitive endpoints (`lib/rate-limit.ts`)
- **Zod** validation on every input (`validations/`)
- Generic auth errors (no user enumeration); email verification required before login
- Refresh tokens stored **hashed** (`sha256`) in the DB, never in raw form

### Architecture
Clean separation of concerns:
**API routes → `lib/services/*` (DB logic) → `lib/auth/*` + `prisma`**.
In development, the mail layer falls back to logging verification links/codes to the console.
Includes a seed script that creates a default admin user.

## File structure (source only, excludes node_modules / .next / .mailbox)

```
oodoprep/
├── middleware.ts                 # Edge route guard + silent token refresh
├── app/
│   ├── layout.tsx, page.tsx, globals.css
│   ├── api/auth/                 # register, login, logout, me, refresh,
│   │                             #   verify-email, resend-verification,
│   │                             #   forgot-password, reset-password
│   ├── api/user/                 # profile (PATCH), change-password,
│   │                             #   change-email, delete
│   ├── login | register | forgot-password | reset-password | verify-email/  # public pages
│   └── dashboard | profile | settings/  # protected pages
├── actions/auth.ts               # server actions (logout)
├── components/
│   ├── auth/   (forms + shells)
│   ├── ui/     (toast, spinner)
│   └── user/   (app shell, profile/settings forms, logout button)
├── hooks/use-api.ts              # fetch helper
├── lib/
│   ├── auth/      (jwt, session, password, guard)
│   ├── services/  (auth-service, user-service)
│   ├── email.ts + email/templates.ts
│   ├── db.ts        (Prisma singleton)
│   ├── rate-limit.ts
│   ├── request.ts
│   └── utils.ts
├── prisma/
│   ├── schema.prisma             # data models
│   ├── seed.ts                   # default admin user
│   └── migrations/0_init/
├── validations/ (auth, user)     # Zod schemas
├── types/index.ts                # shared TS types
├── scripts/dev-mailserver.mjs
└── package.json · next.config.js · tailwind.config.ts · tsconfig.json · .env.example
```

## Data models (`prisma/schema.prisma`)
- `User`, `EmailVerification`, `PasswordReset`, `Session`, `RefreshToken`
- All relations use `onDelete: Cascade`
- `deletedAt` column reserved for soft-delete (currently hard-deletes)
- Unique constraints: `User.email`, `EmailVerification.token`, `PasswordReset.token`,
  `RefreshToken.tokenHash`
- Indexes on `status`, `emailVerified`, `userId` FKs, `expiresAt`

## Tech stack
Next.js 15 · TypeScript · Prisma 5 · PostgreSQL · jose (JWT) · bcryptjs · Zod ·
React Hook Form · Tailwind CSS · Nodemailer/Resend.

## Production note
The in-memory rate limiter (`lib/rate-limit.ts`) should be replaced with a Redis-backed
store when scaling beyond a single instance.
