# AssetFlow ERP — Teammate Setup & "Database Not Running" FAQ

> Explains why a teammate who clones the repo cannot log in / create users
> until they set up their own database, and how to fix it.

---

## 1. Why login/register fails on a fresh clone

A teammate who clones the **oodoprep** repo and runs it will see
*"database is not running"* / connection errors. This is **expected** and is an
environment setup gap, **not a code bug**.

### What is cloned vs. what is NOT

| Item | Cloned? | Notes |
|------|---------|-------|
| All source code (`app/`, `lib/`, `components/`, ...) | ✅ Yes | — |
| `prisma/migrations/` (schema + seed) | ✅ Yes | Team mate can apply them locally |
| `.env.example` | ✅ Yes | Template only |
| `.env` (contains `DATABASE_URL`, secrets) | ❌ **No** | Gitignored (`/.env` in `.gitignore`) |
| The actual **PostgreSQL server** | ❌ **No** | Runs on the original dev machine (`localhost:5432`) |

### Why it fails

1. `.env` is gitignored, so `DATABASE_URL` is never shared. Without it, Prisma
   has no database to connect to.
2. Even if a `.env` is created, the teammate's own machine has **no Postgres**
   running on `localhost:5432` → connection refused / "database not running".

**Result:** login, register, and "create user" all fail until a database exists
and `DATABASE_URL` points at it. Each clone talks to **its own local database**,
so a teammate's users are separate from yours (expected for local dev).

---

## 2. One-time setup for a teammate

```bash
# 1. Start PostgreSQL (Docker example)
docker run --name oodoprep-db -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 -d postgres:16

# 2. Configure environment
cp .env.example .env
#    edit DATABASE_URL to point at their own Postgres, e.g.:
#    DATABASE_URL="postgresql://postgres:postgres@localhost:5432/oodoprep?schema=public"

# 3. Install deps, apply committed migrations, seed admin
npm install
npm run prisma:migrate        # creates all tables from prisma/migrations
npm run db:seed               # admin@oodoprep.com / Admin@123456

# 4. Run
npm run dev                   # http://localhost:3000
```

After this, register / login / create users works normally against **their own**
database.

---

## 3. Architecture recap (why this is safe)

- The authentication module (`oodoprep`) is a self-contained Next.js 15 +
  Prisma + PostgreSQL app.
- RBAC (roles, permissions, guards, admin Employee Directory APIs) extends the
  existing auth without rewriting it.
- Migrations are committed, so any clone can rebuild the schema with
  `npm run prisma:migrate` — no need to share the live database.

---

## 4. Optional improvements (not yet done)

- Add a `docker-compose.yml` so teammates can start Postgres with one command.
- Add a "Local setup" section to `README.md` with the steps above.
- Consider a hosted/dev database (Neon, Supabase) for shared team environments.
