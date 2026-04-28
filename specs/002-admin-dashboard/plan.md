# Implementation Plan: Admin Dashboard

**Branch**: `002-admin-dashboard` (working on `main`) | **Date**: 2026-04-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/002-admin-dashboard/spec.md` (with [4 clarifications](./spec.md#clarifications) recorded 2026-04-27)

## Summary

Stand up the Alatar Admin Dashboard's six pages — **Products & Categories management, Order Requests inbox, Contact Leads inbox, Social Links manager, Overview, Settings** — inside the existing Angular 21 SPA's `admin/` folder. The work consumes the existing .NET backend (now wired to LocalDB locally), reuses the foundational layer built in Spec 001 (`core/i18n/`, `shared/ui/`, `shared/format/`), reuses the already-installed `admin/layout/` primitives, and layers per-section signal-based stores plus a small set of admin-only UX primitives (confirm dialog, side drawer, toast host, status workflow control, drag-drop list, KPI tile, data table) on top.

The plan favors *composition over abstraction*: each section is a thin page component composing existing primitives + a per-section store; cross-cutting concerns (optimistic updates with rollback, toasts, confirmations, "iterative fetch until older" for KPIs) are encoded as small, single-purpose helpers — not a framework. The architecture is shaped to satisfy the spec's future-readiness constraints (FR-061..064): adding a new admin section, a new column, a new status, or a new detail-view section is additive, not a rewrite.

## Technical Context

**Language/Version**: TypeScript 5.9, Angular 21.1 (zoneless change detection, standalone components, signals + `computed` + `effect`, SSR with hydration + event replay).

**Primary Dependencies (already in the project, reused as-is)**:

- `@angular/router` (lazy-loaded admin children, route resolvers)
- `@angular/forms` (typed reactive forms for product create/edit, category form, social-link form)
- `@angular/common/http` with fetch + interceptors (`authInterceptor`, `authErrorInterceptor` — already wired and they handle 401 redirect to login)
- `@jsverse/transloco` (i18n, AR default; bilingual text via `LocalizedTextPipe` from Spec 001)
- `tailwindcss` 3.4 (existing brand palette)
- `rxjs` 7.8 (used sparingly; signals are the preferred reactive primitive)
- `swiper` 12 (already a dependency — candidate for product image gallery on edit page)

**No new dependencies will be added by this feature.** Drag-drop, modals, dialogs, and toasts are implemented in-house with native DOM APIs + signals (see [research.md](./research.md) §3, §4, §5).

**Storage**: N/A on the frontend. State is in-memory signals; URL holds list filter + pagination state per section.

**Testing**: `vitest` 4 (already in devDependencies; Spec 001 deferred tests, this spec continues that posture). Plan: unit tests for the optimistic-update helper, the iterative-fetch KPI helper, the URL ↔ filter-state round-trip in each list store, and the typed reactive form validators. Component tests deferred. Manual smoke checks per quickstart.md remain the primary verification.

**Target Platform**: Modern desktop browsers (Chromium, Safari, Firefox). Dashboard is desktop-first per spec; mobile must remain usable but is not the primary surface. SSR is *not* applied to admin routes (admin pages are auth-gated and benefit from no pre-render). Current app config has SSR globally enabled — admin routes will simply render client-side after the auth guard runs.

**Project Type**: Web application (frontend SPA + existing .NET backend at `alatar-dotnet/`).

**Performance Goals**:

- Click "Sign in" → populated Overview KPI tiles ≤ 5s on a typical office network (SC-006).
- Status transition optimistic update commits in ≤ 1s on a typical office network (SC-002).
- Product list filter/search interaction ≤ 1s perceived latency.
- Pagination through 1000+ orders without dropped frames (SC-004).

**Constraints**:

- Backend is fixed; the dashboard adapts to whatever shape `/api/products`, `/api/categories`, `/api/order-requests`, `/api/contacts`, `/api/social-links`, `/api/auth/*` return today (see [contracts/](./contracts/)).
- Reuse `admin/layout/*`, Spec 001 `shared/ui/*`, Spec 001 `core/i18n/*`. Do NOT introduce a parallel layout or design-token system.
- No new third-party libraries (no `@angular/cdk`, no `@angular/material`, no toast library, no drag-drop library, no modal library).
- SSR-safe code in components that *might* render server-side (none of the admin pages do, but cross-cutting helpers may); guard `localStorage`/`window`/`document` with `isPlatformBrowser`.
- Bilingual EN/AR with full RTL/LTR.
- StyleSeed *rules* (layout, spacing, typography contexts, ≥44×44 touch targets, ≤8% card shadow, single accent) applied on top of existing Tailwind v3 + brand palette.

**Scale/Scope**: Six admin pages plus product create/edit pages (so eight routes). Catalog scaling to ~500 products and lead lists scaling to ~1000+ rows must remain healthy (per SC-004).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The project's constitution at `.specify/memory/constitution.md` remains the unfilled template. There are no ratified principles to gate against.

**Resolution**: this feature proceeds without a constitution-derived gate, same as Spec 001. The [requirements quality checklist](./checklists/requirements.md), the four [recorded clarifications](./spec.md#clarifications), and the StyleSeed Golden Rules in `.claude/CLAUDE.md` serve as the de-facto gate.

**Initial gate status**: PASS.
**Post-design re-evaluation**: see bottom of this file.

## Project Structure

### Documentation (this feature)

```text
specs/002-admin-dashboard/
├── plan.md              # This file (/speckit-plan output)
├── spec.md              # Feature specification (/speckit-specify + /speckit-clarify)
├── research.md          # Phase 0 — decisions and rationale
├── data-model.md        # Phase 1 — frontend view models, form models, URL state, optimistic ops
├── quickstart.md        # Phase 1 — how to run, verify, and demo the feature
├── contracts/           # Phase 1 — observed shapes of the backend endpoints we consume
│   ├── auth.api.md
│   ├── products.api.md
│   ├── categories.api.md
│   ├── order-requests.api.md
│   ├── contacts.api.md
│   └── social-links.api.md
├── checklists/
│   └── requirements.md  # Spec quality checklist (already complete)
└── tasks.md             # Phase 2 output — produced by /speckit-tasks (NOT this command)
```

### Source Code (repository root)

The Angular SPA already has the admin shell, layout primitives, routing, auth, and core services. This plan adds **per-section stores**, **page reworks** (replacing the current 37-line placeholders with real UI), **product create/edit pages** (new routes), and a small **admin-shared UX primitives layer** (confirm dialog, side drawer, toast host, status workflow control, drag-drop list, data table, KPI tile).

```text
alatar-angular/
├── src/app/
│   │
│   ├── admin/
│   │   ├── admin.routes.ts                       # EXISTING — extend with new product create/edit routes
│   │   ├── shell/                                # EXISTING — keep
│   │   ├── layout/                               # EXISTING — keep, reuse heavily
│   │   ├── navigation/                           # EXISTING — keep
│   │   │
│   │   ├── shared/                               # NEW — admin-only shared concerns
│   │   │   ├── stores/
│   │   │   │   ├── optimistic.helper.ts          # NEW — `optimistic<T>(...)` pattern
│   │   │   │   └── iterative-fetch-recent.ts     # NEW — pagination scan stopping at 7-day boundary
│   │   │   ├── status/
│   │   │   │   ├── order-status.workflow.ts      # NEW — centralized order status transitions
│   │   │   │   └── contact-status.workflow.ts    # NEW — centralized contact status transitions
│   │   │   ├── ui/
│   │   │   │   ├── confirm-dialog.component.ts   # NEW — confirmation modal
│   │   │   │   ├── side-drawer.component.ts      # NEW — slide-in panel for orders/contacts detail
│   │   │   │   ├── status-workflow.component.ts  # NEW — action buttons for next/back transitions
│   │   │   │   ├── drag-drop-list.directive.ts   # NEW — HTML5 native drag-drop, signal-based
│   │   │   │   ├── data-table.component.ts       # NEW — column-extensible table with sort/empty
│   │   │   │   ├── kpi-tile.component.ts         # NEW — overview KPI tile
│   │   │   │   └── pagination.component.ts       # NEW — page controls
│   │   │   └── toasts/
│   │   │       ├── toast-host.component.ts       # NEW — toast outlet (mounted in admin-shell)
│   │   │       └── toast.service.ts              # NEW — signal-based toast queue
│   │   │
│   │   └── sections/
│   │       ├── overview/
│   │       │   ├── overview.page.ts              # REWORK from placeholder
│   │       │   ├── overview.page.html
│   │       │   ├── overview.store.ts             # NEW — KPIs + activity feed via iterative-fetch
│   │       │   └── components/
│   │       │       ├── kpi-grid.component.ts
│   │       │       ├── activity-feed.component.ts
│   │       │       └── quick-actions.component.ts
│   │       │
│   │       ├── products/
│   │       │   ├── products.page.ts              # REWORK — list view at /admin/products
│   │       │   ├── products.page.html
│   │       │   ├── product-edit.page.ts          # NEW — /admin/products/new and /:id/edit
│   │       │   ├── product-edit.page.html
│   │       │   ├── admin-catalog.store.ts        # NEW — list state, filters, search, optimistic status
│   │       │   ├── product-edit.store.ts         # NEW — single-product view + image-gallery-editor state
│   │       │   ├── categories.store.ts           # NEW — categories list + CRUD
│   │       │   └── components/
│   │       │       ├── products-list-table.component.ts
│   │       │       ├── products-filters.component.ts
│   │       │       ├── product-form.component.ts             # bilingual fields, classification, status
│   │       │       ├── option-groups-editor.component.ts     # 5 groups, bilingual delimiter UX
│   │       │       ├── image-gallery-editor.component.ts     # upload, delete, primary-marker
│   │       │       └── categories-pane.component.ts          # sub-area on the products list page
│   │       │
│   │       ├── orders/
│   │       │   ├── orders.page.ts                # REWORK — list with detail drawer
│   │       │   ├── orders.page.html
│   │       │   ├── orders.store.ts               # NEW — paginated list + optimistic status + soft-delete
│   │       │   └── components/
│   │       │       ├── orders-list-table.component.ts
│   │       │       ├── orders-filters.component.ts
│   │       │       └── order-detail-drawer.component.ts      # uses <admin-side-drawer>
│   │       │
│   │       ├── contacts/
│   │       │   ├── contacts.page.ts              # REWORK — same shape as orders
│   │       │   ├── contacts.page.html
│   │       │   ├── contacts.store.ts             # NEW
│   │       │   └── components/
│   │       │       ├── contacts-list-table.component.ts
│   │       │       ├── contacts-filters.component.ts
│   │       │       └── contact-detail-drawer.component.ts
│   │       │
│   │       ├── social-links/
│   │       │   ├── social-links.page.ts          # REWORK — list + drag-drop reorder + create modal
│   │       │   ├── social-links.page.html
│   │       │   ├── social-links.store.ts         # NEW — optimistic reorder + toggle + custom icon
│   │       │   └── components/
│   │       │       ├── social-link-row.component.ts
│   │       │       ├── social-link-form-dialog.component.ts  # create/edit via <admin-confirm-dialog>-style modal
│   │       │       └── icon-uploader.component.ts
│   │       │
│   │       └── settings/
│   │           ├── settings.page.ts              # REWORK — profile + logout
│   │           └── settings.page.html
│   │
│   ├── core/
│   │   ├── auth/                                 # EXISTING — interceptor + guards already in place
│   │   ├── categories/category.service.ts        # EXISTING (added in Spec 001) — used by admin too
│   │   ├── contacts/contact.service.ts           # EXISTING — admin uses getContacts() + updateStatus + delete
│   │   ├── orders/order-request.service.ts       # EXISTING — admin uses getOrderRequests() + updateStatus + delete
│   │   ├── products/product.service.ts           # EXISTING — admin uses every method (CRUD + images + status)
│   │   ├── social-links/social-link.service.ts   # EXISTING — admin uses getAll() + create/update/delete + toggle + reorder + icon
│   │   └── i18n/                                 # EXISTING (built in Spec 001) — reused
│   │
│   └── shared/
│       ├── ui/                                   # EXISTING (built in Spec 001) — reused as primitives
│       └── format/                               # EXISTING (built in Spec 001) — reused
│
└── public/assets/i18n/{ar,en,ru}.json            # EXISTING — extend with `admin.*` namespace per section
```

**Structure Decision**: Admin work lives entirely under `admin/` to keep the public site (`pages/`) and admin (`admin/`) cleanly separated — adding a new public page never touches admin code, and vice versa. Per-section state lives in a per-section store file (`{section}.store.ts`); shared admin UX primitives live in `admin/shared/ui/`, `admin/shared/stores/`, and `admin/shared/toasts/`. Status workflow definitions are centralized in `admin/shared/status/` so adding a new status is a single-file change. Core services in `core/*` are NOT modified — the dashboard is purely additive on top of them. This honors FR-061 (additive new sections), FR-062 (column-extensible tables via the new `<admin-data-table>`), FR-063 (centralized status workflow definitions), and FR-064 (slot-based detail drawers).

## Complexity Tracking

| Decision | Why kept | Simpler alternative rejected because |
|---|---|---|
| Per-section stores instead of one big admin store | Six sections with non-overlapping concerns (catalog vs. orders inbox vs. social-links reorder vs. KPI scan). One mega-store would force every change to think about every other section. | A monolithic store would make the optimistic-update queue, the URL state, and the request lifecycle bleed across concerns. |
| Custom `optimistic()` helper instead of a state library (NgRx, Akita) | Spec lists exactly three places that need optimistic UI: status transitions, enabled toggle, drag-drop reorder. A 30-line helper covers all three. | NgRx Effects + reducers would 10× the LOC and add a new mental model. |
| Custom `<admin-confirm-dialog>` and `<admin-side-drawer>` instead of `@angular/cdk` overlay | Same reason as Spec 001: no new dependencies. CDK overlay is a 200KB+ pull for one modal pattern. | CDK adds peer-dep maintenance and reshapes how every dialog is authored. |
| HTML5 native drag-drop directive instead of a drag-drop library | Reordering social links is the only drag-drop in scope. Signal-based directive is ~80 LOC. | A drag-drop library would dominate the dependency graph for one feature. |
| Status workflow rendered as **action buttons** (forward) + **kebab menu** (backward) | Hits SC-007's 2-click target for forward moves and keeps backward moves discoverable but de-emphasized. | A dropdown forces 2 clicks for forward (open + select); a stepper takes 3× the space; both lose to a button row. |
| `<admin-data-table>` is column-extensible from a `columns` config (input) | FR-062 requires adding a new column without touching the table. Config-driven columns deliver this in one place. | Custom `<th>`/`<td>` per page would force every list to be edited when a column is added. |
| KPI iterative-fetch helper is a small async generator with a 5-page ceiling | Per Q2 clarification: bounded scan. Async generator yields pages until predicate stops it. ~25 LOC. | Looping with manual state machine in each KPI tile would duplicate the predicate logic. |
| Settings page is barely-there (FR-059, FR-060 only) | Spec deliberately marked it P6 / lowest. Profile + logout is two cards and a button. | Inflating Settings now would slow down US1–US3 delivery for no daily-use value. |

## Post-Design Re-Evaluation (after Phase 1)

- **Constitution Check**: still PASS — no principles defined to violate.
- **Spec drift?**: no FR was loosened. Three were *narrowed* by research/design:
  - FR-021 option group editor uses the `"<EN> | <AR>"` delimiter convention; existing single-language strings remain renderable (per Q4 clarification).
  - FR-053 KPI tiles use a 5-page-ceiling iterative scan with `+more` indicator (per Q2 clarification).
  - FR-019/020 product create/edit are full-page routes at `/admin/products/new` and `/admin/products/:id/edit` (per Q3 clarification).
- **Complexity introduced?**: only the items in the table above, each justified by an FR.
- **Future-readiness audit**:
  - **Adding a new admin section** (e.g., Reports) → add a route + page module under `admin/sections/reports/`; sidebar config picks it up; nothing in existing sections changes. ✓ FR-061, SC-010.
  - **Adding a new column** to orders / contacts / products list → add an entry to that section's `columns` config; `<admin-data-table>` renders it. ✓ FR-062.
  - **Adding a new status** to orders or contacts → add the entry to the centralized `statusWorkflow` config; `<admin-status-workflow>` and the status pill render it. No per-page changes. ✓ FR-063, SC-011.
  - **Adding a new section to the order/contact detail drawer** (e.g., activity timeline, sales-rep assignment) → add a new component slot in the drawer; existing sections unaffected. ✓ FR-064.
  - **Multi-user / role-based access** later → auth interceptor and guards already exist; sidebar config and route guards take a `roles?: string[]` field today (no-op until used). ✓ Forward-compatible.
- **Optimistic-update audit**: every place that uses `optimistic()` defines its rollback explicitly. Failure → rollback → toast. No silent inconsistencies.

**Result**: Phase 1 design holds. Ready for `/speckit-tasks`.
