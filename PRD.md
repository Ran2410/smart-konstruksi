# Product Requirements Document (PRD)
## Smart Konstruksi — KSI Construction Management Platform

**Version:** 1.1  
**Date:** 29 June 2026  
**Status:** Updated — Analyst Workflow Integrated  
**Author:** Allif Alfikri (Tim Smart Konstruksi)  
**Based on:** Smart Konstruksi Final Draft Merged v1.0 (28 June 2026)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Objectives](#3-goals--objectives)
4. [Scope](#4-scope)
5. [User Roles & Permissions](#5-user-roles--permissions)
6. [Features & Requirements](#6-features--requirements)
7. [Technical Architecture](#7-technical-architecture)
8. [Database Schema](#8-database-schema)
9. [API Design](#9-api-design)
10. [UI/UX Requirements](#10-uiux-requirements)
11. [Non-Functional Requirements](#11-non-functional-requirements)
12. [Timeline & Milestones](#12-timeline--milestones)
13. [Open Questions](#13-open-questions)
14. [Appendix](#14-appendix)

---

## 1. Overview

**Smart Konstruksi** adalah platform manajemen proyek konstruksi digital yang mendukung siklus penuh proyek konstruksi — dari lead intake hingga warranty & maintenance. Platform ini dikembangkan oleh PT. Kita Satu Intersolusi (KSI) sebagai bagian dari program Golden Ticket Pasca PKL.

### Key Facts

| Attribute | Value |
|-----------|-------|
| **Client** | PT. Kita Satu Intersolusi (KSI) |
| **Developer** | Allif Alfikri (Full-Stack) |
| **Contract Period** | 4 bulan (2 Juni — 3 Oktober 2026) |
| **MVP Approach** | Demo-First (validasi market sebelum production) |
| **Target Users** | 16 roles (internal KSI + external stakeholders, +Finance) |
| **Order Value Range** | Rp 50 juta — 5 miliar+ |

### Unique Value Proposition

> "Bangun dengan Transparan, Kelola dengan Percaya Diri — Build Smarter. Manage Better."

**4 Pilar Pembeda:**
1. **Transparansi Real-time** — Client bisa lihat progres kapan saja
2. **Dokumentasi & Audit Trail** — Semua tercatat (foto, RAB, invoice, approval log)
3. **Kurasi Vendor** — Vendor terseleksi & terverifikasi, bukan marketplace liar
4. **Potensi Integrasi Smarthome** — Pasca-handover, gedung bisa di-monitor via IoT (roadmap)

---

## 2. Problem Statement

Perusahaan konstruksi menghadapi masalah:

- **Visibility rendah** — Sulit memonitor progres proyek secara real-time
- **Anggaran manual** — Pengelolaan RAB masih pakai Excel
- **Approval lambat** — Proses approval tidak terdokumentasi
- **Komunikasi buruk** — Antara client, kontraktor, arsitek, dan tim lapangan
- **Vendor management** — Kesulitan mencari vendor terpercaya
- **Reporting manual** — Laporan proyek dibuat secara manual

---

## 3. Goals & Objectives

### Primary Goals
1. **Validasi market** — Demo produk ke calon client & stakeholder
2. **Transparansi progres** — Client bisa monitor tanpa visit lapangan
3. **Efisiensi operasional** — Satu platform untuk semua kebutuhan proyek
4. **Audit trail lengkap** — Semua aktivitas tercatat dan bisa di-audit

### Success Metrics
- 2-3 user flow lengkap bisa di-demo dari login → action → hasil
- Visual polish & professional appearance
- Mock data yang masuk akal (bukan placeholder)
- Responsive — desktop & mobile (B2B client buka di HP juga)

---

## 4. Scope

### MVP Scope — 2 Modul Inti

#### Modul 1: Project Management Dashboard
**Target User:** Admin, PM, Owner  
**Features:**
- List proyek dengan filter (status, branch, PIC, tanggal)
- Detail proyek: timeline, budget tracker, milestone progress
- Quick stats: total proyek aktif, total revenue, % on-time delivery
- Recent activity feed
- Notifikasi alert (proyek delay, budget over)
- Charts: progress bar, line chart, donut chart

#### Modul 2: Client Portal + Progress Reporting
**Target User:** Client (read-only) + PM/Mandor (input)  
**Features:**
- Project detail page (client view) — read-only
- Milestone timeline dengan status visual
- Daily/weekly progress report (foto, deskripsi, % progress)
- Document list (kontrak, BAST, invoice, gambar teknis)
- "Request change / submit feedback" button

### Modul Pendukung (Schema Ready, UI Minimal)
- User & role management (Super Admin, Owner)
- Branch management
- RAB builder (template + input)
- Vendor directory (list + KYC flag)
- Invoice generator (template + numbering)
- Warranty ticket (list + form minimal)

---

## 5. User Roles & Permissions

### Role Hierarchy (16 Roles — Updated from Analyst Workflow)

| Tier | Role | Scope | MVP Status |
|------|------|-------|------------|
| T1 | Super Admin | Global | Active |
| T2 | Owner / Direktur | Global | Active |
| T3 | Branch Manager | Branch | Active |
| T4 | Project Manager | Project | Active |
| T5 | Estimator | Branch/Project | Schema-ready |
| T6 | Mandor / Site Leader | Project | Active |
| T7 | Admin Kantor | Branch | Active |
| T8 | Arsitek | Branch/Project | Active |
| T9 | QC Inspector | Branch/Project | Schema-ready |
| T10 | K3 Officer | Branch/Project | Schema-ready |
| T11 | Interior Designer | Branch/Project | Active |
| T12 | Konsultan | Branch/Project | Active |
| T13 | Finance | Branch | Schema-ready |
| E1 | Client | Project (read-mostly) | Active |
| E2 | Vendor / Supplier | Task-scoped | Active |
| — | Kuli / Tukang | — | No account (mandor proxy) |

### Permission Matrix (Updated from Analyst Workflow)

| Permission | Owner | BrMgr | PM | Mandor | Admin | Finance | Arsitek | Client | Vendor |
|------------|-------|-------|-----|--------|-------|---------|---------|--------|--------|
| Lihat semua proyek | ✔ Global | Branch | Project | Project | Branch | Branch | Assigned | Own | — |
| Membuat proyek | ✔ | ✔ | ✔ | — | — | — | — | — | — |
| Edit detail proyek | ✔ | ✔ | ✔ | — | — | — | View | — | — |
| Membuat RAB | ✔ | ✔ | ✔ | — | ✔ | — | Konsultasi | View | — |
| Upload desain | — | — | Review | — | — | — | ✔ | View | — |
| Approval desain | — | ✔ (RAB+Desain) | ✔ | — | — | — | — | ✔ | — |
| Daily report | View | View | Review | Submit | View | — | View | View | — |
| QC Inspection | View | View | Review | Perbaikan | — | — | — | View | — |
| Safety Audit | View | View | Review | Follow-up | — | — | — | View | — |
| Generate invoice | ✔ | ✔ | — | — | ✔ | Verify | — | View | — |
| Verifikasi Pembayaran | — | — | — | — | — | ✔ | — | — | — |
| Kelola Biaya Warranty | — | — | — | — | — | ✔ | — | — | — |
| Manage user (branch) | ✔ | ✔ | — | — | — | — | — | — | — |

### Approval Thresholds (Updated from Analyst Workflow)

| Activity | Threshold | Approver |
|----------|-----------|----------|
| Approval RAB & Desain | Semua RAB | Branch Manager ✅ |
| Approval Deal | Nominal tertentu | Branch Manager ✅ |
| Approval Deal | Nominal besar | Owner/Direktur ✅ |
| Purchase Order | Material | Admin Kantor (buat PO) |
| Invoice | Semua | Admin Kantor (buat) + Finance (verify) |
| Verifikasi Pembayaran | Semua | Finance ✅ |
| Rekonsiliasi | Semua | Finance ✅ |
| BAST (handover) | Semua | PM + Client ✅ |
| Tiket Warranty | Semua | Admin (input) + Finance (biaya) |

> **Note:** Workflow dari analis lebih detail — Branch Manager approve RAB & Desain di stage Estimate, approve Deal di Quotation. Owner approve hanya untuk nominal besar.

---

## 6. Features & Requirements (Updated from Analyst Workflow)

### 6.1 Authentication & Authorization
- **NextAuth.js** with Credentials provider
- Role-based access control (RBAC) per route
- Middleware guard on API routes
- Session management built-in

### 6.2 Project Management
- **CRUD Projects** — Create, read, update, archive
- **Project Status Flow:** PLANNING → IN_PROGRESS → ON_HOLD → COMPLETED / CANCELLED
- **Budget Tracker** — Visualisasi budget vs actual
- **Milestone Management** — Timeline dengan progress percentage
- **Activity Feed** — Recent activities per project

### 6.3 Material Management
- **Material Tracking** — ORDERED → SHIPPED → DELIVERED → INSTALLED
- **Budget Impact** — Auto-update remaining budget
- **Supplier Management** — Basic supplier info

### 6.4 Progress Reporting
- **Daily Report** — Mandor submit dari mobile
- **Photo Upload** — Progress photos dengan GPS auto-capture
- **Percentage Input** — Visual progress bar
- **Weather Tracking** — Opsional (cerah, hujan, mendung)
- **PM Review** — Approve/reject report

### 6.5 Task Management
- **Task CRUD** — Create, assign, track status
- **Status Flow:** TODO → IN_PROGRESS → REVIEW → DONE / BLOCKED
- **Priority Levels:** LOW, MEDIUM, HIGH, URGENT
- **Due Date Tracking** — Visual timeline

### 6.6 File Management
- **Upload** — Documents, photos, technical drawings
- **Storage** — Vercel Blob / S3
- **Categorization** — Per project, per report
- **Download** — Access controlled by role

### 6.7 Invoice & Payment
- **Invoice Generation** — Manual + template
- **Payment Tracking** — Upload bukti transfer
- **Status Flow:** DRAFT → SENT → PAID → OVERDUE
- **Notification** — Alert untuk invoice overdue

### 6.8 Notifications
- **In-app** — SSE/Pusher free tier
- **Email Digest** — Resend/SendGrid free tier
- **WhatsApp** — Post-MVP (Fonnte/Wablas/Twilio)

### 6.9 Client Portal
- **Read-only Access** — Client bisa lihat progres
- **Feedback Mechanism** — Request change / submit feedback
- **Document Access** — View relevant documents

### 6.10 Dashboard & Analytics
- **Chart Dashboard** — Recharts
- **PDF Export** — @react-pdf/renderer
- **Quick Stats** — Revenue, on-time delivery, active projects

### 6.11 Finance Module (New from Analyst)
- **Payment Verification** — Finance verify bukti transfer
- **Rekonsiliasi** — Match payment dengan invoice
- **Warranty Cost Management** — Track biaya warranty & maintenance
- **Financial Reports** — Laporan keuangan per proyek
- **Status:** Schema-ready (T13 Finance role), UI minimal di MVP
---

## 7. Technical Architecture

### Stack (Locked)

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Frontend** | Next.js (App Router) + JavaScript | SEO-friendly, enterprise ecosystem |
| **Mobile** | Mobile-first responsive web (PWA) | Mandor pasti update dari HP |
| **Backend** | Next.js API Routes (internal) | Zero extra infra, same deploy |
| **Auth** | NextAuth.js (Credentials + OAuth) | Native integration |
| **ORM** | Prisma | Type-safe, migration management |
| **Database** | PostgreSQL | Transaksional, JSONB flexible |
| **Storage** | Vercel Blob / S3 | File uploads |
| **Realtime** | SSE / Pusher free tier | Zero cost |
| **UI** | shadcn/ui + Tailwind CSS v4 | Customizable, accessible |
| **Charts** | Recharts | Visual progress |
| **PDF** | @react-pdf/renderer | PM presentation |
| **Deployment** | Vercel | Scalable, Next.js native |
| **CI/CD** | GitHub Actions | Standard |

### Architecture Diagram

```
CLIENTS
├── Web Admin (Next.js — desktop)
├── Web Client (Next.js — desktop & mobile)
└── Mobile Mandor (PWA — responsive web)
        │
        ▼
NEXT.JS APPLICATION
├── Frontend (App Router + React Server Components)
├── API Routes (/app/api/*)
│   ├── Auth (NextAuth)
│   ├── REST endpoints (CRUD per module)
│   └── SSE (notifications)
└── Middleware (RBAC guard per route)
        │
        ▼
DATA LAYER
├── PostgreSQL (main DB via Prisma)
├── Vercel Blob / S3 (file storage)
└── Redis (cache + session — opsional MVP)
```

---

## 8. Database Schema (Updated)

### 13 Models (Prisma — +Finance Role)

```prisma
// ENUMS
enum Role {
  SUPER_ADMIN OWNER BRANCH_MANAGER PROJECT_MANAGER
  ESTIMATOR SITE_MANAGER ADMIN_KANTOR ARSITEK
  QC_INSPECTOR K3_OFFICER INTERIOR_DESIGNER KONSULTAN
  FINANCE CLIENT VENDOR HOME_OWNER
}

enum ProjectStatus {
  PLANNING IN_PROGRESS ON_HOLD COMPLETED CANCELLED
}

enum MaterialStatus {
  ORDERED SHIPPED DELIVERED INSTALLED
}

enum TaskStatus {
  TODO IN_PROGRESS REVIEW DONE BLOCKED
}

enum TaskPriority {
  LOW MEDIUM HIGH URGENT
}

enum InvoiceStatus {
  DRAFT SENT PAID OVERDUE
}

// MODELS
model User { ... }
model Branch { ... }
model Project { ... }
model Material { ... }
model ProgressReport { ... }
model Task { ... }
model Attendance { ... }
model File { ... }
model Invoice { ... }
model Payment { ... }
model Notification { ... }
model Comment { ... }
model Message { ... }
```

**Full schema available in:** `Smart_Konstruksi_Final_Draft_Merged_v1.docx` Section 10

---

## 9. API Design

### Endpoint Structure (25-30 Routes)

```
/api/auth/[...nextauth]     # Authentication
/api/projects               # CRUD Projects
/api/materials              # CRUD Materials
/api/progress               # Progress Reports
/api/tasks                  # Task Management
/api/attendance             # Attendance
/api/files                  # File Management
/api/invoices               # Invoice Management
/api/notifications          # Notifications
/api/upload                 # File Upload
/api/users                  # User Management
/api/branches               # Branch Management
/api/vendors                # Vendor Directory
```

### Page Routes

```
/(auth)/login
/(auth)/register
/(dashboard)/layout
/(dashboard)/page                           # /dashboard
/(dashboard)/projects/page                  # List projects
/(dashboard)/projects/new                   # Create project
/(dashboard)/projects/[id]/page             # Detail project
/(dashboard)/projects/[id]/materials        # Tab material
/(dashboard)/projects/[id]/progress         # Tab progress
/(dashboard)/projects/[id]/tasks            # Tab tasks
/(dashboard)/projects/[id]/attendance       # Tab attendance
/(dashboard)/projects/[id]/files            # Tab files
/(dashboard)/projects/[id]/invoice          # Tab invoice
/(dashboard)/leads
/(dashboard)/rab
/(dashboard)/procurement
/(dashboard)/qc
/(dashboard)/documents
/(dashboard)/invoices
/(dashboard)/users                          # Admin only
/(dashboard)/branches                       # Admin only
/(dashboard)/vendors
/(dashboard)/settings
```

---

## 10. UI/UX Requirements

### Design System
- **Component Library:** shadcn/ui
- **Styling:** Tailwind CSS v4
- **Responsive:** Mobile-first (minimum 44px tap targets)
- **PWA:** Add to Home Screen + offline cache (opsional)

### Key Pages
1. **Login** — Clean, minimal, email + password
2. **Dashboard Overview** — Charts, quick stats, activity feed
3. **Project List** — Cards with filter, search, sort
4. **Project Detail** — Tabbed interface (Material, Progress, Tasks, etc.)
5. **Client Portal** — Read-only with timeline visualization
6. **Mobile Mandor** — Simplified for field use

### Visual Requirements
- Color-coded status (PLANNING=blue, IN_PROGRESS=yellow, COMPLETED=green)
- Progress bars and donut charts
- Photo galleries for progress reports
- Clean card-based layouts
- Professional appearance (bukan prototype)

---

## 11. Non-Functional Requirements

### Performance
- Page load < 3 seconds
- API response < 500ms
- Image optimization (Next.js Image component)

### Security
- Password hashing (bcrypt)
- Role-based middleware guard
- CSRF protection (NextAuth built-in)
- Input validation on all forms

### Scalability
- Database indexed on common queries
- Pagination for lists
- Image lazy loading

### Usability
- Mobile-responsive (mandor PWA)
- Keyboard accessible
- Loading states on all async operations
- Error boundaries with user-friendly messages

---

## 12. Timeline & Milestones

### 16-Week Schedule

| Week | Focus | Milestone |
|------|-------|-----------|
| W1-2 | Setup project + auth + DB + design system | ✅ Project scaffolded |
| W3-4 | User management + Project CRUD + basic dashboard | ✅ Core CRUD working |
| W5-6 | Material management + progress report + file upload | ✅ Field features |
| W7-8 | Task management + attendance | ✅ Task system |
| W9-10 | Invoice + reporting + chart | ✅ Financial module |
| W11-12 | Polish, notifikasi, testing, dokumentasi | ✅ Beta ready |
| W13-14 | UAT + bug fix + launch prep | ✅ Demo ready |
| W15-16 | Buffer + training user | ✅ Handover |

### Key Deliverables
- **End of W4:** Login → Project List → Dashboard working
- **End of W8:** Full project detail with material & progress
- **End of W12:** Complete demo with invoice & charts
- **End of W14:** UAT sign-off from KSI

---

## 13. Decisions & Open Questions

### Resolved ✅ (29 June 2026)

| # | Question | Decision | Status |
|---|----------|----------|--------|
| 1 | Brand guideline | Pakai default: green #22C55E, dark #080C14, Inter + JetBrains Mono | ✅ |
| 2 | Threshold approval | Default dari workflow analis (BM approve RAB, Owner approve Deal besar) | ✅ |
| 3 | Payment gateway | Paylabs (last priority, post-MVP) | ✅ |
| 4 | Multi-termin invoice | Single-termin MVP, extend later | ✅ |
| 5 | Target demo | Live click-through (primary) + video backup | ✅ |
| 6 | Active branches | 1 branch MVP (KSI Pusat), schema ready multi | ✅ |
| 7 | Data analis | ✅ Sudah diterima — workflow 13 stage + 16 role | ✅ |

### Masih Pending dari KSI

| # | Question | Impact | Status |
|---|----------|--------|--------|
| 1 | Brand guideline final (logo, font variant) | UI polish | ⏳ |
| 2 | Detail workflow tambahan dari analis | Schema refinement | ⏳ |
| 3 | Target demo audience spesifik | Presentation style | ⏳ |

### Summary
- Tech stack locked
- 13 model schema final (+Finance)
- 16 roles with permissions
- 13-stage workflow (dari 12, tambah Procurement)
- 2 MVP modules defined
- Feature recommendations (A1-E3)
- 16-week timeline with buffer
- Workflow detail dari analis sudah ter-integrasi

---

## 14. Appendix

### Glossary

| Term | Definition |
|------|------------|
| BAST | Berita Acara Serah Terima |
| RAB | Rencana Anggaran Biaya |
| QC | Quality Control |
| K3 | Keselamatan dan Kesehatan Kerja |
| PO | Purchase Order |
| PM | Project Manager |
| B2B | Business-to-Business |
| B2C | Business-to-Consumer |
| MVP | Minimum Viable Product |
| PKL | Praktik Kerja Lapangan |
| KSI | Kita Satu Intersolusi |
| PWA | Progressive Web App |
| SSE | Server-Sent Events |

### Workflow Detail (from Analyst — 13 Stages)

> Source: Foto workflow dari analis KSI (29 Juni 2026)

```
LEAD INTAKE
├── Client: Isi Form Lead / Ajukan Permintaan
├── Admin: Verifikasi Data → Buat Lead
├── Branch Manager: Review Lead → Assign PM
└── PM: Jadwalkan Survey → Koordinasi Tim

SURVEY & ASSESSMENT
├── Arsitek: Survey Kebutuhan Desain
└── PM: Koordinasi Survey

DESIGN & CONCEPT
├── Arsitek: Konsep Desain → Revisi Detail Teknis
├── PM: Review Desain → Koordinasi
└── Estimator: Hitung Volume → Analisa Harga

ESTIMATE (RAB)
├── Estimator: Buat RAB → Estimasi Biaya
├── PM: Negosiasi → Presentasi
└── Branch Manager: ✅ Approve RAB & Desain

QUOTATION & DEAL
├── Client: Negosiasi → Persetujuan
├── Branch Manager: ✅ Approve Deal (Nominal Tertentu)
├── Owner/Direktur: ✅ Approve Deal (Nominal Besar)
├── Estimator: Finalisasi RAB & Desain
└── Admin: Buat Dokumen Quotation

PLANNING
├── PM: Buat Rencana Kerja → Timeline
├── Admin: Buat PO
└── Mandor: Persiapan Mobilisasi Tim & Material

EXECUTION
├── Mandor: Briefing Harian → Pembagian Tugas
├── Kuli: Melaksanakan Pekerjaan
├── PM: Rencana Material → Monitoring Progress
└── Vendor: Menyediakan Material

PROCUREMENT (Stage Terpisah)
├── Admin: Proses PO → Tracking Delivery
├── Vendor: Konfirmasi Pengiriman
└── Mandor: Konfirmasi Penerimaan Material

QC & SAFETY INSPECTION
├── QC Inspector: Inspeksi → Laporan → Re-Inspeksi
├── K3 Officer: Inspeksi Safety → Laporan → Re-Inspeksi
├── PM: Review Hasil QC & Safety
└── Mandor: Laporan Harian → Perbaikan Temuan

CLIENT REVIEW
├── Client: Melihat Progress → Feedback
└── PM: Tanggapi Feedback

HANDOVER (BAST)
├── Client: Terima & Tandatangani BAST
├── PM: Persiapan Serah Terima
└── Mandor: Pekerjaan Selesai → Penyerahan BAST

INVOICE & PAYMENT
├── Admin: Buat Invoice
├── Client: Melakukan Pembayaran
├── Finance: ✅ Verifikasi Pembayaran → Rekonsiliasi
├── PM: Monitoring Pembayaran
└── Finance: Laporan Keuangan Proyek

WARRANTY & MAINTENANCE
├── Client: Buat Tiket Warranty
├── Admin: Input Tiket Warranty
├── Finance: Kelola Biaya Warranty
└── Mandor: Kerjakan Perbaikan
```

### References
- Smart Konstruksi Final Draft Merged v1.0 (28 June 2026)
- Smart Konstruksi Ringkasan Brainstorm Sesi 1-2 (22 June 2026)
- Smart Konstruksi Draft Analisis (18 June 2026)

---

**Document Version History**

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 29 June 2026 | Initial PRD based on merged draft |
| 1.1 | 29 June 2026 | Updated: +Finance role (T13), 13-stage workflow, analyst workflow integrated, decisions resolved |
