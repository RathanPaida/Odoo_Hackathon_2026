# OodoPrep — Production-Ready Authentication System

A complete authentication system built with **Next.js 15 (App Router)**, **TypeScript**, **Prisma ORM**, and **PostgreSQL**. It implements secure registration, login, email verification, password reset, session/refresh-token management, and full account settings — with rate limiting, CSRF-safe cookie handling, and Zod validation throughout.

## Features

### Authentication
- User Registration (with password-strength validation)
- User Login (bcrypt-hashed passwords, "Remember me")
- Logout (server-side refresh-token revocation)
- Email Verification (link **or** 6-digit OTP)
- Resend Verification
- Forgot Password (email reset link)
- Reset Password (single-use, expiring token)
- Change Password (requires current password)
- Refresh Tokens (rotation + DB revocation)
- Session Management (active sessions table, device/IP tracking)

### User
- User Profile (view/update name, avatar)
- Change Email (re-verification required)
- Delete Account (password-confirmed)
- Account Status (ACTIVE / INACTIVE / SUSPENDED)
- Last Login tracking

### Security
- Password hashing with **bcrypt** (cost 12)
- **HTTP-only, Secure, SameSite=Lax** cookies for tokens
- Route protection via **Edge middleware**
- **Rate limiting** on login / register / OTP / password endpoints
- **Zod** validation on every input
- Prevention of duplicate email registration
- Email verification **required before login**
- Generic auth errors (no user enumeration)
- Soft-delete-ready schema (`deletedAt`) — currently hard-deletes with cascades

## Tech Stack
Next.js 15 · TypeScript · Prisma 5 · PostgreSQL · jose (JWT) · bcryptjs · Zod · React Hook Form · Tailwind CSS · Nodemailer/Resend.

## Folder Structure
```
app/                     # Routes (pages + API)
  api/auth/*             # register, login, logout, verify-email,
                         # resend-verification, forgot-password,
                         # reset-password, me, refresh
  api/user/*             # profile (PATCH), change-password, change-email, delete
  login|register|verify-email|forgot-password|reset-password  # public pages
  dashboard|profile|settings  # protected pages (middleware-guarded)
actions/                 # Server Actions (logoutAction)
components/
  auth/                  # Auth forms + shell
  ui/                    # Toast, Spinner
  user/                  # App shell, profile/settings forms, logout button
lib/
  auth/                  # jwt, session, password, guard
  services/              # auth-service, user-service (DB logic)
  email.ts + email/templates.ts
  db.ts (Prisma singleton) · rate-limit.ts · request.ts · utils.ts
middleware.ts            # Edge route protection
prisma/                  # schema.prisma + seed.ts
validations/             # Zod schemas (auth, user)
types/                   # Shared TS types
hooks/                   # use-api fetch helper
utils/                   # cn, formatters, token/otp generators
```

## Database Schema
Models: `User`, `EmailVerification`, `PasswordReset`, `Session`, `RefreshToken`.
- Unique constraints: `User.email`, `EmailVerification.token`, `PasswordReset.token`, `RefreshToken.tokenHash`.
- Indexes on `status`, `emailVerified`, `userId` FKs, `expiresAt`.
- `onDelete: Cascade` on all relations to the user.
- `deletedAt` column for optional soft-delete.

## Getting Started

### 1. Install dependencies
```bash
cd oodoprep
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
Generate secrets:
```bash
openssl rand -base64 32   # -> JWT_ACCESS_SECRET
openssl rand -base64 32   # -> JWT_REFRESH_SECRET
```
Fill in `DATABASE_URL` and email provider settings.

### 3. Start PostgreSQL
**Local (Docker Compose — recommended):**
```bash
docker compose up -d      # starts Postgres on :5432 (see docker-compose.yml)
```
Then set:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/oodoprep?schema=public"
```
**Local (plain Docker):**
```bash
docker run --name oodoprep-db -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=oodoprep \
  -p 5432:5432 -d postgres:16
```
**Without Docker:** install PostgreSQL locally and create a database `oodoprep`, then point `DATABASE_URL` at it.

### 4. Run migrations & generate client
```bash
npm run prisma:migrate   # creates migration + applies to DB + generates client
```
A migration file is created under `prisma/migrations/`. To apply in another
environment use `npm run prisma:deploy` (no interactive prompt).

### 5. Seed admin user
```bash
npm run db:seed
```
Default admin: `admin@oodoprep.com` / `Admin@123456` (override with
`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` env vars).

### 6. Run the app
```bash
npm run dev      # http://localhost:3000
```

## Local Setup for Teammates (Fresh Clone)

`.env` is gitignored and the database is **not** part of the repo, so a fresh
clone has no database connection. A teammate must provision their own Postgres
and apply the committed migrations:

```bash
# 1. Start Postgres (or use docker compose up -d)
docker run --name oodoprep-db -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=oodoprep \
  -p 5432:5432 -d postgres:16

# 2. Environment
cp .env.example .env
#    set DATABASE_URL="postgresql://postgres:postgres@localhost:5432/oodoprep?schema=public"
#    generate JWT_ACCESS_SECRET / JWT_REFRESH_SECRET (openssl rand -base64 32)

# 3. Install, migrate, seed, run
npm install
npm run prisma:migrate     # rebuilds schema from prisma/migrations (no live DB needed)
npm run db:seed            # creates admin@oodoprep.com / Admin@123456
npm run dev
```
> Each clone connects to its **own** local database, so teammates' users are
> separate from yours. For a shared team environment, point `DATABASE_URL` at a
> hosted Postgres (Neon, Supabase, Railway, RDS) instead of `localhost`.

## Email Configuration
- **SMTP:** set `EMAIL_PROVIDER=smtp` and `SMTP_HOST/PORT/USER/PASS`.
- **Resend:** set `EMAIL_PROVIDER=resend` and `RESEND_API_KEY`.
- In development, if no provider is configured, emails are **logged to the
  console** (including the verification link/code) so flows still work.

## API Reference
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | – | Register new user (sends verification) |
| POST | `/api/auth/login` | – | Login, sets cookies |
| POST | `/api/auth/logout` | ✓ | Revoke session, clear cookies |
| POST | `/api/auth/verify-email` | – | Verify via `token` or `code`+`email` |
| POST | `/api/auth/resend-verification` | – | Resend verification email |
| POST | `/api/auth/forgot-password` | – | Send reset link |
| POST | `/api/auth/reset-password` | – | Set new password |
| GET  | `/api/auth/me` | ✓ | Current user (auto-refreshes) |
| POST | `/api/auth/refresh` | ✓ | Rotate refresh token |
| PATCH | `/api/user/profile` | ✓ | Update name/avatar |
| POST | `/api/user/change-password` | ✓ | Change password |
| POST | `/api/user/change-email` | ✓ | Change email (re-verify) |
| DELETE | `/api/user/delete` | ✓ | Delete account |

## How It Works (Auth Flow)
1. **Login** → credentials verified → `RefreshToken` row written to DB →
   `access_token` + `refresh_token` set as HTTP-only cookies.
2. **Requests** carry the access token (verified in API routes and middleware).
3. **Expiry** → client calls `/api/auth/refresh` (or middleware silently
   re-issues access from the refresh token). DB revocation is enforced on
   rotation, so logged-out / reset sessions cannot be reused.
4. **Logout** → refresh token revoked in DB + cookies cleared.

## Deployment
Works on **Vercel**, **Railway**, **Render**, or any Node host.
1. Provision a managed PostgreSQL (Neon, Supabase, Railway, RDS).
2. Set all env vars in the host dashboard (use strong secrets).
3. Set `NODE_ENV=production` (cookies become `Secure`).
4. Run `npm run prisma:deploy` as a build/start step to apply migrations.
5. Build: `npm run build` (runs `prisma generate && next build`).
6. For rate limiting across multiple instances, replace the in-memory
   `lib/rate-limit.ts` with a Redis-backed store.

## Notes & Extensibility
- Refresh tokens use **rotation + family tracking**; reuse is detected and the
  whole family can be invalidated (swap-in in `rotateSession`).
- All DB logic lives in `lib/services/*` for clean separation.
- `lib/email/templates.ts` holds the HTML email designs.
