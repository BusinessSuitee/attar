# Tasks: Public Products Catalog — "Field to Frame"

**Input**: Design documents from `specs/003-public-products-catalog/`
**Prerequisites**: [plan.md](./plan.md) (required), [spec.md](./spec.md) (required), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Scope**: P1 + P2 only — User Story 4 (Export Grade Comparison `/grades/[product]`) and FR-024..028 are deferred per `/speckit-plan` input and are NOT covered by these tasks.

**Tests**: Unit tests are included for the season-calendar utility, the URL ↔ filter-state round-trip, and the catalog store's computed slices — these were explicitly called for in [plan.md §Testing](./plan.md). Component-level tests are deferred; the [quickstart.md](./quickstart.md) smoke matrix is the primary verification surface.

**Organization**: Tasks are grouped by user story (US1, US2, US3) so each can ship as an independent increment.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Maps task to a user story from spec.md (US1, US2, US3)
- File paths are absolute under repo root (`alatar-angular/...`, `specs/...`)

## Path Conventions

This is an Angular SPA + .NET backend (web app). All Phase 3+ tasks touch only `alatar-angular/src/app/`. The .NET backend at `alatar-dotnet/` is **not modified** by this feature.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm baseline and wire i18n loading. No new dependencies; no scaffolding generators.

- [X] T001 Verify `swiper@^12` is present in [alatar-angular/package.json](alatar-angular/package.json) and not flagged stale; run `npm ls swiper` to confirm. If absent for any reason, halt and report — no other dependency add is allowed by [plan.md §Constraints](specs/003-public-products-catalog/plan.md).
- [X] T002 Verify the public route table in [alatar-angular/src/app/app.routes.ts](alatar-angular/src/app/app.routes.ts) currently exposes `/products` and `/products/:id`; note the lazy-load pattern used (it will be reused by the new `/seasons` route in T038).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build the shared utility and i18n namespace that all three user stories consume. Until this phase is green, no story can compile.

**⚠️ CRITICAL**: No US1/US2/US3 task may begin until T003–T007 are complete.

- [X] T003 [P] Create `season-calendar.utils.ts` at [alatar-angular/src/app/core/products/season-calendar.utils.ts](alatar-angular/src/app/core/products/season-calendar.utils.ts) exporting: `SEASON_MONTHS` constant, `CATEGORY_ACCENT` constant, `isInSeasonNow(season)`, `getAvailableMonths(season)`, `getCategoryAccent(type, state)`. Imports `ProductSeason`, `ProductType`, `ProductState` from the existing `core/products/product.model.ts` (or wherever the enums live — locate before adding). Pure module: no Angular DI, no `@Injectable`. Implementation matches [data-model.md §season-calendar.utils.ts](specs/003-public-products-catalog/data-model.md) and [research.md D-003 / D-009](specs/003-public-products-catalog/research.md).

- [X] T004 [P] Add the `products_v2.*` i18n namespace to [alatar-angular/public/assets/i18n/en.json](alatar-angular/public/assets/i18n/en.json) with all keys from [data-model.md §i18n](specs/003-public-products-catalog/data-model.md) (catalog: 9 keys, detail: 10 keys, seasons: 15 keys including month_1..month_12).

- [X] T005 [P] Add the same `products_v2.*` namespace to [alatar-angular/public/assets/i18n/ar.json](alatar-angular/public/assets/i18n/ar.json) with Arabic translations. Month names: يناير، فبراير، مارس، أبريل، مايو، يونيو، يوليو، أغسطس، سبتمبر، أكتوبر، نوفمبر، ديسمبر.

- [X] T006 [P] Add the same `products_v2.*` namespace to [alatar-angular/public/assets/i18n/ru.json](alatar-angular/public/assets/i18n/ru.json) with Russian translations. Month names: Янв, Фев, Мар, Апр, Май, Июн, Июл, Авг, Сен, Окт, Ноя, Дек.

- [X] T007 [P] Add unit tests at [alatar-angular/src/app/core/products/season-calendar.utils.spec.ts](alatar-angular/src/app/core/products/season-calendar.utils.spec.ts) covering: `SEASON_MONTHS.Summer` includes 4–9 only; `SEASON_MONTHS.Winter` includes 10,11,12,1,2,3 only; `SEASON_MONTHS.AllYear` length 12; `isInSeasonNow` for a frozen `Date.now()` mock (use `vi.useFakeTimers()` + `vi.setSystemTime`) — Summer product in July returns true, Winter product in July returns false, AllYear always true; `getCategoryAccent('Fruit','Fresh')` = `#f97316`, `('Vegetable','Fresh')` = `#22c55e`, any product with `state === 'Frozen'` returns `#0ea5e9` regardless of type, unknown combo returns fallback `#94a3b8`.

**Checkpoint**: Foundation ready — T008+ can begin in parallel across stories.

---

## Phase 3: User Story 1 — Browse & Filter Catalog (Priority: P1) 🎯 MVP

**Goal**: Replace the legacy `/products` page with a mosaic-grid catalog featuring scroll-snap category lanes, sticky filter pills, "In Season Now" badges, client-side load-more, and URL-synced filter state.

**Independent Test**: Visit `http://localhost:4200/products`. Category lanes appear at top with crop photography. Mosaic grid shows hero + standard cards. Click "Fruit" lane → grid filters with animation; URL updates to `?category=Fruit`. Reload → filter restores from URL. Click "In Season Now" pill → only in-season cards visible. Scroll to bottom → "Load more" appends next 12 without scroll reset. Filter to no-results → empty state with "Clear filters" appears. Maps to [quickstart.md §1–§5](specs/003-public-products-catalog/quickstart.md).

### Implementation for User Story 1

- [X] T008 [P] [US1] Create `PublicCatalogStore` at [alatar-angular/src/app/pages/products/public-catalog.store.ts](alatar-angular/src/app/pages/products/public-catalog.store.ts) — `@Injectable()` (provided in `products.page.ts`'s `providers`). Inject `ProductsStore`, `CategoryService`, `Router`, `ActivatedRoute`. Signals exactly as defined in [data-model.md §PublicCatalogStore](specs/003-public-products-catalog/data-model.md): `filter` (writable), `visiblePage` (writable, init `1`), `filteredItems` (computed, applies `category`/`season`/`availability` predicates against `ProductsStore.products()`), `visibleItems` (computed, slices `filteredItems` to `visiblePage * 12`), `hasMore` (computed), `categoryLanes` (computed; for each `productType + productState` group, derive `coverImageUrl` from first `Valid` product's `imageUrls[0]`, count, accent via `getCategoryAccent`). Methods: `setFilter(patch: Partial<CatalogFilterState>)` (also calls `Router.navigate([], { queryParams })` to push state), `resetFilter()`, `loadMore()` (increments `visiblePage`), `syncFromUrl()` (reads `route.snapshot.queryParamMap` once on init). Wrap any `new Date()` / `isInSeasonNow` call in `isPlatformBrowser(this.platformId)` guard (per [research.md D-012](specs/003-public-products-catalog/research.md)).

- [X] T009 [P] [US1] Add unit tests at [alatar-angular/src/app/pages/products/public-catalog.store.spec.ts](alatar-angular/src/app/pages/products/public-catalog.store.spec.ts) covering: `setFilter({ category: 'Fruit' })` filters out non-Fruit; `setFilter({ availability: 'in-season' })` filters to in-season-now only; combining filters intersects; `loadMore()` increments visible count by 12; `hasMore` flips false when all items shown; `resetFilter()` clears all dimensions and resets `visiblePage` to 1; URL round-trip (`setFilter` → query params → `syncFromUrl` reproduces same state). Mock `ProductsStore` with a fixed product fixture (≥ 30 items spanning multiple types and seasons).

- [X] T010 [P] [US1] Create `InSeasonBadgeComponent` at [alatar-angular/src/app/pages/products/components/in-season-badge.component.ts](alatar-angular/src/app/pages/products/components/in-season-badge.component.ts) — standalone, `OnPush`, inputs: `status: 'Valid' | 'ComingSoon'` and `isInSeason: boolean`. Renders pulsing green dot + "In Season" (transloco key `products_v2.catalog.in_season_badge`) when `isInSeason && status === 'Valid'`; grey "Coming Soon" pill (`products_v2.catalog.coming_soon_badge`) when `status === 'ComingSoon'`; nothing otherwise. CSS `@keyframes pulse-dot` for the green dot. Touch-target N/A (decorative).

- [X] T011 [P] [US1] Create `ProductCardComponent` at [alatar-angular/src/app/pages/products/components/product-card.component.ts](alatar-angular/src/app/pages/products/components/product-card.component.ts) — standalone, `OnPush`, input: `card: PublicProductCard`. Renders an `<a [routerLink]="['/products', card.id]">` (or non-link `<div>` when `status === 'ComingSoon'`) wrapping a `aspect-ratio: 3/4` container with `<img [src]="card.thumbnailUrl" [alt]="card.name" loading="lazy">` and an info strip (positioned absolute, `inset-inline-start: 0`, `inset-inline-end: 0`, `bottom: 0`, `transform: translateY(100%)` → `0` on `:hover`). Overlay `<app-in-season-badge>` top-start. "Coming Soon" overlay: white scrim + centered text. Image fallback (FR-032): on `(error)` event, swap to a placeholder asset path. Use `getCategoryAccent(card.productType, card.productState)` for the active-state border (writes to a CSS custom property `--card-accent`).

- [X] T012 [P] [US1] Create `CategoryLaneComponent` at [alatar-angular/src/app/pages/products/components/category-lane.component.ts](alatar-angular/src/app/pages/products/components/category-lane.component.ts) — standalone, `OnPush`, input: `lanes: CategoryLane[]`, input: `activeKey: string`, output: `categorySelected: EventEmitter<CategoryLane['key']>`. Container: `<div role="list" class="lane-strip">` with `overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch`. Each lane: `<button role="listitem" type="button">` with `min-height: 44px; min-width: 120px` (mobile) / `160px` (desktop), full-bleed `<img [src]="lane.coverImageUrl">` (or color-block fallback when null), label overlay (transloco from `lane.labelKey`), product count badge, active-state border in `lane.accentColor`. RTL: container scrolls RTL when `dir="rtl"` (no extra CSS — browser-native).

- [X] T013 [P] [US1] Create `FilterBarComponent` at [alatar-angular/src/app/pages/products/components/filter-bar.component.ts](alatar-angular/src/app/pages/products/components/filter-bar.component.ts) — standalone, `OnPush`, input: `filter: CatalogFilterState`, output: `filterChange: EventEmitter<Partial<CatalogFilterState>>`. Wrapper: `<div class="filter-bar"` with `position: sticky; top: 0; z-index: 10; background: #fff; padding: 0.75rem 1rem`. Two pill groups: (1) availability — All / In Season Now / Coming Soon (transloco keys `products_v2.catalog.filter_availability_*`), (2) season — All / Summer / Winter (reuse existing season transloco keys if present, otherwise add). Each pill: `<button type="button" class="pill" [class.pill--active]>` with `min-height: 44px; min-width: 44px; padding: 0 1rem; border-radius: 9999px`. Active: brand-green fill + white text; inactive: 1px border + transparent bg. Emits diff patches, never the full state.

- [X] T014 [US1] Rework [alatar-angular/src/app/pages/products/products.page.ts](alatar-angular/src/app/pages/products/products.page.ts) — replace the legacy modal-based page entirely (remove `OrderRequestFormState`, `ContactFormState`, modal templates, dialog refs — per [research.md D-013](specs/003-public-products-catalog/research.md)). New shape: standalone component, `OnPush`, `providers: [PublicCatalogStore]`. Inject `PublicCatalogStore`. In `ngOnInit`, call `store.syncFromUrl()`. Template (inline or co-located `.html`): `<app-category-lane [lanes]="store.categoryLanes()" [activeKey]="store.filter().category" (categorySelected)="store.setFilter({category: $event})">`, `<app-filter-bar [filter]="store.filter()" (filterChange)="store.setFilter($event)">`, mosaic grid `<div class="products-mosaic-grid">` with `@for (card of store.visibleItems(); track card.id) { <app-product-card [card]="card"> }`, empty state `@if (!store.isLoading() && store.visibleItems().length === 0) { ... 'Clear filters' button → store.resetFilter() }`, "Load more" button `@if (store.hasMore()) { <button (click)="store.loadMore()" min-height: 44px> }`, loading skeleton (8 grey aspect-ratio boxes) while `store.isLoading()`. Depends on T008, T010, T011, T012, T013.

- [X] T015 [US1] Add the mosaic grid CSS at [alatar-angular/src/app/pages/products/products.page.ts](alatar-angular/src/app/pages/products/products.page.ts) (component styles) — `display: grid; grid-template-columns: repeat(2, 1fr); grid-auto-flow: dense; gap: 1rem`; `@media (min-width: 768px) { grid-template-columns: repeat(4, 1fr) }`; hero rule: `> *:nth-child(7n+1) { grid-column: span 2 }`. Add card fade/transform transition (`transition: opacity 200ms, transform 200ms`) and `@starting-style` or `:enter` animation pattern compatible with `@for` track changes (test on filter change — see [quickstart.md §2](specs/003-public-products-catalog/quickstart.md)).

- [X] T016 [US1] Verify `/products` SSR — view-source on the page must show product card HTML in the markup, not just hydration placeholders ([quickstart.md §15](specs/003-public-products-catalog/quickstart.md)). If SSR fails, audit T008 / T011 for `window` / `document` access not guarded by `isPlatformBrowser`.

**Checkpoint**: User Story 1 ships independently — `/products` is fully reworked with mosaic grid, lanes, pills, load-more, URL state, and SSR. The legacy modal flow is removed.

---

## Phase 4: User Story 2 — Deep-Dive Product Detail (Priority: P1)

**Goal**: Replace the legacy `/products/:id` page with a 60/40 split layout — Swiper-based gallery on the left, info panel on the right — plus below-fold sections for "How we grow it", packaging chips, season chart, and related products. The "Contact to Order" CTA navigates to `/contact?crop=` instead of opening an inline modal.

**Independent Test**: Visit `http://localhost:4200/products/<known-id>`. Desktop: gallery on left 60%, info panel on right 40%. Mobile (375px): gallery stacks above info. Swipe / arrow keys cycle images; counter shows "2 / 4". Click "Contact to Order" → navigates to `/contact?crop=Navel%20Orange`; the contact form's crop field is pre-filled. The 12-cell month bar fills in product accent color; current month has highlighted border. Single-image products show no prev/next. Unknown id → "Product not found." + "Browse all products" link. Maps to [quickstart.md §6–§10](specs/003-public-products-catalog/quickstart.md).

### Implementation for User Story 2

- [X] T017 [P] [US2] Create `ProductGalleryComponent` at [alatar-angular/src/app/pages/product-detail/components/product-gallery.component.ts](alatar-angular/src/app/pages/product-detail/components/product-gallery.component.ts) — standalone, `OnPush`. Inputs: `imageUrls: string[]`, `productName: string`. Wraps `swiper/element` (or `swiper/angular` if already wired in the project — locate before deciding). Config: `navigation: true` with custom prev/next buttons sized ≥44×44px (transloco `products_v2.detail.gallery_prev` / `gallery_next`); `keyboard: { enabled: true }`; `loop: false`; `dir` bound to `TranslocoService.getActiveLang()` (`'ar'` → `'rtl'`, else `'ltr'`). Image counter: `{{ activeIndex() + 1 }} / {{ imageUrls.length }}` (transloco `image_counter` with `current`/`total` params). When `imageUrls.length <= 1`, hide nav controls and counter. Each `<img>` has `[alt]="productName + ' image ' + (i+1)"`. Guard Swiper init with `afterNextRender` for SSR safety.

- [X] T018 [P] [US2] Create `SeasonChartComponent` at [alatar-angular/src/app/pages/product-detail/components/season-chart.component.ts](alatar-angular/src/app/pages/product-detail/components/season-chart.component.ts) — standalone, `OnPush`. Inputs: `availableMonths: number[]`, `accentColor: string`. Renders 12 cells (Jan→Dec, always chronological regardless of `dir`). Each cell: min `48×32px`, label from `products_v2.seasons.month_1..12`. Available month: `background: ${accentColor}` at 80% opacity (CSS custom property `--accent-soft`). Current month: `border: 2px solid var(--accent)` — current month detection deferred via `afterNextRender(() => this.currentMonth.set(new Date().getMonth() + 1))` ([research.md D-012](specs/003-public-products-catalog/research.md)). Unavailable: `background: #f1f5f9`. Title from `products_v2.detail.availability_title`.

- [X] T019 [P] [US2] Create `ProductInfoPanelComponent` at [alatar-angular/src/app/pages/product-detail/components/product-info-panel.component.ts](alatar-angular/src/app/pages/product-detail/components/product-info-panel.component.ts) — standalone, `OnPush`. Input: `product: PublicProductDetail`. Sections: (a) bilingual name — `<h1>` EN at `font-weight: 800; font-size: 2.5rem`, `<p>` AR at `font-weight: 700; font-size: 1.5rem; direction: rtl`; (b) classification chips — season / type / state pills (transloco labels); (c) primary CTA — `<a [routerLink]="['/contact']" [queryParams]="{ crop: product.name }" class="btn-primary" min-height: 44px>` with text from `products_v2.detail.contact_cta`; (d) Packaging & Specs panel — title `products_v2.detail.specs_title`; for each non-empty group of `packagingOptions` / `weightOptions` / `sizeOptions` / `gradeOptions`, render a labeled chip group (`flex-wrap: wrap; gap: 0.5rem`). On mobile, wrap (d) in `<details>` collapsed by default ([research.md D-011](specs/003-public-products-catalog/research.md)).

- [X] T020 [P] [US2] Create `RelatedProductsComponent` at [alatar-angular/src/app/pages/product-detail/components/related-products.component.ts](alatar-angular/src/app/pages/product-detail/components/related-products.component.ts) — standalone, `OnPush`. Input: `products: PublicProductCard[]` (already filtered to same `productType`, excluding current `id`, capped to 4 by caller). Title from `products_v2.detail.related_title`. Renders `<div class="related-strip">` with `overflow-x: auto; scroll-snap-type: x mandatory; gap: 1rem; padding-inline: 1rem`. Each entry is a fixed-width (`180px`) compact `<app-product-card>`. `@if (products.length === 0) { /* render nothing */ }`.

- [X] T021 [US2] Rework [alatar-angular/src/app/pages/product-detail/product-detail.page.ts](alatar-angular/src/app/pages/product-detail/product-detail.page.ts) — standalone, `OnPush`. Inject `ProductsStore`, `ActivatedRoute`. Computed `productId = toSignal(route.paramMap.pipe(map(p => p.get('id'))))`; computed `product = computed(() => ProductsStore.productById(this.productId()))`; computed `detail: PublicProductDetail | null` derived from `product()` using `getAvailableMonths`, `getCategoryAccent`, and `isInSeasonNow` (the last guarded by `isPlatformBrowser`). Computed `relatedProducts` — same `productType`, exclude current `id`, take first 4 from `ProductsStore.products()`. Template: `@if (!detail()) { not-found block: 'products_v2.detail.not_found' + routerLink to /products with 'not_found_cta' label } @else { split layout grid }`. Split CSS: `display: grid; grid-template-columns: 1fr; min-height: 100vh; @media (min-width: 768px) { grid-template-columns: 3fr 2fr }`. Below-fold sections in document order: how-we-grow-it (`<section>` with `descriptionEn` / `descriptionAr` + atmospheric image — reuses `imageUrls[0]`, [research.md D-010](specs/003-public-products-catalog/research.md)), `<app-season-chart>`, `<app-related-products>`. Depends on T017, T018, T019, T020.

- [X] T022 [US2] Extend the contact page at [alatar-angular/src/app/pages/contact/contact.page.ts](alatar-angular/src/app/pages/contact/contact.page.ts) (locate the actual file path — it may live under `pages/contact/` or be combined with another file) to read `?crop=` from `ActivatedRoute.snapshot.queryParamMap` in `ngOnInit` and call `this.form.patchValue({ crop: cropValue })` (or whichever field name the contact form uses for the product/subject). One-line change scope only — do not restructure the contact page.

- [X] T023 [US2] Verify `/products/:id` SSR — view-source must include the product name, gallery image `<img>` tags, and season chart cells in the markup ([quickstart.md §15](specs/003-public-products-catalog/quickstart.md)). Audit T017 / T018 / T021 for any unguarded `window` / `document` / `new Date()` access.

**Checkpoint**: User Story 2 ships independently — every product has a working detail page; the Contact CTA pre-fills the crop field.

---

## Phase 5: User Story 3 — Plan Procurement via Season Calendar (Priority: P2)

**Goal**: Add a brand-new `/seasons` page that renders products × 12-month grid with accent-colored cells, a click-to-popover product preview, and a vertical reflow on mobile.

**Independent Test**: Visit `http://localhost:4200/seasons`. Grid shows products as rows, Jan–Dec as columns. Available cells filled with each product's accent color; current month column highlighted. Click a filled cell → popover with product thumb, bilingual name, "View product →" link. Click outside → popover closes. Resize to 375px → calendar reflows vertically (months scroll vertically, products as horizontal strip per month). Maps to [quickstart.md §11–§13](specs/003-public-products-catalog/quickstart.md).

### Implementation for User Story 3

- [X] T024 [P] [US3] Create `SeasonCellPopoverComponent` at [alatar-angular/src/app/pages/seasons/components/season-cell-popover.component.ts](alatar-angular/src/app/pages/seasons/components/season-cell-popover.component.ts) — standalone, `OnPush`. Input: `cell: { product: PublicProductCard; monthIndex: number; anchorRect: DOMRect } | null`. Output: `closed: EventEmitter<void>`. `@ViewChild('dialog', { static: true }) dialogRef!: ElementRef<HTMLDialogElement>`. `effect(() => { ... })` watches `cell` input: when non-null, position via `top: cell.anchorRect.bottom + 8 + 'px'; left: cell.anchorRect.left + 'px'` (account for viewport overflow), then `dialogRef.nativeElement.showModal()`; when null, `close()`. Backdrop click handler emits `closed`; `(close)` event also emits `closed`. ESC handled natively by `<dialog>`. Content: 48×48px thumbnail, bilingual name (`<span>{{ product.name }}</span><span dir="rtl">{{ product.nameAr }}</span>`), `<a [routerLink]="['/products', product.id]">{{ 'products_v2.seasons.view_product' | transloco }}</a>`. Guard `showModal` with `isPlatformBrowser`.

- [X] T025 [P] [US3] Create `SeasonCalendarComponent` at [alatar-angular/src/app/pages/seasons/components/season-calendar.component.ts](alatar-angular/src/app/pages/seasons/components/season-calendar.component.ts) — standalone, `OnPush`. Input: `rows: SeasonCalendarRow[]`. Output: `cellClicked: EventEmitter<{ product: PublicProductCard; monthIndex: number; anchorRect: DOMRect }>`. Desktop layout (`min-width: 768px`): CSS Grid `grid-template-columns: 200px repeat(12, 1fr)`; first column = sticky product header (thumb + bilingual name); 12 month columns. Cell: `<button type="button" class="cell" [class.cell--filled]="row.availableMonths.includes(month)" [style.--cell-accent]="row.accentColor" min-height: 44px; min-width: 44px>`. Filled cells: `background: var(--cell-accent)` at 80% opacity. Current month column highlight: `[class.col--current]="month === currentMonth()"` with thicker inline border (current month signal initialized in `afterNextRender`). Click handler: `emit({ product, monthIndex, anchorRect: ($event.target as HTMLElement).getBoundingClientRect() })`. Mobile reflow (`@media (max-width: 767px)`): vertical layout — each month becomes an `<h3>` followed by a `<div class="month-strip">` with `overflow-x: auto; scroll-snap-type: x mandatory` containing thumbnails of products available that month. Month labels from `products_v2.seasons.month_1..12`.

- [X] T026 [P] [US3] Create `SeasonsPage` at [alatar-angular/src/app/pages/seasons/seasons.page.ts](alatar-angular/src/app/pages/seasons/seasons.page.ts) — standalone, `OnPush`. Inject `ProductsStore`. In `ngOnInit`: trigger `ProductsStore.loadIfEmpty()` (or whatever the existing lazy-load method is — locate before adding). Computed `calendarRows: SeasonCalendarRow[]` derived from `ProductsStore.products()` filtered to `Valid` + `ComingSoon`, mapping each to `{ productId, name, nameAr, thumbnailUrl, accentColor: getCategoryAccent(p.productType, p.productState), availableMonths: getAvailableMonths(p.season) }`. Local writable signal `activeCell: WritableSignal<{...} | null> = signal(null)`. Template: `<h1>{{ 'products_v2.seasons.page_title' | transloco }}</h1>`, `<p>{{ 'products_v2.seasons.page_subtitle' | transloco }}</p>`, `<app-season-calendar [rows]="calendarRows()" (cellClicked)="activeCell.set($event)">`, `<app-season-cell-popover [cell]="activeCell()" (closed)="activeCell.set(null)">`. Depends on T024, T025.

- [X] T027 [US3] Register the `/seasons` lazy route in [alatar-angular/src/app/app.routes.ts](alatar-angular/src/app/app.routes.ts) — add `{ path: 'seasons', loadComponent: () => import('./pages/seasons/seasons.page').then(m => m.SeasonsPage), title: 'Season Calendar — Alatar Sons' }` next to `/products`. Verify SSR config still pre-renders this route.

- [X] T028 [US3] Add a `/seasons` link to the public navigation. Locate the public navbar/header (likely `app/shell/...` or `app/layout/...` — search for the existing `/products` nav link as the anchor). Add a new entry using the transloco key `nav.seasons`. Add `nav.seasons` value to all three i18n files: en `Season Calendar`, ar `تقويم الموسم`, ru `Календарь сезонов`. Add the same to the footer if a footer nav exists.

- [X] T029 [US3] Verify `/seasons` SSR — view-source must include the calendar grid HTML with all product rows and 12 month columns ([quickstart.md §15](specs/003-public-products-catalog/quickstart.md)). The popover is a `<dialog>` and should NOT be open in SSR output.

**Checkpoint**: All three user stories ship. `/products`, `/products/:id`, and `/seasons` are fully functional, RTL-correct, SSR-safe, and link to each other through the Contact CTA + nav.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verification passes that span multiple stories. Run after at least US1+US2 ship.

- [X] T030 [P] Run the full RTL audit at [quickstart.md §14](specs/003-public-products-catalog/quickstart.md): switch language to Arabic on every page. Verify category lanes scroll RTL, product detail split is gallery-right / info-left, calendar columns and rows remain correctly oriented. Fix any leaked `margin-left` / `padding-left` (replace with `margin-inline-start` / `padding-inline-start`).

- [ ] T031 [P] (deferred — needs manual browser/Lighthouse run) Run a Lighthouse accessibility audit (target ≥ 90, per [spec.md SC-005](specs/003-public-products-catalog/spec.md)) on each of `/products`, `/products/:id`, `/seasons`. Common findings to address: missing `alt` text on category lane images, insufficient color contrast on filter pills, missing `aria-label` on `<button>`s with icon-only content (e.g., gallery prev/next).

- [X] T032 [P] Image-fail placeholder pass (FR-032): trigger `(error)` on `<img>` in product card, gallery, and category lane by pointing one product to a known-broken URL. Confirm a branded placeholder asset renders instead of a broken-image icon. Use a single shared placeholder asset path (e.g., `/assets/images/product-placeholder.svg` — create if absent).

- [ ] T033 (deferred — needs manual dev-server smoke run) Run the full [quickstart.md](specs/003-public-products-catalog/quickstart.md) smoke matrix end-to-end on a dev build (`npm run dev`): all 15 numbered scenarios. Record any deviations in [tasks.md](specs/003-public-products-catalog/tasks.md) follow-ups.

- [X] T034 Remove dead code from the legacy products page rework (verify removal): no remaining references to `OrderRequestFormState`, `ContactFormState`, or any inline-modal templates anywhere under `pages/products/` ([research.md D-013](specs/003-public-products-catalog/research.md)). Run `grep -r OrderRequestFormState alatar-angular/src/` (Grep tool) — should return zero matches outside historical files (admin section is unaffected).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: T001–T002 are sanity checks — no blocking dependencies; can run immediately.
- **Phase 2 (Foundational)**: T003–T007 depend only on Phase 1. **BLOCKS all user stories.**
- **Phase 3 (US1) / Phase 4 (US2) / Phase 5 (US3)**: All three depend on Phase 2 completion. After that, the three phases are **mutually independent** — they touch disjoint files in `pages/products/`, `pages/product-detail/`, and `pages/seasons/`. They can run in parallel by different developers.
- **Phase 6 (Polish)**: T030–T034 depend on US1+US2 minimum (T033 needs all three for the full matrix).

### User Story Dependencies

- **US1 (P1, MVP)**: Independent. Depends only on T003–T007.
- **US2 (P1)**: Independent. Depends only on T003–T007. T020 (related products) reuses `ProductCardComponent` from T011 — if US2 starts before US1's T011 completes, the developer working on US2 should stub a minimal product card or coordinate the interface contract.
- **US3 (P2)**: Independent. Depends only on T003–T007. The `<dialog>`-based popover in T024 mirrors the admin confirm-dialog pattern — the developer should reference [admin/shared/ui/confirm-dialog.component.ts](alatar-angular/src/app/admin/shared/ui/confirm-dialog.component.ts) for the established pattern.

### Within Each User Story

- All `[P]` tasks within a phase touch disjoint files — they can run in parallel.
- The story's "page rework" task (T014, T021, T026) integrates the `[P]` components and depends on them all.
- Verification tasks (T016, T023, T029) run after the page rework.

### Parallel Opportunities

- **Phase 2**: T003–T007 are all `[P]` — five-way parallel.
- **Phase 3 (US1)**: T008, T009, T010, T011, T012, T013 are all `[P]` — six-way parallel; T014 / T015 / T016 sequential.
- **Phase 4 (US2)**: T017, T018, T019, T020 are all `[P]` — four-way parallel; T021 / T022 / T023 sequential.
- **Phase 5 (US3)**: T024, T025, T026 are all `[P]` (T026 imports T024+T025 but the file can be authored against the documented inputs/outputs); T027 / T028 / T029 sequential.
- **Phase 6**: T030, T031, T032 are all `[P]`; T033, T034 sequential after.

---

## Parallel Example: User Story 1

```bash
# After T003–T007 complete, launch all six US1 component/store tasks in parallel:
Task T008: PublicCatalogStore in alatar-angular/src/app/pages/products/public-catalog.store.ts
Task T009: store unit tests in alatar-angular/src/app/pages/products/public-catalog.store.spec.ts
Task T010: InSeasonBadgeComponent in pages/products/components/in-season-badge.component.ts
Task T011: ProductCardComponent in pages/products/components/product-card.component.ts
Task T012: CategoryLaneComponent in pages/products/components/category-lane.component.ts
Task T013: FilterBarComponent in pages/products/components/filter-bar.component.ts

# Then sequentially:
Task T014: rework products.page.ts (depends on T008, T010-T013)
Task T015: mosaic grid CSS (same file as T014)
Task T016: SSR verification
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. **Phase 1 (Setup)** — T001, T002 (~10 min sanity check).
2. **Phase 2 (Foundational)** — T003–T007 in parallel. ~1 day for utility + i18n + tests.
3. **Phase 3 (US1)** — T008–T016. ~2–3 days. Mosaic catalog with filters, lanes, load-more, URL state.
4. **STOP and VALIDATE** with [quickstart.md §1–§5](specs/003-public-products-catalog/quickstart.md). Demo to client.

### Incremental Delivery

1. Setup + Foundational ✓
2. US1 → demo (`/products` is the new catalog) — **MVP**
3. US2 → demo (`/products/:id` detail + Contact CTA flow ends at the contact page) — **conversion path complete**
4. US3 → demo (`/seasons` calendar adds the procurement-planning surface) — **differentiator live**
5. Polish (Phase 6) → final validation against [quickstart.md](specs/003-public-products-catalog/quickstart.md).

### Parallel Team Strategy

With three developers after Foundational completes:

- Dev A: US1 (T008–T016)
- Dev B: US2 (T017–T023)
- Dev C: US3 (T024–T029)

Coordination point: Dev B's T020 (`RelatedProductsComponent`) consumes Dev A's T011 (`ProductCardComponent`). Either Dev A finishes T011 first (it's small), or Dev B stubs the card during T020 and re-imports later.

---

## Notes

- `[P]` tasks touch different files — no merge conflicts.
- Story label `[US#]` maps each task to its user story for traceability and independent shipping.
- **Tests scope**: T007 + T009 are the only unit-test tasks — they cover the season-calendar utility and the catalog store's filter/page logic. Component-level tests are deferred (continues the testing posture from Spec 001 / Spec 002).
- **Out of scope (deferred)**: User Story 4 / FR-024..028 / `/grades/[product]`. No tasks in this list touch grades data, PDF spec sheets, or breadcrumbs for grades.
- **No backend changes**: the feature is frontend-only. `alatar-dotnet/` stays untouched.
- Commit cadence: one commit per task or per closely-coupled task pair (e.g., T014+T015 share a file and commit together).
- Stop at any checkpoint to ship and validate; each phase produces an independently-demoable increment.
