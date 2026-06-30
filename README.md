# 🏗️ Smart Konstruksi

Construction Management Platform — ERP untuk industri konstruksi Indonesia.

## Tech Stack

- **Framework:** Next.js 16 (Turbopack)
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** Auth.js v5 (NextAuth) — Credentials provider, JWT sessions
- **RBAC:** 16 roles, 3-layer protection (Middleware → Page → API)
- **UI:** TailwindCSS, Material Symbols

## Features

- 🔐 Authentication & Authorization (16 roles)
- 🏢 Multi-branch support
- 📊 Dashboard with charts & analytics
- 📁 Project management with progress tracking
- 💰 Invoice & payment management
- 📦 Material & inventory tracking
- ✅ Task management with assignments
- 📋 RBAC with scope-based access (Global → Branch → Project → Own)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- npm or yarn

### Installation

```bash
# Clone
git clone <your-repo-url>
cd smart-konstruksi

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your database credentials

# Setup database
npx prisma db push
npx prisma db seed

# Run development server
npm run dev
```

### Environment Variables

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/smart_konstruksi"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

### Default Login

| Email | Password | Role |
|-------|----------|------|
| admin@ksi.co.id | password123 | SUPER_ADMIN |
| owner@ksi.co.id | password123 | OWNER |
| bm@ksi.co.id | password123 | BRANCH_MANAGER |
| pm@ksi.co.id | password123 | PROJECT_MANAGER |
| mandor@ksi.co.id | password123 | SITE_MANAGER |
| finance@ksi.co.id | password123 | FINANCE |
| client@ksi.co.id | password123 | CLIENT |

> ⚠️ Change all passwords before production deployment.

## Project Structure

```
smart-konstruksi/
├── app/
│   ├── (auth)/              # Auth pages (login)
│   ├── api/                 # API routes with RBAC guards
│   │   ├── auth/            # NextAuth handlers
│   │   ├── branches/        # Branch CRUD
│   │   ├── projects/        # Project CRUD
│   │   ├── users/           # User CRUD
│   │   ├── materials/       # Material CRUD
│   │   ├── invoices/        # Invoice CRUD
│   │   ├── payments/        # Payment CRUD
│   │   ├── tasks/           # Task CRUD
│   │   └── dashboard/       # Dashboard data API
│   └── dashboard/           # Dashboard pages
├── components/              # Reusable UI components
├── lib/
│   ├── api/with-auth.ts     # Auth wrapper (withPermission)
│   ├── rbac/                # RBAC system
│   │   ├── permissions.ts   # 16-role permission matrix
│   │   ├── config.ts        # Route access config
│   │   └── guard.ts         # Guard functions
│   ├── auth.ts              # NextAuth exports
│   ├── auth-config.ts       # NextAuth config
│   └── prisma.ts            # Prisma client
├── prisma/
│   ├── schema.prisma        # Database schema (21 models)
│   ├── seed.ts              # Database seeder
│   └── migrations/          # Migration history
└── middleware.ts             # Root middleware (RBAC)
```

## RBAC Roles

| Tier | Roles | Scope |
|------|-------|-------|
| Global | SUPER_ADMIN, OWNER | All data |
| Branch | BRANCH_MANAGER, ADMIN_KANTOR, FINANCE | Own branch |
| Project | PROJECT_MANAGER, SITE_MANAGER, ESTIMATOR, ARSITEK, QC_INSPECTOR, K3_OFFICER, INTERIOR_DESIGNER, KONSULTAN | Assigned projects |
| Own | CLIENT, VENDOR, HOME_OWNER | Own data only |

## API Routes

All API routes use `withPermission("resource:action", handler)` for auth + RBAC.

```typescript
// Example
export const GET = withPermission("branch:read", async (req, { user }) => {
  // user.role is checked against permission matrix
  // Returns 403 if not authorized
});
```

## License

Private — PT. Kita Satu Intersolusi
