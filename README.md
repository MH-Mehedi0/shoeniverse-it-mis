# Shoeniverse IT & MIS System

A centralized IT Complaint Management System for recording, tracking, and
resolving internal IT issues — built for a small IT team (2–5 agents)
supporting on the order of a few hundred staff.

## 1. Overview

Two roles:

- **Admin** — manages users, views all complaints, views the audit trail,
  and does everything an IT User can do.
- **IT User** — logs in, creates complaints, tracks and updates status on
  the shared complaint queue.

Every complaint gets an auto-generated, guaranteed-unique tracking ID
(`IT-YYYYMMDD-NNNN`), moves through 5 statuses, and keeps a full,
tamper-resistant history of every status change.

## 2. Features

- Role-based access control (server-enforced, not just hidden UI)
- 4-step guided complaint creation wizard
- Race-free ticket ID generation
- Status history enforced at the database layer via trigger — a status
  can never change without a history row being written, no matter what
  code path touches it
- Admin dashboard with live, DB-computed statistics and charts
- User management with soft-delete (deactivation) — historical records
  always stay attributable
- Full activity/audit log (logins, failed logins, complaint and user
  changes)
- Search, filter, and pagination on complaints and activity logs
- Bangladeshi phone number validation, Asia/Dhaka timezone throughout
- Responsive: table view on desktop, card view on mobile

## 3. Technology Stack

- **Frontend:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS, Recharts
- **Backend:** Next.js API routes
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Auth:** httpOnly JWT session cookie (`jose`), bcrypt password hashing

## 4. Installation

```bash
npm install
cp .env.example .env
# edit .env — set DATABASE_URL, SESSION_SECRET, SEED_ADMIN_* values
```

Generate a session secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## 5. Environment Variables

See `.env.example` for the full list and comments. Required:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `SESSION_SECRET` | Signs session JWTs — long random value, never commit a real one |
| `SEED_ADMIN_USER_ID` / `SEED_ADMIN_PASSWORD` / `SEED_ADMIN_FULL_NAME` | Used once by the seed script to create the first admin |

## 6. Database Setup & Migration

This repo ships with two hand-authored migrations (written outside a
live DB session — see section 15):

```bash
npx prisma generate
npx prisma migrate deploy
```

`migrate deploy` applies migrations in order without the interactive
drift-detection `migrate dev` does, which is the right mode for a
pre-written migration set. Going forward, once this is your live schema,
use `npx prisma migrate dev --name <change>` for new changes as normal.

> **Migration 2** (`..._status_history_trigger`) creates the Postgres
> trigger that auto-writes `complaint_status_history` rows on every
> insert/update of `complaints.current_status`. This is a deliberate
> design choice — see the architecture note in `src/lib/db.ts`
> (`withActor`) for why it's enforced at the DB layer rather than only
> in application code.

## 7. Seed Data

```bash
npm run seed
```

Creates:
- 1 Admin (login from `SEED_ADMIN_USER_ID` / `SEED_ADMIN_PASSWORD`)
- 3 sample IT Users (`it.mehedi`, `it.nasim`, `it.jannatul`, password `ChangeMe123` — change immediately)
- 5 sample complaints, one in each status, with realistic history

Re-running `npm run seed` is safe — it upserts users and clears/recreates
only the complaints it seeded itself (marked `[SEED]`).

**Before production:** deactivate or change the sample IT user passwords,
and delete the seeded complaints (`DELETE FROM complaints WHERE
complaint_details LIKE '[SEED]%'`, which cascades to their history).

## 8. Development

```bash
npm run dev
```

Visit `http://localhost:3000`.

## 9. Production Build

```bash
npm run build
npm run start
```

Set `NODE_ENV=production` and a production `DATABASE_URL` / `SESSION_SECRET`
in your deployment environment. `sessionCookieOptions` in `src/lib/auth.ts`
automatically sets the `secure` cookie flag when `NODE_ENV=production` —
serve over HTTPS in production or the session cookie won't be set by
the browser.

## 10. Deployment Notes

- Single Next.js app + single managed Postgres instance, one region — this
  system doesn't need more than that at its current scale (~100 staff,
  20–200 tickets/day, 2–5 IT agents).
- No queue, cache, or read replica — deliberately, to keep this
  maintainable by a small team.
- Point `DATABASE_URL` at your managed Postgres (RDS, Neon, Supabase, etc.),
  run `npx prisma migrate deploy`, then `npm run seed` once for the initial
  admin account.

## 11. Admin Login Setup

The first Admin account comes from `SEED_ADMIN_USER_ID` /
`SEED_ADMIN_PASSWORD` in `.env`, created by `npm run seed`. Log in with
those, then immediately: change the password (Profile page), and create
real named accounts for the actual IT team via User Management.

## 12. User Roles

| Capability | Admin | IT User |
|---|---|---|
| View / create / update complaints | ✅ | ✅ |
| View complaint history | ✅ | ✅ |
| Dashboard stats | ✅ | ✅ (own-team totals; user counts admin-only) |
| User management | ✅ | ❌ |
| Activity logs | ✅ | ❌ |

Both roles share one complaint queue by design — this is a small team
working tickets together, not siloed per-agent queues.

## 13. Complaint Workflow

```
Create Complaint (4-step wizard)
        ↓
Ticket ID generated automatically (IT-YYYYMMDD-NNNN)
        ↓
Status: Pending
        ↓
Device Collected / Device Allocated
        ↓
On Process
        ↓
Done

(Cancel is available from Pending / Device Collected / On Process)
```

Every status transition is confirmed before submitting and is recorded
in the ticket's timeline with who changed it, when, and why.

## 14. Project Structure

```
prisma/
  schema.prisma                  # source of truth for the DB schema
  migrations/                    # hand-authored, see section 6
  seed.ts
src/
  app/
    page.tsx                     # landing page
    login/page.tsx
    dashboard/                   # authenticated area (see layout.tsx)
      page.tsx                   # stats + charts
      complaints/                # list, new (wizard), [id] (detail)
      users/page.tsx             # admin only
      activity/page.tsx          # admin only
      profile/page.tsx
    api/                         # route handlers (the real security boundary)
  components/                    # Sidebar, Stepper, Timeline, StatusBadge, Toast
  lib/                           # db, auth, rbac, ticketId, activityLog, validation
  middleware.ts                  # route-level redirect (UX only, not security)
```

## 15. A note on how this was built

This project was generated without network access to actually run
`npm install`, apply migrations against a live database, or build/test
the app. Every file is hand-written and internally consistent, but
**treat your first local `npm install && npm run build` as the real test
pass** — budget time for the small TypeScript/import issues that surface
only once the compiler actually runs.
