<div align="center">

# 🏢 AssetFlow — Enterprise Asset Management System

### A full-stack ERP module for organizational asset lifecycle management

![Next.js](https://img.shields.io/badge/Next.js-15.1-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)

[![Deployed on Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?logo=vercel)](#)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen)](#)

</div>

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Problem Statement](#-problem-statement)
- [Features](#-features)
- [Architecture Overview](#-architecture-overview)
- [Tech Stack](#-tech-stack)
- [Folder Structure](#-folder-structure)
- [Database Schema Summary](#-database-schema-summary)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Prisma Setup](#-prisma-setup)
- [Running the Project](#-running-the-project)
- [Default Credentials](#-default-credentials)
- [Screenshots](#-screenshots)
- [API Routes](#-api-routes)
- [User Roles & Permissions](#-user-roles--permissions)
- [Project Workflow](#-project-workflow)
- [Future Enhancements](#-future-enhancements)
- [Contributors](#-contributors)
- [License](#-license)
- [Acknowledgements](#-acknowledgements)

---

## 🔍 Project Overview

**AssetFlow** is a comprehensive enterprise asset management (EAM) system built as a full-stack web application. It enables organizations to track, allocate, transfer, maintain, and audit physical assets across departments — with role-based access control, real-time notifications, and a complete audit trail.

Built during the **Odoo Hackathon 2026**, AssetFlow demonstrates production-grade architecture patterns including clean layered architecture (Controller → Service → Repository), RBAC with 4 roles and 20 fine-grained permissions, JWT auth with refresh token rotation, and a fully typed codebase from database to UI.

---

## 🎯 Problem Statement

Organizations managing physical assets (laptops, monitors, vehicles, furniture, projectors) across multiple departments face critical challenges:

1. **No centralized tracking** — spreadsheets and manual logs lead to lost or underutilized assets
2. **Unclear ownership** — difficulty knowing who holds what, and where
3. **Slow transfer/approval workflows** — email chains and paper forms cause delays
4. **Reactive maintenance** — no structured way to report, prioritize, or track repairs
5. **No audit trail** — compliance gaps with no history of asset movements
6. **Role confusion** — admins, managers, department heads, and employees lack clear boundaries

AssetFlow solves all of these with a single, role-aware platform.

---

## ✨ Features

### 🔐 Authentication & Security
- User Registration with password-strength validation
- Login with bcrypt-hashed passwords & "Remember me"
- Email Verification via **link or 6-digit OTP**
- Forgot/Reset Password with single-use expiring tokens
- Change Password (requires current password verification)
- **JWT Access + Refresh Token rotation** with DB-backed revocation
- Session management with device/IP tracking
- HTTP-only, Secure, SameSite=Lax cookies
- **Edge middleware** for route protection and role enforcement
- **In-memory rate limiting** on sensitive endpoints (login, register, OTP, password)
- **Zod validation** on every API input

### 📦 Asset Management
- Full asset lifecycle: Register → Allocate → Transfer → Return → Audit
- Asset tagging with unique asset tags and serial numbers
- Track condition (NEW, GOOD, FAIR, POOR), location, cost, and category
- Asset allocation/deallocation with full history
- **QR code generation** (SVG) for each asset
- Photo and document attachment support
- Bookable assets (vehicles, projectors, conference rooms)

### 🔄 Transfer Requests
- Employees can request asset transfers to other employees
- Manager/Admin approval/rejection workflow
- Automatic allocation update on approval
- Full transfer history with audit trail

### 📥 Return Requests
- Employees can request to return allocated assets
- Condition notes and image attachments (up to 5 URLs)
- Manager/Admin review with approve/reject
- Automatic deallocation on approval

### 🔧 Maintenance Management
- Employees can raise maintenance requests for allocated assets
- Priority levels: LOW, MEDIUM, HIGH, CRITICAL
- Photo attachment support
- Technician assignment and notes
- Status workflow: PENDING → APPROVED → IN_PROGRESS → COMPLETED
- Rejection with reasons

### 📅 Resource Bookings
- Bookable assets (vehicles, projectors, etc.)
- Calendar and list view toggle
- **Overlap detection** — prevents double-booking
- Create, reschedule, and cancel bookings
- Mini month-view calendar component

### 🏛️ Audit Cycles (Partially Implemented)
- Create audit cycles scoped by department or globally
- Assign auditors to audit cycles
- Verify individual assets within an audit
- Status tracking: DRAFT → IN_PROGRESS → COMPLETED
- UI for admin audit management exists

### 🔔 Notifications & Activity
- Real-time unread notification count (polling every 30s)
- Notification types: ASSET_ASSIGNED, TRANSFER, RETURN, MAINTENANCE, BOOKING, REMINDER
- Mark read / Mark all read
- Type filtering and unread-only filter
- **Activity logging** — every significant action is recorded
- System-wide activity timeline for admins

### 🏢 Organization Management
- **Departments** with hierarchical structure (parent/child)
- **Department Heads** assignment
- **Asset Categories** with custom fields (JSON)
- **Employee Directory** with role and department info
- Employee role promotion/demotion

### 👤 User Management
- Profile editing (name, avatar)
- Change email (with re-verification)
- Change password
- Delete account (with password confirmation)
- Account status management (ACTIVE, INACTIVE, SUSPENDED)

### 📊 Dashboards
- **Admin Dashboard** — KPI cards (total assets, available, allocated, pending maintenance/transfers, employees, departments)
- **Asset Manager Dashboard** — Asset overview, pending actions, gear gauges
- **Department Head Dashboard** — Department assets and request approvals *(Partially Implemented)*
- **Employee Dashboard** — My assets, quick actions, recent notifications, activity feed

### 🎨 UI/UX
- Fully responsive design with **Tailwind CSS**
- Role-aware navigation with dynamic menu items
- Toast notification system (success/error/info)
- Loading states with skeleton placeholders
- Empty states with action buttons
- Pagination with ellipsis
- Drawer (slide-in) and modal components
- Confirmation dialogs with destructive mode

---

## 🏗️ Architecture Overview

```mermaid
graph TB
    subgraph "Client (Browser)"
        A[Next.js Pages & Components]
    end

    subgraph "Edge Runtime"
        B[Middleware - JWT verification, RBAC, Route protection]
    end

    subgraph "Server (App Router)"
        C[API Route Handlers]
        D[Server Actions]
    end

    subgraph "Business Logic"
        E[Services Layer]
        F[Validations - Zod]
        G[Auth Guards - requireUser/requireRole/requirePermission]
    end

    subgraph "Data Access"
        H[Repository Layer]
        I[Prisma ORM]
    end

    subgraph "Database"
        J[(SQLite)]
    end

    A -->|HTTP/JSON| B
    B -->|Authenticated Request| C
    C --> E
    E --> F
    E --> H
    H --> I
    I --> J
    C --> G
    D --> E
```

```mermaid
sequenceDiagram
    participant C as Client
    participant M as Middleware
    participant R as API Route
    participant S as Service
    participant DB as Database

    C->>M: Request with cookies
    M->>M: Verify access token (jose)
    alt Access token expired
        M->>M: Verify refresh token
        M->>C: Set new access token cookie
    end
    M->>R: Forward authenticated request
    R->>S: Call service method
    S->>S: Validate input (Zod)
    S->>DB: Prisma query
    DB-->>S: Result
    S-->>R: DTO response
    R-->>C: JSON { ok: true, data }
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 15 (App Router) | React framework with server/client components |
| **Frontend** | React 19 | UI library |
| **Frontend** | TypeScript 5.7 | Static type checking |
| **Frontend** | Tailwind CSS 3.4 | Utility-first styling |
| **Frontend** | React Hook Form 7 | Form state management |
| **Frontend** | Zod 3.24 | Schema validation |
| **Backend** | Next.js API Routes | RESTful API endpoints |
| **Backend** | Edge Middleware | Route protection at the edge |
| **Database** | SQLite | Lightweight relational database |
| **ORM** | Prisma 5.22 | Type-safe database client |
| **Auth** | jose 5.9 | JWT signing/verification (Edge-safe) |
| **Auth** | bcryptjs 2.4 | Password hashing |
| **Email** | Nodemailer / Resend | Email delivery (SMTP or API) |
| **Other** | date-fns 4.4 | Date formatting |
| **Other** | class-variance-authority | Variant-based component styling |
| **Other** | clsx + tailwind-merge | Conditional class merging |

---

## 📁 Folder Structure

```
Odoo_Hackathon_2026/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout (ToastProvider)
│   ├── page.tsx                      # Root redirect → /dashboard
│   ├── login/page.tsx                # Login page
│   ├── register/page.tsx             # Registration page
│   ├── verify-email/page.tsx         # Email verification (OTP)
│   ├── forgot-password/page.tsx      # Forgot password page
│   ├── reset-password/page.tsx       # Reset password page
│   ├── profile/page.tsx              # Profile settings
│   ├── settings/page.tsx             # Account settings
│   ├── dev/mailbox/page.tsx          # Dev email catcher
│   ├── dashboard/
│   │   ├── page.tsx                  # Role-based redirect
│   │   ├── admin/                    # Admin dashboard & modules
│   │   │   ├── page.tsx              # KPI dashboard
│   │   │   ├── assets/page.tsx       # Asset management
│   │   │   ├── activity/page.tsx     # Activity timeline
│   │   │   ├── transfers/page.tsx    # Transfer approvals
│   │   │   ├── returns/page.tsx      # Return approvals
│   │   │   ├── maintenance/page.tsx  # Maintenance management
│   │   │   ├── audits/page.tsx       # Audit cycle management
│   │   │   └── org/                  # Organization management
│   │   │       ├── departments/page.tsx
│   │   │       ├── categories/page.tsx
│   │   │       └── employees/page.tsx
│   │   ├── manager/                  # Asset Manager dashboard
│   │   │   ├── page.tsx              # Manager overview
│   │   │   ├── assets/page.tsx       # Asset CRUD
│   │   │   ├── categories/page.tsx   # Category management
│   │   │   ├── transfers/page.tsx    # Transfer review
│   │   │   ├── returns/page.tsx      # Return review
│   │   │   ├── maintenance/page.tsx  # Maintenance review
│   │   │   └── bookings/page.tsx     # Booking management
│   │   ├── head/                     # Department Head dashboard
│   │   │   ├── page.tsx              # Head overview
│   │   │   ├── assets/page.tsx       # Department assets
│   │   │   ├── requests/page.tsx     # Request approvals
│   │   │   └── booking/page.tsx      # Resource booking
│   │   └── employee/                 # Employee dashboard
│   │       ├── page.tsx              # Employee overview
│   │       ├── assets/page.tsx       # My assets
│   │       ├── assets/[id]/page.tsx  # Asset detail + QR
│   │       ├── transfers/page.tsx    # My transfers
│   │       ├── returns/page.tsx      # My returns
│   │       ├── maintenance/page.tsx  # My maintenance
│   │       ├── bookings/page.tsx     # My bookings
│   │       ├── notifications/page.tsx# Notifications
│   │       └── activity/page.tsx     # My activity
│   └── api/                          # API routes
│       ├── auth/                     # Auth endpoints (9 routes)
│       ├── user/                     # User management (4 routes)
│       ├── admin/                    # Admin endpoints (21 routes)
│       ├── manager/                  # Manager endpoints
│       └── employee/                 # Employee endpoints (16 routes)
├── components/                       # React components
│   ├── auth/                         # Auth forms (7 components)
│   ├── admin/                        # Admin UI (12 components)
│   ├── manager/                      # Manager UI (6 components)
│   ├── head/                         # Department Head UI (3 components)
│   ├── employee/                     # Employee UI (8 components)
│   │   └── ui/                       # Reusable UI primitives (14 components)
│   ├── user/                         # Shared user components (6 components)
│   └── ui/                           # Global UI (toast, spinner)
├── lib/                              # Server-side code
│   ├── auth/                         # JWT, session, password, roles, permissions, guard
│   ├── services/                     # Business logic (3 layers × 4 roles)
│   │   ├── admin/
│   │   ├── manager/
│   │   └── employee/
│   ├── repositories/                 # Data access (Prisma queries)
│   │   ├── manager/
│   │   └── employee/
│   ├── constants/                    # Status labels, badge colors
│   ├── utils/                        # Helper functions, QR generation
│   ├── email/                        # Email templates
│   ├── db.ts                         # Prisma singleton
│   ├── email.ts                      # Email sender (Resend/SMTP/console)
│   ├── rate-limit.ts                 # In-memory rate limiter
│   ├── request.ts                    # Request utilities
│   └── utils.ts                      # Shared helpers (cn, formatDate, etc.)
├── types/                            # TypeScript type definitions
├── validations/                      # Zod validation schemas
├── hooks/                            # Client-side hooks (apiFetch)
├── actions/                          # Server actions
├── prisma/                           # Database schema & seeds
│   ├── schema.prisma                 # 17 models
│   ├── seed.ts                       # Basic seed (admin + categories + depts)
│   └── seed-all.ts                   # Full seed (all data)
├── scripts/                          # Utility scripts
├── middleware.ts                      # Edge middleware (RBAC)
├── docker-compose.yml                # PostgreSQL container
├── next.config.js                    # Next.js config
├── tailwind.config.ts                # Tailwind config
├── postcss.config.js                 # PostCSS config
└── package.json                      # Dependencies & scripts
```

---

## 🗄️ Database Schema Summary

The database contains **17 models** organized across authentication, asset management, and system tracking:

```mermaid
erDiagram
    User ||--o{ Session : has
    User ||--o{ RefreshToken : has
    User ||--o{ EmailVerification : has
    User ||--o{ PasswordReset : has
    User ||--o{ Asset : holds
    User ||--o{ AssetAllocation : allocated
    User ||--o{ TransferRequest : requests
    User ||--o{ ResourceBooking : books
    User ||--o{ MaintenanceRequest : raises
    User ||--o{ Notification : receives
    User ||--o{ ActivityLog : generates
    User ||--o{ AuditItem : audits
    User ||--o{ ReturnRequest : requests
    User ||--o{ Department : heads

    Department ||--o{ User : employs
    Department ||--o{ Asset : contains
    Department ||--o{ AssetAllocation : scopes
    Department ||--o{ Department : hierarchy

    AssetCategory ||--o{ Asset : categorizes
    Asset ||--o{ AssetAllocation : allocated_via
    Asset ||--o{ AssetHistory : tracked_by
    Asset ||--o{ TransferRequest : transferred
    Asset ||--o{ ResourceBooking : booked
    Asset ||--o{ MaintenanceRequest : maintained
    Asset ||--o{ AuditItem : audited
    Asset ||--o{ ReturnRequest : returned

    AuditCycle ||--o{ AuditorAssignment : assigns
    AuditCycle ||--o{ AuditItem : contains
```

| Model | Description |
|-------|-------------|
| `User` | Core user with role, status, department, employee ID |
| `Department` | Hierarchical departments with head assignment |
| `EmailVerification` | Token + OTP-based email verification |
| `PasswordReset` | Single-use password reset tokens |
| `Session` | Active sessions with device/IP tracking |
| `RefreshToken` | JWT refresh tokens with rotation & family tracking |
| `AssetCategory` | Categorization with custom JSON fields |
| `Asset` | Core asset with tag, serial, condition, status, holder |
| `AssetHistory` | Immutable audit trail for asset actions |
| `AssetAllocation` | Links assets to users with dates and status |
| `TransferRequest` | Inter-employee asset transfer workflow |
| `ResourceBooking` | Time-based booking for bookable assets |
| `MaintenanceRequest` | Maintenance workflow with priority and technician |
| `AuditCycle` | Audit campaigns scoped by department/global |
| `AuditorAssignment` | Links auditors to audit cycles |
| `AuditItem` | Individual asset verification within an audit |
| `ActivityLog` | System-wide action logging |
| `Notification` | User notifications with type and read status |
| `ReturnRequest` | Asset return workflow with condition notes |

---

## 🚀 Installation

### Prerequisites
- **Node.js** ≥ 18
- **npm** ≥ 9
- **Docker** (optional, for PostgreSQL)

### 1. Clone the repository
```bash
git clone https://github.com/RathanPaida/Odoo_Hackathon_2026.git
cd Odoo_Hackathon_2026
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your configuration (see Environment Variables below)
```

### 4. Generate JWT secrets
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"  # → JWT_ACCESS_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"  # → JWT_REFRESH_SECRET
```

---

## 🔧 Environment Variables

Create a `.env` file in the project root:

```env
# ─── Database ────────────────────────────────────────────
# SQLite (default — no setup needed)
DATABASE_URL="file:./dev.db"

# OR PostgreSQL (uncomment and configure)
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/oodoprep?schema=public"

# ─── JWT Secrets ─────────────────────────────────────────
JWT_ACCESS_SECRET="your-access-secret-here"
JWT_REFRESH_SECRET="your-refresh-secret-here"

# Token expiry (optional, defaults shown)
ACCESS_TOKEN_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="7d"

# ─── Email (optional — logs to console in dev) ──────────
# Option 1: Resend
# EMAIL_PROVIDER="resend"
# RESEND_API_KEY="re_your_key_here"

# Option 2: SMTP
# EMAIL_PROVIDER="smtp"
# SMTP_HOST="smtp.gmail.com"
# SMTP_PORT="587"
# SMTP_USER="you@gmail.com"
# SMTP_PASS="app-password-here"

# Sender
EMAIL_FROM="AssetFlow <noreply@oodoprep.com>"

# ─── App ─────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# ─── Seed Override (optional) ────────────────────────────
SEED_ADMIN_EMAIL="admin@oodoprep.com"
SEED_ADMIN_PASSWORD="Admin@123456"
SEED_ADMIN_NAME="Admin"
```

---

## 🗃️ Prisma Setup

### Generate Prisma Client
```bash
npm run prisma:generate
```

### Run Migrations
```bash
npm run prisma:migrate    # Interactive migration
npm run prisma:deploy     # Apply pending migrations (production)
```

### Seed the Database

**Basic seed** (admin user + 4 categories + 2 departments):
```bash
npm run db:seed
```

**Full seed** (all demo data — 10 users, 5 departments, 19 assets, transfers, bookings, maintenance, audits, notifications, activity logs):
```bash
npx tsx prisma/seed-all.ts
```

---

## ▶️ Running the Project

```bash
# Development
npm run dev              # http://localhost:3000

# Production build
npm run build            # prisma generate && next build
npm run start            # next start

# Other commands
npm run lint             # ESLint check
npm run typecheck        # TypeScript type checking
npm run prisma:studio    # Database browser UI
npm run mail:dev         # Local dev mail server
```

---

## 🔑 Default Credentials

After running the **full seed** (`npx tsx prisma/seed-all.ts`):

| Role | Email | Password |
|------|-------|----------|
| 🛡️ **Admin** | `admin@oodoprep.com` | `Admin@123456` |
| 📋 **Asset Manager** | `manager@oodoprep.com` | `Admin@123456` |
| 👔 **Dept Head** | `head@oodoprep.com` | `Admin@123456` |
| 👔 **Dept Head** | `head2@oodoprep.com` | `Admin@123456` |
| 👤 **Employee** | `emp1@oodoprep.com` | `Admin@123456` |
| 👤 **Employee** | `emp2@oodoprep.com` | `Admin@123456` |
| 👤 **Employee** | `emp3@oodoprep.com` | `Admin@123456` |
| 👤 **Employee** | `emp4@oodoprep.com` | `Admin@123456` |
| 👤 **Employee** | `emp5@oodoprep.com` | `Admin@123456` |
| 👤 **Employee** | `emp6@oodoprep.com` | `Admin@123456` |

> After **basic seed** (`npm run db:seed`), only `admin@oodoprep.com` / `Admin@123456` is available.

---

## 📸 Screenshots

> *Screenshots will be added after deployment.*

| Page | Preview |
|------|---------|
| Login Page | `![Login](screenshots/login.png)` |
| Admin Dashboard | `![Admin Dashboard](screenshots/admin-dashboard.png)` |
| Asset Management | `![Assets](screenshots/assets.png)` |
| Manager Dashboard | `![Manager Dashboard](screenshots/manager-dashboard.png)` |
| Employee Dashboard | `![Employee Dashboard](screenshots/employee-dashboard.png)` |
| Transfer Workflow | `![Transfers](screenshots/transfers.png)` |
| Maintenance Tracking | `![Maintenance](screenshots/maintenance.png)` |
| Asset QR Code | `![QR Code](screenshots/qr-code.png)` |
| Notifications | `![Notifications](screenshots/notifications.png)` |

---

## 📡 API Routes

### Authentication
| Method | Endpoint | Auth | Rate Limit | Description |
|--------|----------|------|------------|-------------|
| `POST` | `/api/auth/register` | — | 3/min | Register new user |
| `POST` | `/api/auth/login` | — | 5/min | Login, sets cookies |
| `POST` | `/api/auth/logout` | ✓ | — | Revoke session, clear cookies |
| `GET` | `/api/auth/me` | ✓ | — | Get current user (auto-refresh) |
| `POST` | `/api/auth/refresh` | ✓ | — | Rotate refresh token |
| `POST` | `/api/auth/verify-email` | — | — | Verify via token or OTP |
| `POST` | `/api/auth/resend-verification` | — | 3/min | Resend verification |
| `POST` | `/api/auth/forgot-password` | — | 5/min | Send reset link |
| `POST` | `/api/auth/reset-password` | — | 5/min | Set new password |

### User Management
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `PATCH` | `/api/user/profile` | ✓ | Update name/avatar |
| `POST` | `/api/user/change-password` | ✓ | Change password |
| `POST` | `/api/user/change-email` | ✓ | Change email (re-verify) |
| `DELETE` | `/api/user/delete` | ✓ | Delete account |

### Admin
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/admin/dashboard/kpis` | ADMIN | Dashboard KPIs |
| `GET` | `/api/admin/users` | ADMIN | Employee directory |
| `PATCH` | `/api/admin/users/[id]` | ADMIN | Update user role/status |
| `GET/POST` | `/api/admin/assets` | ADMIN, MANAGER | List/create assets |
| `POST` | `/api/admin/assets/[id]/allocate` | ADMIN, MANAGER | Allocate asset |
| `GET/POST` | `/api/admin/categories` | ADMIN | List/create categories |
| `GET/PATCH/DELETE` | `/api/admin/categories/[id]` | ADMIN | Category CRUD |
| `GET/POST` | `/api/admin/departments` | ADMIN | List/create departments |
| `GET/PATCH/DELETE` | `/api/admin/departments/[id]` | ADMIN | Department CRUD |
| `GET` | `/api/admin/transfers` | ADMIN, MANAGER | List all transfers |
| `PATCH` | `/api/admin/transfers/[id]` | ADMIN, MANAGER | Approve/reject transfer |
| `GET` | `/api/admin/returns` | ADMIN, MANAGER | List all returns |
| `PATCH` | `/api/admin/returns/[id]` | ADMIN, MANAGER | Approve/reject return |
| `GET` | `/api/admin/maintenance` | ADMIN, MANAGER | List all maintenance |
| `PATCH` | `/api/admin/maintenance/[id]` | ADMIN, MANAGER | Review maintenance |
| `GET/POST` | `/api/admin/audits` | ADMIN | List/create audit cycles |
| `GET` | `/api/admin/activity` | ADMIN | All activity logs |
| `GET` | `/api/admin/employees` | ADMIN | Employee list |
| `PATCH` | `/api/admin/employees/[id]/role` | ADMIN | Change employee role |
| `PATCH` | `/api/admin/employees/[id]/department` | ADMIN | Change employee dept |

### Employee
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/employee/dashboard` | ✓ | Dashboard stats |
| `GET` | `/api/employee/assets` | ✓ | My allocated assets |
| `GET` | `/api/employee/assets/[id]` | ✓ | Asset details |
| `GET/POST` | `/api/employee/transfers` | ✓ | List/create transfers |
| `GET/PATCH` | `/api/employee/transfers/[id]` | ✓ | Detail/cancel transfer |
| `GET/POST` | `/api/employee/returns` | ✓ | List/create returns |
| `GET/PATCH` | `/api/employee/returns/[id]` | ✓ | Detail/cancel return |
| `GET/POST` | `/api/employee/bookings` | ✓ | List/create bookings |
| `GET/PATCH/DELETE` | `/api/employee/bookings/[id]` | ✓ | Detail/cancel/reschedule |
| `GET/POST` | `/api/employee/maintenance` | ✓ | List/create maintenance |
| `GET/PATCH` | `/api/employee/maintenance/[id]` | ✓ | Detail/update maintenance |
| `GET/POST` | `/api/employee/notifications` | ✓ | List/mark read |
| `GET` | `/api/employee/notifications/unread-count` | ✓ | Unread badge count |
| `POST` | `/api/employee/notifications/read-all` | ✓ | Mark all read |
| `GET` | `/api/employee/activity` | ✓ | My activity logs |
| `GET` | `/api/employee/employees` | ✓ | Colleagues directory |

### Manager
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/manager/dashboard` | MANAGER | Dashboard stats |
| `GET/POST` | `/api/manager/assets` | MANAGER | List/create assets |
| `GET/PATCH/DELETE` | `/api/manager/assets/[id]` | MANAGER | Asset CRUD |
| `POST` | `/api/manager/assets/[id]/allocate` | MANAGER | Allocate asset |
| `GET/POST` | `/api/manager/categories` | MANAGER | List/create categories |
| `GET/PATCH/DELETE` | `/api/manager/categories/[id]` | MANAGER | Category CRUD |
| `GET` | `/api/manager/transfers` | MANAGER | List transfers |
| `GET/PATCH` | `/api/manager/transfers/[id]` | MANAGER | Review transfer |
| `GET` | `/api/manager/returns` | MANAGER | List returns |
| `GET/PATCH` | `/api/manager/returns/[id]` | MANAGER | Review return |
| `GET` | `/api/manager/maintenance` | MANAGER | List maintenance |
| `GET/PATCH` | `/api/manager/maintenance/[id]` | MANAGER | Review maintenance |
| `GET` | `/api/manager/bookings` | MANAGER | List bookings |
| `DELETE` | `/api/manager/bookings/[id]` | MANAGER | Cancel booking |
| `GET` | `/api/manager/employees` | MANAGER | Employee directory |

---

## 👥 User Roles & Permissions

### Role Hierarchy

```
🛡️ ADMIN (Superuser)
    ├── Full system access
    ├── Manages departments, categories, employees
    ├── Creates audit cycles
    └── Can access all dashboards

📋 ASSET_MANAGER
    ├── CRUD assets, categories
    ├── Approve/reject transfers, returns, maintenance
    ├── Manage bookings
    └── View employee directory

👔 DEPARTMENT_HEAD
    ├── View department assets
    ├── Approve department requests *(Partially Implemented)*
    └── Book resources *(Partially Implemented)*

👤 EMPLOYEE
    ├── View allocated assets
    ├── Create transfer/return/maintenance/booking requests
    ├── View notifications and activity
    └── Cancel own pending requests
```

### Permission Matrix (20 fine-grained permissions)

| Permission | ADMIN | MANAGER | HEAD | EMPLOYEE |
|-----------|:-----:|:------:|:----:|:--------:|
| `manage_departments` | ✅ | ❌ | ❌ | ❌ |
| `manage_categories` | ✅ | ❌ | ❌ | ❌ |
| `manage_employees` | ✅ | ❌ | ❌ | ❌ |
| `assign_roles` | ✅ | ❌ | ❌ | ❌ |
| `view_all_assets` | ✅ | ✅ | ❌ | ❌ |
| `register_assets` | ✅ | ✅ | ❌ | ❌ |
| `allocate_assets` | ✅ | ✅ | ❌ | ❌ |
| `approve_transfers` | ✅ | ✅ | ❌ | ❌ |
| `approve_returns` | ✅ | ✅ | ❌ | ❌ |
| `manage_maintenance` | ✅ | ✅ | ❌ | ❌ |
| `view_audit_cycles` | ✅ | ❌ | ❌ | ❌ |
| `create_audits` | ✅ | ❌ | ❌ | ❌ |
| `view_reports` | ✅ | ✅ | ❌ | ❌ |
| `view_own_assets` | ✅ | ✅ | ✅ | ✅ |
| `request_transfers` | ✅ | ✅ | ✅ | ✅ |
| `request_returns` | ✅ | ✅ | ✅ | ✅ |
| `request_maintenance` | ✅ | ✅ | ✅ | ✅ |
| `book_resources` | ✅ | ✅ | ✅ | ✅ |
| `view_notifications` | ✅ | ✅ | ✅ | ✅ |
| `view_activity` | ✅ | ✅ | ✅ | ✅ |

---

## 🔄 Project Workflow

### Asset Lifecycle
```mermaid
stateDiagram-v2
    [*] --> Available: Registered
    Available --> Allocated: Assigned to Employee
    Allocated --> InTransfer: Transfer Requested
    InTransfer --> Allocated: Transfer Approved
    InTransfer --> Available: Transfer Rejected
    Allocated --> InMaintenance: Issue Reported
    InMaintenance --> Allocated: Repair Completed
    InMaintenance --> Available: Asset Returned
    Allocated --> ReturnRequested: Return Requested
    ReturnRequested --> Available: Return Approved
    ReturnRequested --> Allocated: Return Rejected
    Allocated --> Available: Booking Completed
    Available --> [*]
```

### Transfer Request Flow
```mermaid
flowchart LR
    A[Employee Creates Transfer] --> B[Manager Reviews]
    B -->|Approved| C[Allocation Updated]
    B -->|Rejected| D[Status = REJECTED]
    C --> E[Asset Holder Changed]
    C --> F[History Entry Created]
    C --> G[Employee Notified]
```

### Authentication Flow
```mermaid
flowchart TD
    A[User Logs In] --> B[Credentials Verified]
    B --> C[Refresh Token Stored in DB]
    B --> D[Access + Refresh Cookies Set]
    D --> E[Subsequent Requests Use Access Token]
    E --> F{Token Expired?}
    F -->|No| G[Continue]
    F -->|Yes| H{Refresh Token Valid?}
    H -->|Yes| I[New Access Token Minted]
    I --> G
    H -->|No| J[Redirect to Login]
```

---

## 🚧 Future Enhancements

- [ ] **Department Head Dashboard** — Complete integration with real data (currently partially implemented with mock data)
- [ ] **Asset Depreciation Tracking** — Calculate and display asset depreciation over time
- [ ] **Bulk Asset Import/Export** — CSV/Excel import for large asset inventories
- [ ] **Advanced Reporting** — Exportable reports with charts and analytics
- [ ] **Redis-backed Rate Limiting** — Replace in-memory rate limiter for multi-instance deployments
- [ ] **File Upload** — Direct image/document upload (currently URL-based)
- [ ] **WebSocket Notifications** — Real-time push notifications instead of polling
- [ ] **Mobile Responsive Navigation** — Hamburger menu and touch-optimized layouts
- [ ] **Two-Factor Authentication (2FA)** — TOTP-based 2FA for admin accounts
- [ ] **LDAP/SSO Integration** — Enterprise SSO for large organizations
- [ ] **PostgreSQL Migration** — Migrate from SQLite to PostgreSQL for production (Docker Compose already configured)
- [ ] **E2E Testing** — Playwright/Cypress test suite
- [ ] **CI/CD Pipeline** — GitHub Actions for automated testing and deployment

---

## 👨‍💻 Contributors

| Name | GitHub |
|------|--------|
| Rathan Paida | [@RathanPaida](https://github.com/RathanPaida) |

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements

- [Next.js](https://nextjs.org/) — The React framework for production
- [Prisma](https://www.prisma.io/) — Next-generation ORM for Node.js and TypeScript
- [Tailwind CSS](https://tailwindcss.com/) — Rapidly build modern websites
- [jose](https://github.com/panva/jose) — JavaScript Open-source JOSE library (Edge-safe JWT)
- [Zod](https://zod.dev/) — TypeScript-first schema validation
- [React Hook Form](https://react-hook-form.com/) — Performant, flexible forms
- [date-fns](https://date-fns.org/) — Modern JavaScript date utility library
- [bcryptjs](https://github.com/nicola/bcryptjs) — Optimized bcrypt in JavaScript
- [Nodemailer](https://nodemailer.com/) — Send emails from Node.js
- [Resend](https://resend.com/) — Modern email API for developers
- [Odoo](https://www.odoo.com/) — Open source business apps (Hackathon sponsor)

---

<div align="center">

**Built with ❤️ for the Odoo Hackathon 2026**

</div>
