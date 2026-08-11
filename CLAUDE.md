@AGENTS.md

# Smart Konstruksi — Project Context

Next.js 16 (App Router) + Prisma (PostgreSQL) + Auth.js v5 + shadcn/ui + Tailwind.
Construction management ERP (PT. Kita Satu Intersolusi). Work on branch `dev`.

## UI Language & Format Rules
- ALL UI text in the app = ENGLISH (buttons, labels, empty states, toasts). Never write Indonesian UI strings.
- Date display format = id-ID (e.g. "Senin, 10 Agustus 2026").
- Currency = Rupiah, formatted "Rp 1.500.000".

## Design System — import tokens from `@/lib/design-tokens`, NEVER hardcode colors

```ts
import { T, FONT_DISPLAY, FONT_BODY, FONT_LABEL, SPACING, RADIUS, SHADOWS } from "@/lib/design-tokens";
```

| Token | Value | Use |
|---|---|---|
| `T.primary` | `#004f35` | Brand green — primary buttons, active states |
| `T.primaryHover` | `#003d29` | Primary hover |
| `T.onSurface` | `#0b1c30` | Headings / primary text |
| `T.onSurfaceMuted` | `#6f7a72` | Secondary text |
| `T.surfaceCard` | `#ffffff` | Cards |
| `T.surfaceContainerLow` | `#eff4ff` | Hover / subtle fills |
| `T.success` / `T.warning` / `T.error` / `T.info` | `#15803d` / `#b45309` / `#ba1a1a` / `#2563eb` | Status |

- Fonts: `FONT_DISPLAY` = Hanken Grotesk (headings), `FONT_BODY` = Inter (body), `FONT_LABEL` = Geist mono (labels/tables/buttons).
- Cards: 16px radius, `SHADOWS.card`; elevated `SHADOWS.elevated`; modal `SHADOWS.modal`; dropdown `SHADOWS.dropdown`.
- Icons: Material Symbols font ligatures (`more_vert`, `edit`, `delete`, `add`, `search`...).

## Component Rules (NON-NEGOTIABLE)
- Table row actions MUST be a kebab menu (`more_vert` icon → dropdown). NEVER inline Edit/Delete buttons.
  - Dropdown: white bg, 1px border, radius 12px, shadow `0 8px 24px`; fixed overlay z-50 closes on outside click.
  - Hover: `#f8fafc` (edit), `#fef2f2` (delete); delete icon/text uses `T.error`.
  - Disabled state: opacity 0.5, cursor not-allowed.
- Modal stacking: sidebar z-60, backdrop z-100, modal z-101.
- Every new page must visually match existing pages (`app/dashboard/*/page.tsx`): same spacing, tokens, card layout.

## Architecture Rules
- API routes: wrap with `lib/api/with-auth.ts` + permission checks from `lib/rbac/permissions.ts`.
- RBAC route access lives in FOUR places — sync ALL when adding a route:
  1. `components/layout/sidebar.jsx`
  2. `middleware.ts` (ROLE_ACCESS map)
  3. `lib/rbac/config.ts`
  4. `lib/rbac/permissions.ts`
- Prisma workflow: `prisma db push` (NOT `prisma migrate dev`). Check `prisma migrate status` if unsure.
- API update semantics: PUT, not PATCH.
- Root `/` is currently a redirect (middleware sends anonymous users to /login). Public pages are only those in `PUBLIC_ROUTES` in `middleware.ts`.

## Backend Notes
- `trustHost: true` in `lib/auth-config.ts` is INTENTIONAL (production tunnel) — never remove.
- Rate limiting: middleware (`lib/rate-limiter`), login + `/api/`.

## Git Workflow
- Develop on `dev`. Merge to `main` ONLY on explicit user instruction.
- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`.
- Before committing: lint + `tsc --noEmit` + `next build` must pass.
