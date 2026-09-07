# Smart Konstruksi

Smart Konstruksi is an internal construction operations platform for PT. Kita
Satu Intersolusi. It brings project delivery, commercial administration,
field activity, documents, and material control into one role-aware workspace.

> **Project status:** active development. The application is suitable for local
> and staging use, but the production checklist below must be completed before
> the first public deployment.

## What is included

| Area | Capabilities |
| --- | --- |
| Projects | Multi-branch projects, team assignments, progress reports, comments, and client access |
| Leads and clients | Lead pipeline, client records, ownership, and branch-scoped access |
| RAB | Budget plans, line items, approval states, and spreadsheet export |
| Materials | Material catalog, categories, vendors, stock levels, and project usage |
| Inventory transactions | Stock-in and stock-out ledger, reporting, and auditable reversal instead of destructive deletion |
| Tasks and attendance | Assigned work, checklists, soft deletion, check-in, and check-out |
| Documents | Categories, project files, client visibility, expiry dates, and `ACTIVE`, `DRAFT`, or `ARCHIVED` lifecycle states |
| Invoices | Invoice creation, status tracking, overdue checks, and printable/PDF output |
| Reporting | Project, financial, and material summaries with scoped data access |
| Administration | Users, branches, settings, notifications, activity logs, and audit logs |

Payment processing is intentionally outside the scope of the current release.

## Technology

- [Next.js 16](https://nextjs.org/) App Router with React 19 and TypeScript
- PostgreSQL with Prisma 7 and the Prisma PostgreSQL adapter
- Auth.js v5 credentials authentication with JWT sessions
- Tailwind CSS 4, shadcn/ui, Radix UI, and Lucide icons
- Recharts, ExcelJS, and React PDF for dashboards and exports
- Zod and bcrypt for input validation and password hashing

## Access control

The application uses authentication, route protection, API permission checks,
and record-level scope validation. The current schema defines 19 roles:

| Typical scope | Roles |
| --- | --- |
| Global | `SUPER_ADMIN`, `OWNER` |
| Branch | `BRANCH_MANAGER`, `ADMIN_KANTOR`, `FINANCE` |
| Project or operational assignment | `PROJECT_MANAGER`, `ESTIMATOR`, `SITE_MANAGER`, `ARSITEK`, `QC_INSPECTOR`, `K3_OFFICER`, `INTERIOR_DESIGNER`, `KONSULTAN`, `MANDOR`, `LOGISTIK`, `SURVEYOR` |
| Own or portal data | `CLIENT`, `VENDOR`, `HOME_OWNER` |

This table is a summary, not the permission source of truth. Exact permissions
and scope guards live in `lib/rbac/permissions.ts`, `lib/rbac/config.ts`, and
`lib/rbac/guard.ts`.

## Requirements

- Node.js 20.19+, 22.12+, or 24+
- npm
- PostgreSQL

## Local setup

1. Clone the project.

   ```bash
   git clone https://github.com/Ran2410/smart-konstruksi.git
   cd smart-konstruksi
   ```

2. Create the local environment file.

   ```bash
   cp .env.example .env
   ```

3. Configure at least these values in `.env`.

   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/smart_konstruksi"
   NEXTAUTH_SECRET="replace-with-a-long-random-secret"
   NEXTAUTH_URL="http://localhost:3000"
   SEED_ADMIN_PASSWORD="replace-with-a-strong-local-password"
   ```

   Generate an authentication secret with:

   ```bash
   openssl rand -base64 32
   ```

   SMTP variables in `.env.example` are optional and are used by the public
   contact form.

4. Install dependencies.

   ```bash
   npm ci
   ```

5. Prepare a fresh development database.

   ```bash
   npx prisma generate
   npx prisma migrate deploy
   npm run db:seed
   ```

6. Start the application and open <http://localhost:3000>.

   ```bash
   npm run dev
   ```

### Seed accounts

The minimal seed creates:

| Email | Role |
| --- | --- |
| `admin@ksi.co.id` | `SUPER_ADMIN` |
| `owner@ksi.co.id` | `OWNER` |

Both accounts use `SEED_ADMIN_PASSWORD`. When that variable is absent, the
seeder generates a random password and prints it once in the terminal. There is
no fixed default password.

For a larger local demo dataset, run:

```bash
npm run db:seed:dev
```

> **Warning:** both seed commands delete existing application data before
> inserting the new dataset. Never run them against a database that contains
> data you need to keep.

## Available commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local Turbopack development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run test:security` | Run the RBAC and unauthenticated API regression tests |
| `npm run db:seed` | Rebuild the database with the minimal seed |
| `npm run db:seed:dev` | Rebuild the database with the full demo seed |

Useful database commands:

```bash
npx prisma migrate status
npx prisma studio
```

## Important behavior

### Documents

- `ACTIVE` documents appear in the current document view.
- `DRAFT` documents remain unpublished until promoted to active.
- `ARCHIVED` documents are hidden from the current view and can be restored.
- Client visibility is controlled separately from the lifecycle status.

### Inventory corrections

Inventory transactions are ledger records. A posted transaction is not edited
or deleted; correcting it creates an opposite transaction linked to the
original, including the reason, actor, and reversal time. This keeps stock and
audit history consistent.

## Project structure

```text
smart-konstruksi/
├── app/
│   ├── api/                  # Public and authenticated API route handlers
│   ├── dashboard/            # Role-aware application pages
│   ├── login/                # Credentials sign-in page
│   └── page.tsx              # Public landing page
├── components/               # Shared UI and layout components
├── lib/
│   ├── api/                  # API authentication helpers
│   ├── rbac/                 # Permissions, route rules, and scope guards
│   ├── auth-config.ts        # Auth.js configuration
│   ├── prisma.ts             # Prisma client
│   └── rate-limiter.ts       # Login and API throttling policies
├── prisma/
│   ├── migrations/           # Versioned database changes
│   ├── schema.prisma         # Database schema (28 models)
│   └── seed.ts               # Minimal and full development seed
├── tests/security/           # RBAC regression tests
├── middleware.ts             # Authentication, route access, and rate limits
└── next.config.mjs           # Next.js and security-header configuration
```

## Production checklist

Before deploying the application:

1. Set production-only `DATABASE_URL`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL`
   values. Do not reuse local secrets or commit any `.env` file.
2. Run `npm run lint`, `npm run test:security`, and `npm run build` in CI.
3. Run `npx prisma migrate status`, back up the database, and apply migrations
   with `npx prisma migrate deploy`. Existing databases must have their Prisma
   migration baseline reconciled first; do not use `prisma db push` in
   production.
4. Move uploaded documents from the local filesystem to durable object storage
   before using serverless or multi-instance hosting.
5. Replace the in-memory rate-limit store with a shared store such as Redis for
   multi-instance deployments.
6. Configure and verify SMTP if the contact form should send email.
7. Add a CI/CD workflow, deployment health checks, backups, monitoring, and an
   application error-reporting service. These are not included yet.
8. Review the current Next.js middleware deprecation warning and migrate to the
   supported proxy convention before treating the deployment as finalized.

## License

Private and proprietary — PT. Kita Satu Intersolusi.
