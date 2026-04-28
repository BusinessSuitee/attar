# Implementation Plan: Public Products Catalog — "Field to Frame"

**Branch**: `main` | **Date**: 2026-04-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/003-public-products-catalog/spec.md` (P1+P2 scope; FR-024..028 / grades page deferred)

## Summary

Rework the public `/products` catalog page, the `/products/:id` detail page, and add a new `/seasons` season-calendar page for Alatar Sons — an Egyptian agricultural export company whose audience is international B2B buyers and local B2C visitors. The three pages share a single design language: white background, product-photography-first mosaic layout, bilingual EN+AR with full RTL, and a brand-green `#0fbd66` accent.

All three pages consume the **existing** `GET /api/products` and `GET /api/categories` endpoints (no backend changes). State is managed by a new `PublicCatalogStore` (signal-based, computed slices) that wraps the existing `ProductsStore`. Client-side "load more" slices the already-cached signal in batches of 12. Season availability is a frontend constant map (D-003). The gallery reuses `swiper` 12 already in `package.json` (D-005). No new third-party dependencies.

## Technical Context

**Language/Version**: TypeScript 5.9, Angular 21.1 (zoneless, standalone components, signals + `computed` + `effect`, SSR with hydration + event replay).

**Primary Dependencies (already in the project, reused as-is)**:

- `@angular/router` — query-param ↔ filter-state sync (`CatalogFilterState`), navigate to `/contact?crop=`
- `@angular/common/http` — ProductsStore, CategoryService (no new HTTP calls required)
- `@jsverse/transloco` — i18n (EN/AR/RU), `TranslocoDirective`, new `products_v2.*` namespace
- `tailwindcss` 3.4 — existing brand palette, CSS Grid mosaic pattern, scroll-snap category lanes
- `swiper` 12 — product-detail gallery (touch swipe, keyboard, RTL, loop) — already installed
- `rxjs` 7.8 — used sparingly; signals are the preferred reactive primitive

**No new dependencies will be added by this feature.** Category lane scroll uses `overflow-x: auto; scroll-snap-type: x mandatory`. The seasons popover uses native `<dialog>` with `getBoundingClientRect()` positioning (D-008). The mosaic grid uses `CSS Grid auto-flow: dense` + `grid-column: span 2` (D-001).

**Storage**: N/A on the frontend. State is in-memory signals; `?category`, `?season`, `?availability` URL params hold catalog filter state.

**Testing**: `vitest` 4 (already in devDependencies). Plan: unit tests for `season-calendar.utils.ts` (SEASON_MONTHS boundary checks, `isInSeasonNow`, `getCategoryAccent`), `PublicCatalogStore` computed slices (filter + page slice), and the URL ↔ `CatalogFilterState` round-trip. Component tests deferred. Manual smoke checks per [quickstart.md](./quickstart.md) remain the primary verification for visual correctness.

**Target Platform**: All modern browsers (Chromium, Safari, Firefox, mobile). Public pages are mobile-first per spec — 2-col card grid on mobile, 3-col tablet, 4-col desktop mosaic. SSR is **required** for all three pages (public-facing, SEO-critical) — guard any `window`/`document`/`new Date()` calls with `isPlatformBrowser` / `afterNextRender` (D-012).

**Project Type**: Web application — frontend Angular SPA at `alatar-angular/`, backend .NET at `alatar-dotnet/` (backend unchanged by this feature).

**Performance Goals**:
- `/products` full paint with product grid ≤ 3s on a typical 4G connection (SC-001 proxy: CLS < 0.1).
- Filter interaction (category click, pill click) — visual update ≤ 200ms perceived (client-side, no HTTP).
- "Load more" appends next 12 cards ≤ 100ms (client-side slice).
- `/seasons` calendar grid renders all products × 12 months without layout thrash.

**Constraints**:
- Backend is fixed: no new endpoints, no new fields. All catalog/detail/season data derived from existing `ProductListItem` shape.
- Reuse existing `ProductsStore` and `CategoryService`. The new `PublicCatalogStore` is a thin computed layer on top.
- No new third-party libraries (no carousel, no calendar, no layout library).
- Bilingual EN/AR with full RTL. `[dir]` is set on `<html>` by `TranslocoService` lang switch. CSS uses `margin-inline-start` / `padding-inline-start` where directionality matters.
- All interactive elements ≥ 44×44px touch target (StyleSeed Golden Rule 8).
- White (#FFFFFF) background strictly — no colored page backgrounds (StyleSeed Golden Rule 1).

**Scale/Scope**: Three public pages. The products store already holds the full product list (~50–500 products) in one cached HTTP call. Filter and load-more are pure in-memory operations.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The project's constitution at `.specify/memory/constitution.md` remains the unfilled template. There are no ratified principles to gate against.

**Resolution**: this feature proceeds without a constitution-derived gate, same as Spec 001 and Spec 002. The [requirements quality checklist](./checklists/requirements.md) and StyleSeed Golden Rules in `.claude/CLAUDE.md` serve as the de-facto gate.

**Initial gate status**: PASS.
**Post-design re-evaluation**: see bottom of this file.

## Project Structure

### Documentation (this feature)

```text
specs/003-public-products-catalog/
├── plan.md              # This file (/speckit-plan output)
├── spec.md              # Feature specification (/speckit-specify)
├── research.md          # Phase 0 — 13 architectural decisions (D-001..D-013)
├── data-model.md        # Phase 1 — view models, store design, i18n keys
├── quickstart.md        # Phase 1 — 15 smoke tests covering all 3 pages + RTL + SSR
├── contracts/
│   └── products.api.md  # Phase 1 — GET /api/products + GET /api/categories shapes
├── checklists/
│   └── requirements.md  # Spec quality checklist (12/13 pass; 1 deferred: grades data)
└── tasks.md             # Phase 2 output — produced by /speckit-tasks (NOT this command)
```

### Source Code (repository root)

The Angular SPA already has `pages/products/products.page.ts` and `pages/products/product-detail/product-detail.page.ts` with existing (legacy modal-based) UX. This plan replaces those page components, adds a `PublicCatalogStore`, adds a `season-calendar.utils.ts` utility, adds a `/seasons` page, and extends the contact page with `?crop=` pre-fill. Admin code is **not touched**.

```text
alatar-angular/
├── src/app/
│   │
│   ├── core/
│   │   └── products/
│   │       └── season-calendar.utils.ts          # NEW — SEASON_MONTHS, isInSeasonNow, getAvailableMonths, getCategoryAccent
│   │
│   ├── pages/
│   │   │
│   │   ├── products/
│   │   │   ├── products.page.ts                  # REWORK — mosaic catalog, category lanes, filter pills, load more
│   │   │   ├── products.page.html                # (inline in .ts or separate)
│   │   │   ├── public-catalog.store.ts           # NEW — filter state, visibleItems computed, loadMore, categoryLanes
│   │   │   └── components/
│   │   │       ├── product-card.component.ts     # NEW — 3:4 portrait card, in-season dot, coming-soon overlay
│   │   │       ├── category-lane.component.ts    # NEW — scroll-snap lane strip with cover image + label
│   │   │       ├── filter-bar.component.ts       # NEW — sticky filter pills (availability + season chips)
│   │   │       └── in-season-badge.component.ts  # NEW — pulsing green dot + "In Season" text
│   │   │
│   │   ├── product-detail/
│   │   │   ├── product-detail.page.ts            # REWORK — split layout, below-fold sections
│   │   │   └── components/
│   │   │       ├── product-gallery.component.ts  # NEW — Swiper 12 integration, counter, keyboard, RTL
│   │   │       ├── season-chart.component.ts     # NEW — 12-cell month bar, accent fill, current-month highlight
│   │   │       ├── product-info-panel.component.ts # NEW — bilingual name, specs chips, CTA, packaging chips
│   │   │       └── related-products.component.ts # NEW — horizontal scroll strip of product cards
│   │   │
│   │   ├── seasons/
│   │   │   ├── seasons.page.ts                   # NEW — /seasons route host
│   │   │   └── components/
│   │   │       ├── season-calendar.component.ts  # NEW — products × 12 months grid, accent-colored cells
│   │   │       └── season-cell-popover.component.ts # NEW — native <dialog> popover on cell click
│   │   │
│   │   └── contact/
│   │       └── contact.page.ts                   # EXTEND — read ?crop= query param, pre-fill crop field
│   │
│   └── app.routes.ts                             # EXTEND — add /seasons lazy route; verify /products/:id route
│
└── public/assets/i18n/{ar,en,ru}.json            # EXTEND — add products_v2.* namespace keys
```

**Structure Decision**: Public pages live under `pages/` (not `admin/`), keeping the public site and admin cleanly separated. The new `PublicCatalogStore` is co-located with `products.page.ts` since it is exclusively consumed by the catalog page. `season-calendar.utils.ts` lives under `core/products/` because both the catalog page and the seasons page depend on it, and it is a pure utility (no Angular DI). Detail-page components are co-located under `product-detail/components/` — they are not shared with anything else.

## Complexity Tracking

| Decision | Why kept | Simpler alternative rejected because |
|----------|----------|--------------------------------------|
| `PublicCatalogStore` as a separate store on top of `ProductsStore` | Catalog-specific state (filter, visiblePage, categoryLanes) should not pollute the generic `ProductsStore`. | Stuffing catalog filter into `ProductsStore` would leak catalog UI concerns into admin pages that also consume that store. |
| CSS Grid `auto-flow: dense` for mosaic — hero every nth card | Pure CSS, zero JS reflow. Works with `ChangeDetectionStrategy.OnPush` and filter transitions. | Masonry/Packery require JS recalculation on every resize, causing jank on filter animation. |
| `swiper` 12 for detail gallery | Already installed. Touch, keyboard, RTL, loop — all covered. | A custom PointerEvents swipe handler is ~200 lines and lacks iOS momentum scrolling. |
| Native `<dialog>` for seasons calendar popover | Same pattern as admin confirm-dialog — established in this codebase. No CDK/popup dependency. | CDK overlay is not in scope; a custom positioned div requires focus trap, keyboard dismiss, and backdrop manually. |
| Client-side "load more" (slice of cached signal) | Backend returns all products in one call. A page-signal slice is 5 LOC. | HTTP pagination requires backend changes not in scope. |
| Frontend `SEASON_MONTHS` constant (no backend field) | `ProductListItem.season` is already one of Summer/Winter/AllYear. The constant is stable and matches Egyptian agriculture calendar. | A new backend `availableMonths: number[]` field would require migration + API versioning for no new information. |

## Phase A — Foundation

All three pages depend on shared utilities and i18n keys. Build these first so downstream components compile cleanly.

### A-1: `season-calendar.utils.ts`

**File**: `alatar-angular/src/app/core/products/season-calendar.utils.ts`

Create as a pure TypeScript module (no Angular DI). Export:

```ts
export const SEASON_MONTHS: Record<ProductSeason, number[]> = {
  Summer:  [4, 5, 6, 7, 8, 9],
  Winter:  [10, 11, 12, 1, 2, 3],
  AllYear: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
};

export const CATEGORY_ACCENT: Record<string, string> = {
  'Fruit-Fresh':     '#f97316',
  'Vegetable-Fresh': '#22c55e',
  'Frozen':          '#0ea5e9',
};

export function isInSeasonNow(season: ProductSeason): boolean { ... }
export function getAvailableMonths(season: ProductSeason): number[] { ... }
export function getCategoryAccent(type: ProductType, state: ProductState): string { ... }
```

**Tests** (vitest): boundary months (month 10 = Winter ✓, month 4 = Summer ✓, month 3 = Winter ✓), `AllYear` always true, `getCategoryAccent('Frozen state product')` returns ice-blue, unknown key returns fallback `#94a3b8`.

**SSR note**: `isInSeasonNow` calls `new Date()` — this is a pure utility; callers in Angular components must call it inside `afterNextRender` or guard with `isPlatformBrowser` to avoid hydration mismatch.

### A-2: i18n keys — `products_v2.*` namespace

Add to `en.json`, `ar.json`, and `ru.json` the full `products_v2` namespace as defined in [data-model.md §i18n](./data-model.md):

- `products_v2.catalog.*` (13 keys)
- `products_v2.detail.*` (10 keys)
- `products_v2.seasons.*` (15 keys: page_title, page_subtitle, view_product, month_1..month_12)

### A-3: `PublicCatalogStore`

**File**: `alatar-angular/src/app/pages/products/public-catalog.store.ts`

Injectable service (provided in the `products.page.ts` component's `providers: []`) wrapping `ProductsStore`. Signals:

| Signal | Type | Description |
|--------|------|-------------|
| `filter` | `WritableSignal<CatalogFilterState>` | Active filter |
| `visiblePage` | `WritableSignal<number>` | 1-based batch count |
| `filteredItems` | `Computed<PublicProductCard[]>` | Full filtered list |
| `visibleItems` | `Computed<PublicProductCard[]>` | `filteredItems.slice(0, visiblePage * 12)` |
| `hasMore` | `Computed<boolean>` | `visibleItems.length < filteredItems.length` |
| `categoryLanes` | `Computed<CategoryLane[]>` | Derived lane list with cover images |
| `isLoading` | delegates to `ProductsStore` | |
| `hasError` | delegates to `ProductsStore` | |

Methods: `setFilter(patch)`, `resetFilter()`, `loadMore()`.

URL sync: on `ngOnInit`, read `?category`, `?season`, `?availability` from `ActivatedRoute.queryParams` and call `setFilter`. On filter signal change, call `Router.navigate([], { queryParams, queryParamsHandling: 'merge' })`.

`isInSeasonNow` and `accentColor` must be computed inside `isPlatformBrowser` guard or initialized server-safe (server: `isInSeasonNow = false`).

**Tests**: filter `{ category: 'Fruit' }` returns only Fruit products; `loadMore()` increments `visiblePage`; `hasMore` false when all items visible; `resetFilter()` clears all dimensions.

---

## Phase B — Catalog Page Rework

### B-1: `in-season-badge.component.ts`

Standalone component. Props: `@Input() status: 'Valid' | 'ComingSoon'`, `@Input() isInSeason: boolean`.

Renders: pulsing green dot (CSS `@keyframes pulse`) + "In Season" text when `isInSeason && status === 'Valid'`; grey "Coming Soon" pill when `status === 'ComingSoon'`; nothing otherwise.

### B-2: `product-card.component.ts`

Standalone, `ChangeDetectionStrategy.OnPush`. Input: `card: PublicProductCard`.

Layout: `<a [routerLink]="['/products', card.id]">` wrapping a `3:4` aspect-ratio container. Image: `<img [src]="card.thumbnailUrl" object-fit-cover>` with `alt` attribute from `card.name`. Info strip: slides up on hover (`transform: translateY(0)` transition from `translateY(100%)`). Badges: `<app-in-season-badge>` overlaid top-left.

"Coming Soon" overlay: semi-transparent white scrim + "Coming Soon" text centered. Card is NOT a link when `status === 'ComingSoon'` (no navigation target).

Touch target: card is full-bleed — naturally ≥ 44px.

RTL: info strip and badge positioning use `inset-inline-start` / `inset-inline-end`.

### B-3: `category-lane.component.ts`

Standalone. Input: `lanes: CategoryLane[]`, Output: `categorySelected: EventEmitter<string>`.

Renders a `<div role="list">` with `overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch`. Each lane is a `<button role="listitem">` with:
- Full-bleed `<img [src]="lane.coverImageUrl">` (or color-block fallback if null)
- Category label overlay (transloco key from `lane.labelKey`)
- Product count badge
- Active state: border in `lane.accentColor`

Min-width per lane: `120px` on mobile, `160px` on desktop. Min-height: `44px` (touch target).

RTL: the scroll container scrolls RTL when `dir="rtl"`.

### B-4: `filter-bar.component.ts`

Standalone. Input: `filter: CatalogFilterState`. Output: `filterChange: EventEmitter<Partial<CatalogFilterState>>`.

Renders sticky `<div class="filter-bar">` with `position: sticky; top: 0; z-index: 10; background: #fff`. Two pill groups:

1. **Availability**: "All" / "In Season Now" / "Coming Soon" — maps to `availability` filter key.
2. **Season**: "All" / "Summer" / "Winter" — maps to `season` filter key.

Each pill: `<button>` with `min-height: 44px; min-width: 44px; padding: 0 1rem; border-radius: 9999px`. Active pill: brand-green fill; inactive: border + white bg.

"Active filter count" badge on a "More filters" chip if both non-default filters are active simultaneously (visual indicator only — all filters remain visible in this horizontal bar, no bottom-sheet needed for the public side).

### B-5: `products.page.ts` rework

Replace the existing 37-line placeholder (or legacy modal-based page) with:

1. Provide `PublicCatalogStore` in component `providers`.
2. Inject `PublicCatalogStore`, `ActivatedRoute`, `Router`.
3. On `ngOnInit`: call `store.syncFromUrl(route)`.
4. Template structure:
   - `<app-category-lane [lanes]="store.categoryLanes()" (categorySelected)="store.setFilter({category: $event})">` 
   - `<app-filter-bar [filter]="store.filter()" (filterChange)="store.setFilter($event)">`
   - Mosaic grid: `<div class="products-mosaic-grid">` — CSS Grid, 2-col mobile / 4-col desktop. Hero card pattern: `nth-child(7n+1)` gets `grid-column: span 2; grid-row: span 1` for portrait emphasis.
   - `@for (card of store.visibleItems(); track card.id)` → `<app-product-card [card]="card">`
   - Empty state (when `visibleItems().length === 0 && !store.isLoading()`): "No products match your selection." + "Clear filters" button → `store.resetFilter()`.
   - "Load more" button (when `store.hasMore()`): `min-height: 44px`, calls `store.loadMore()`.
   - Loading skeleton: 8 grey aspect-ratio boxes while `store.isLoading()`.

Filter transition: CSS `opacity` + `transform` transition on cards (fade + slight downward shift on filter change). Implemented with `@keyframes` or Tailwind `transition-opacity`.

URL state: filter changes push `?category=...&season=...&availability=...` via `Router.navigate`. On reload, filter state restores from URL.

---

## Phase C — Product Detail Page Rework

### C-1: `product-gallery.component.ts`

Standalone. Input: `imageUrls: string[]`, `productName: string`.

Wraps `SwiperComponent` from `swiper/angular` (already installed). Config: `navigation: true` (custom prev/next buttons for ≥ 44px touch target), `keyboard: { enabled: true }`, `loop: false`, `dir` bound to current `TranslocoService.getActiveLang()`.

Image counter: `"{{current}} / {{total}}"` via `swiper.activeIndex` signal.

When `imageUrls.length === 1`: hide prev/next controls (no navigation needed).

Keyboard: ArrowLeft/ArrowRight handled by Swiper's keyboard module.

Accessibility: each slide `<img>` has `[alt]="productName + ' image ' + (i+1)"`.

SSR: Swiper renders server-side but swipe events are client-only — `isPlatformBrowser` guard on swiper initialization if needed.

### C-2: `season-chart.component.ts`

Standalone. Inputs: `availableMonths: number[]`, `accentColor: string`.

Renders a 12-cell row (Jan–Dec). Each cell: `48px × 32px` min. Available months: background filled with `accentColor` at 80% opacity. Current month: `border: 2px solid accentColor`. Unavailable months: `background: #f1f5f9`.

Month labels from `products_v2.seasons.month_1` … `month_12` i18n keys.

SSR: current month detection via `isPlatformBrowser` — server renders all cells with no current-month highlight (hydration replaces on client).

RTL: months always display Jan→Dec left-to-right (chronological order) regardless of `dir`. The cell that is "current" is always highlighted by month number, not position.

### C-3: `product-info-panel.component.ts`

Standalone. Input: `product: PublicProductDetail`.

Sections:
1. **Bilingual name**: `<h1>` (EN, `font-weight: 800, 2.5rem`) + `<p>` (AR, `font-weight: 700, 1.5rem`, `direction: rtl`).
2. **Spec chips**: season chip, type chip, state chip — each a pill with neutral border.
3. **Primary CTA**: `<a [routerLink]="['/contact']" [queryParams]="{crop: product.name}">` — "Contact to Order" button, `min-height: 44px`, brand-green background.
4. **Packaging & Specs panel** (below fold via `<details>` on mobile): labeled chip groups for `packagingOptions`, `weightOptions`, `sizeOptions`, `gradeOptions` — each group has a label and a flex-wrap chip list.

### C-4: `related-products.component.ts`

Standalone. Input: `products: PublicProductCard[]` (max 4, same `productType`, different `id`).

Horizontal scroll strip: `overflow-x: auto; scroll-snap-type: x mandatory`. Each card is a compact version of `<app-product-card>` at fixed `180px` width. Touch-scroll snaps to card boundaries.

Empty: renders nothing (`@if (products.length > 0)`).

### C-5: `product-detail.page.ts` rework

Replace existing page component. Inject `ProductsStore`, `ActivatedRoute`.

On init: read `:id` param → `ProductsStore.productById(id)` → derive `PublicProductDetail` using `getAvailableMonths`, `getCategoryAccent`, `isInSeasonNow` (guarded with `isPlatformBrowser`).

Not-found state: when product is null/undefined → show "Product not found." + `routerLink="/products"` "Browse all products".

Template layout (desktop: CSS Grid 60/40 split; mobile: single column stacked):

```
[product-gallery   60%] [product-info-panel   40%]
─── below fold ───────────────────────────────────
[how-we-grow-it full-width text + image]
[packaging-specs  full-width chip groups]
[season-chart     full-width 12-cell bar]
[related-products full-width horizontal scroll]
```

Desktop 60/40 split: `display: grid; grid-template-columns: 3fr 2fr; min-height: 100vh`.

Mobile (≤ 767px): `grid-template-columns: 1fr` — gallery stacks above info panel.

RTL: `dir="rtl"` on `<html>` swaps the 60/40 to gallery-right / info-left automatically via CSS Grid column order being LTR-aware.

### C-6: Contact page — `?crop=` pre-fill

In `contact.page.ts`: inject `ActivatedRoute`. In `ngOnInit`, read `route.snapshot.queryParamMap.get('crop')` and patch the reactive form's crop/subject field with the value.

No structural changes to the contact page — this is a one-line form patch.

---

## Phase D — Seasons Page (New)

### D-1: `season-cell-popover.component.ts`

Standalone. Inputs: `cell: { product: PublicProductCard, monthIndex: number } | null`. Output: `closed: EventEmitter<void>`.

Uses native `<dialog>` element. On `cell` input change (non-null): call `dialogRef.nativeElement.showModal()` and position via `getBoundingClientRect()` of the triggering cell (`position: fixed; top: cellRect.bottom; left: cellRect.left`).

Popover content: product thumbnail (48×48px), bilingual name, "View product →" link to `/products/:id`.

Dismiss: backdrop click → `dialogRef.nativeElement.close()` → emit `closed`. ESC key handled natively by `<dialog>`.

SSR: guard `showModal` / `getBoundingClientRect` with `isPlatformBrowser`.

### D-2: `season-calendar.component.ts`

Standalone. Input: `rows: SeasonCalendarRow[]`.

Desktop layout: `<table>` or CSS Grid with products as rows and Jan–Dec as 12 columns. Column headers: month abbreviations from `products_v2.seasons.month_1..12`. Row headers: product thumbnail + bilingual name.

Cells: each `(product × month)` cell — filled with `row.accentColor` at 80% opacity when `row.availableMonths.includes(monthIndex)`; empty otherwise. Current month column: `border-inline: 2px solid accentColor` or a subtle highlight.

Cell click: emits `{ product, monthIndex }` up to page for popover.

Mobile reflow (≤ 767px): vertical layout — months as section headers, products as horizontal strip of thumbnails per month. `overflow-x: auto` on the thumbnail strip.

Min cell size: `44×44px` (touch target for popover trigger).

### D-3: `seasons.page.ts`

New standalone component. Inject `ProductsStore`. In `ngOnInit`: ensure products are loaded (delegate to `ProductsStore.loadIfEmpty()`).

Compute `rows: SeasonCalendarRow[]` via `computed()` from `ProductsStore.products` — map each `Valid` or `ComingSoon` product to a `SeasonCalendarRow` using `getAvailableMonths` and `getCategoryAccent`.

Template:
```
<h1>{{ 'products_v2.seasons.page_title' | transloco }}</h1>
<p>{{ 'products_v2.seasons.page_subtitle' | transloco }}</p>
<app-season-calendar [rows]="calendarRows()" (cellClicked)="openPopover($event)">
<app-season-cell-popover [cell]="activeCell()" (closed)="closePopover()">
```

SSR: `isInSeasonNow` called only for current-month column highlight — deferred via `afterNextRender`.

### D-4: Route registration

In `app.routes.ts` (or the public routes file), add:

```ts
{
  path: 'seasons',
  loadComponent: () => import('./pages/seasons/seasons.page').then(m => m.SeasonsPage),
  title: 'Season Calendar — Alatar Sons'
}
```

Verify `/products/:id` route already exists and resolves correctly after the page rework.

### D-5: Nav links

Add `/seasons` to the public navigation (header + footer) with transloco key `nav.seasons` (EN: "Season Calendar", AR: "تقويم الموسم"). Add `nav.seasons` to the three i18n files.

---

## Mosaic Grid CSS Pattern

The catalog mosaic uses CSS Grid with an `nth-child` rule to promote hero cards:

```css
.products-mosaic-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);      /* mobile: 2-col */
  grid-auto-flow: dense;
  gap: 1rem;
}

@media (min-width: 768px) {
  .products-mosaic-grid {
    grid-template-columns: repeat(4, 1fr);    /* desktop: 4-col */
  }
}

/* Hero card: every 7th starting from 1st */
.products-mosaic-grid > *:nth-child(7n+1) {
  grid-column: span 2;
}
```

The `7n+1` cadence means items 1, 8, 15, … are hero cards (2 columns wide). The remaining 6 fill the grid normally. `auto-flow: dense` fills gaps when hero cards create odd column remainders.

On filter change: Angular's `@for` with `track card.id` replaces the DOM list; hero card positions re-derive purely from CSS `nth-child` — no JS layout recalculation needed.

---

## Post-Design Re-Evaluation (after Phase 1)

- **Constitution Check**: still PASS — no principles defined to violate.
- **Spec drift?**: no FR was loosened. Several were *narrowed* by research/design:
  - FR-007 "Load more" — implemented as client-side signal slice (D-004). No HTTP pagination because the backend returns all products in one call.
  - FR-009 gallery swipe — uses Swiper 12 (D-005), already in `package.json`, not a new dependency.
  - FR-017 Contact CTA — navigates to `/contact?crop=` (D-007). The inline modal from the legacy products page is removed (D-013).
  - FR-022 season calendar popover — uses native `<dialog>` (D-008), consistent with admin confirm-dialog pattern.
- **Complexity introduced?**: only the items in the Complexity Tracking table above, each justified by an FR.
- **Future-readiness audit**:
  - **Adding a new filter dimension** (e.g., `?state=Fresh`) → add a key to `CatalogFilterState`, a pill to `filter-bar.component.ts`, and a computed predicate in `PublicCatalogStore`. One-file change per concern. ✓
  - **Adding a slug field** to routes → change `:id` to `:slug` in the route and `ProductsStore.productBySlug()` lookup. No component changes needed. ✓ (D-006)
  - **Grades page** (deferred FR-024..028) → add `/grades/:id` page under `pages/grades/` — zero impact on the three pages in scope. ✓
  - **Richer editorial content** ("How we grow it") → when client authors per-product copy, swap `product.descriptionEn` / `product.descriptionAr` for a new field. The `product-info-panel` component just binds to the property. ✓ (D-010)
  - **Backend structured packaging** → when backend adds structured `packagingSpec[]` objects, update `PublicProductDetail` shape and `product-info-panel` chip-group rendering. No other component is affected. ✓ (D-011)
- **Removed legacy patterns**: The inline order-request modal and inline contact modal from `products.page.ts` are removed (D-013). This reduces the catalog page by ~300 lines and makes the "Contact to Order" conversion path explicit and linkable.

**Result**: Phase 1 design holds. Ready for `/speckit-tasks`.
