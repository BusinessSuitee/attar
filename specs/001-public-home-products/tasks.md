---
description: "Task list for feature implementation: Public Homepage & Products Catalog"
---

# Tasks: Public Homepage & Products Catalog

**Input**: Design documents from `specs/001-public-home-products/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: NOT requested by the feature spec. Test tasks are omitted. Use the manual smoke checks in [quickstart.md](./quickstart.md) as the verification baseline. Add unit tests post-MVP if/when desired.

**Organization**: Tasks are grouped by user story (US1, US2, US3 from spec.md). Setup, Foundational, and Polish phases are shared.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Maps task to a user story (US1, US2, US3); omitted for Setup, Foundational, and Polish phases
- All file paths are project-relative under `alatar-angular/src/app/` unless otherwise noted

## Path Conventions

- Frontend root: `alatar-angular/`
- App source: `alatar-angular/src/app/`
- Translations: `alatar-angular/public/assets/i18n/{ar,en,ru}.json`
- Backend (read-only here): `alatar-dotnet/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Ensure folders exist for new code; the Angular SPA itself is already initialized.

- [X] T001 Create new folders inside `alatar-angular/src/app/`: `core/i18n/`, `core/categories/`, `shared/ui/`, `shared/format/`, `pages/home/sections/`, `pages/products/components/`, `pages/product-detail/components/`. No file content yet — these directories host work in subsequent phases.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Cross-cutting building blocks every user story consumes — language signal/pipe, language-preference persistence, and StyleSeed-aligned UI primitives.

**⚠️ CRITICAL**: No user-story work begins until Phase 2 is complete.

### Localization helpers

- [X] T002 [P] Create the active-language signal at `alatar-angular/src/app/core/i18n/current-lang.signal.ts`. Bridges `TranslocoService.langChanges$` into a Signal&lt;'ar' \| 'en' \| 'ru'&gt; that components can `inject()`. SSR-safe (initial value = `transloco.getActiveLang()`).
- [X] T003 [P] Create the pure helper at `alatar-angular/src/app/shared/format/localized-name.ts`. Exports `pickLocalized(en: string \| null, ar: string \| null, lang: 'ar' \| 'en' \| 'ru'): { value: string; fellBack: boolean }` per data-model.md §1 fallback rule. RU falls back to EN when no RU field exists. Pure function, no Angular DI.
- [X] T004 Create the `LocalizedTextPipe` at `alatar-angular/src/app/core/i18n/localized-text.pipe.ts`. Standalone pipe `{{ {en, ar} | localizedText }}` and a tolerant string-mode `{{ 'Box | صندوق' | localizedText }}` that splits on `|` per research.md §3. Depends on T002 + T003.
- [X] T005 [P] Create the `LanguagePreferenceService` at `alatar-angular/src/app/core/i18n/language-preference.service.ts`. Reads/writes `attar.lang` in `localStorage` guarded by `isPlatformBrowser`. On boot, applies stored preference; otherwise infers from `navigator.language`. The only place that calls `transloco.setActiveLang()`. Provided in root.

### Shared UI primitives (StyleSeed-aligned per plan §Complexity Tracking and research.md §1)

- [X] T006 [P] Create `alatar-angular/src/app/shared/ui/card.component.ts`. Standalone `<ui-card>` wrapper applying `rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.08)]`; supports `padding="default"|"compact"|"none"` input. Uses brand neutrals; no pure black.
- [X] T007 [P] Create `alatar-angular/src/app/shared/ui/button.component.ts`. Standalone `<ui-button>` with `variant: 'primary'|'secondary'|'ghost'`, ≥44×44px (`min-h-11 min-w-11 px-4`), `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`, supports `disabled`, `loading`, `type`, and emits `(click)`. Primary variant uses brand `bg-primary text-white hover:bg-primary-dark`.
- [X] T008 [P] Create `alatar-angular/src/app/shared/ui/badge.component.ts`. Standalone `<ui-badge>` with `tone: 'neutral'|'brand'|'season'|'warning'|'success'`. Renders `<span>` with `text-[12px] font-semibold tracking-[0.05em] uppercase` and tone-appropriate background. Used for type/state/season/Coming-Soon badges.
- [X] T009 [P] Create `alatar-angular/src/app/shared/ui/skeleton.component.ts`. Standalone `<ui-skeleton>` shimmer placeholder with configurable `width`, `height`, `radius` inputs. CSS-only animation; respects `prefers-reduced-motion`.
- [X] T010 [P] Create `alatar-angular/src/app/shared/ui/empty-state.component.ts`. Standalone `<ui-empty-state>` with `title`, `description`, content slot for an action button. Centered layout inside a Card.
- [X] T011 [P] Create `alatar-angular/src/app/shared/ui/error-state.component.ts`. Standalone `<ui-error-state>` non-blocking banner with `(retry)` output and translated default copy. Used by homepage sections and the catalog when API calls fail.
- [X] T012 [P] Create `alatar-angular/src/app/shared/ui/image-with-fallback.component.ts`. Standalone `<ui-image>` wrapping `<img>` with `loading="lazy"`, alt text, fallback placeholder on `error` event, and an `aspectRatio` input (e.g., `4/3`). Resolves relative URLs via `API_BASE_URL` token.
- [X] T013 [P] Create `alatar-angular/src/app/shared/ui/input.component.ts`. Standalone `<ui-input>` form-control wrapper with `label`, `hint`, `errorMessage` slots; height `h-11` minimum; `aria-invalid`, `aria-describedby` correctly wired. Implements `ControlValueAccessor`.
- [X] T014 [P] Create `alatar-angular/src/app/shared/ui/select.component.ts`. Standalone `<ui-select>` for native `<select>` styled to match input; same a11y wiring as T013.

### Foundational translations

- [X] T015 Add shared/cross-cutting translation keys to `alatar-angular/public/assets/i18n/ar.json`, `en.json`, and `ru.json` under a `common` namespace: `loading`, `retry`, `error.generic`, `error.network`, `noResults`, `clearFilters`, `loadMore`, `language.toggle`. AR is authoritative; EN translated; RU may temporarily mirror EN.

**Checkpoint**: Foundation ready — all three user stories can now begin in parallel.

---

## Phase 3: User Story 1 — First-time visitor lands and finds the path forward (Priority: P1) 🎯 MVP

**Goal**: Deliver a homepage at `/` that communicates Alatar within seconds, surfaces featured produce categories live from the backend, and routes visitors to the catalog or contact path. Bilingual EN/AR with RTL working end-to-end.

**Independent Test**: Open the SPA root in a fresh browser. Confirm hero + categories + dual CTAs + social strip render; toggle language and verify RTL/LTR flip; resize from 320px to 1440px without horizontal scroll. See [quickstart.md §Homepage](./quickstart.md#homepage-user-story-1).

### Implementation for User Story 1

- [X] T016 [P] [US1] Create `alatar-angular/src/app/core/categories/category.service.ts` per [contracts/categories.api.md](./contracts/categories.api.md): `CategoryDto`, `getAll(): Observable<CategoryDto[]>`. Uses `API_BASE_URL` token. `providedIn: 'root'`.
- [ ] T017 [P] [US1] Create `alatar-angular/src/app/pages/home/sections/hero-section.component.ts` (+ `.html` if separate). Standalone component rendering company hero (logo/name, value-proposition headline, primary CTA). Uses `<ui-button variant="primary">` and existing brand assets. Above the fold on 360×640. All visible text via Transloco keys.
- [ ] T018 [P] [US1] Create `alatar-angular/src/app/pages/home/sections/value-proposition.component.ts`. Standalone supporting section explaining what Alatar does (3–4 bullet points or 2 cards). All copy via Transloco. Visual rhythm rule: not the same shape as the hero (per StyleSeed Golden Rule 6).
- [ ] T019 [US1] Create `alatar-angular/src/app/pages/home/sections/featured-categories.component.ts`. Calls `CategoryService.getAll()` on init; renders categories as `<ui-card>` cells inside a `px-6 grid` (FR-002). Uses `LocalizedTextPipe` on `{en: name, ar: nameAr}`. Loading state uses `<ui-skeleton>` cells; error state uses `<ui-error-state>` with retry. Caps display to first 6 categories on viewports ≤640px (per spec Assumptions). Depends on T004, T006, T009, T011, T016.
- [ ] T020 [P] [US1] Create `alatar-angular/src/app/pages/home/sections/primary-cta.component.ts`. Two prominent CTAs: "Browse products" → `routerLink="/products"`; "Contact us" → `routerLink="/contact"` (the existing SPA contact page). Uses `<ui-button>`.
- [ ] T021 [P] [US1] Create `alatar-angular/src/app/pages/home/sections/social-strip.component.ts`. Calls `SocialLinkService.getPublic()` on init; renders enabled links sorted by `displayOrder` per [contracts/social-links.api.md](./contracts/social-links.api.md). `customIconUrl` preferred over `iconKey`; `opensInNewTab` → `target="_blank" rel="noopener noreferrer"`. Silently renders nothing on error.
- [ ] T022 [US1] Rework `alatar-angular/src/app/pages/home/home.page.ts` and `home.page.html` to compose the new sections in this order: HeroSection → ValueProposition → FeaturedCategories → PrimaryCta → SocialStrip. Page-level layout uses `space-y-6` between sections (StyleSeed Golden Rule 5). Strip out any superseded inline markup. Depends on T017–T021.
- [ ] T023 [US1] Add homepage translation keys to all three i18n JSON files under `home.*` namespace: `hero.title`, `hero.subtitle`, `hero.cta`, `valueProp.title`, `valueProp.bullets[]`, `categories.title`, `categories.error`, `cta.browse`, `cta.contact`. AR authoritative.
- [ ] T024 [US1] Run the homepage smoke test in [quickstart.md §Homepage](./quickstart.md#homepage-user-story-1) — visual verification in EN and AR, mobile and desktop, with backend reachable and unreachable.

**Checkpoint**: Homepage is fully functional and demoable as standalone MVP.

---

## Phase 4: User Story 2 — Buyer browses and filters the product catalog (Priority: P2)

**Goal**: Catalog at `/products` consuming `CatalogStore` with URL-bound filter state, search, and load-more pagination. Smooth at 500+ products. "Coming Soon" visible with a badge; "Invalid" filtered out.

**Independent Test**: Navigate to `/products`. Apply category + type + season + search filters; reload the URL and confirm restored state; click "Load more"; reach an empty result and click "Clear filters". See [quickstart.md §Products catalog](./quickstart.md#products-catalog-user-story-2).

### Implementation for User Story 2

- [ ] T025 [US2] Create `alatar-angular/src/app/core/products/catalog.store.ts`. Exposes signals: `items`, `accumulated`, `total`, `hasMore`, `isLoading`, `hasError`, and a method `query(filter: CatalogFilterState): void` that runs the filter pipeline. Internally fetches all products once via existing `ProductService.getProducts()`, caches them, then filters/paginates in memory per research.md §4. `CATALOG_PAGE_SIZE = 24`. Drops `status === 'Invalid'` server-side. Includes `serializeFilterState` and `parseFilterState` helpers per [data-model.md §3](./data-model.md#3-catalogfilterstate-url-bound).
- [ ] T026 [P] [US2] Create `alatar-angular/src/app/pages/products/components/product-card.component.ts`. Renders one product: primary image (resolve via `<ui-image>`), localized name (`LocalizedTextPipe` on `{en: name, ar: nameAr}`), badges for `productType`, `productState`, `season`, plus `Coming Soon` badge when `status === 'ComingSoon'`. Card click navigates to `/products/:id`. Reserves a `metadata-row` slot per FR-040.
- [ ] T027 [P] [US2] Create `alatar-angular/src/app/pages/products/components/catalog-filters.component.ts`. Renders chip groups for Category (hidden when no `categoryId` available on products, per research.md §2 fallback), Type (Fruit/Vegetable), State (Fresh/Frozen), Season (Summer/Winter/AllYear). Inputs: current filter state + categories list. Outputs: `(filterChange)` per chip click. Uses `<ui-button variant="ghost">` for chips. Includes "Clear all filters" action visible whenever any filter is active.
- [ ] T028 [P] [US2] Create `alatar-angular/src/app/pages/products/components/catalog-search.component.ts`. Debounced (250ms) search input bound to `state.search`. Uses `<ui-input>` with magnifier icon prefix. Emits `(searchChange)`.
- [ ] T029 [US2] Create `alatar-angular/src/app/pages/products/components/catalog-grid.component.ts`. Renders the responsive product grid (`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-6`) using `ProductCardComponent`. Skeleton state shows 6 `<ui-skeleton>` placeholders. Empty state uses `<ui-empty-state>` with "Clear filters" action. End of list shows `<ui-button>` "Load more" while `hasMore`. Inputs: `items`, `isLoading`, `hasMore`. Outputs: `(loadMore)`. Depends on T025, T026.
- [ ] T030 [US2] Rework `alatar-angular/src/app/pages/products/products.page.ts` and `products.page.html` to:
  1. Inject `CatalogStore` and `CategoryService`.
  2. Read query params via `ActivatedRoute.queryParamMap` → `parseFilterState` → `store.query()` on init and on every queryParam change.
  3. Update URL via `router.navigate([], { queryParams: serializeFilterState(state), queryParamsHandling: 'merge' })` on filter/search change (page reset to 1) and on load-more (page increment only).
  4. Compose `<app-catalog-search>` + `<app-catalog-filters>` + `<app-catalog-grid>` with their inputs/outputs wired.
  5. Render an `<ui-error-state>` above the grid when `store.hasError() === true`.
  Depends on T025, T027, T028, T029.
- [ ] T031 [US2] Add catalog translation keys to all three i18n JSON files under `products.*`: `title`, `search.placeholder`, `filter.category`, `filter.type`, `filter.state`, `filter.season`, `filter.values.fruit/vegetable/fresh/frozen/summer/winter/allYear`, `comingSoon`, `empty.title`, `empty.description`, `loadMore`, `error.title`. AR authoritative.
- [ ] T032 [US2] Run the catalog smoke test in [quickstart.md §Products catalog](./quickstart.md#products-catalog-user-story-2) — filter combinations, URL round-trip, empty state, load-more, language toggle, behavior at 500+ products (use a synthetic dev seed if real data is sparse).

**Checkpoint**: Homepage **and** catalog work independently. The MVP-plus-discovery is shippable.

---

## Phase 5: User Story 3 — Buyer views product details and submits an Order Request (Priority: P3)

**Goal**: Product detail at `/products/:id` with image gallery, bilingual content, option groups, and an Order Request form that posts to the existing `/api/order-requests` endpoint. SSR-rendered with per-product `<title>` and OG meta. "Coming Soon" replaces the order CTA with a notice; missing/Invalid products show a friendly fallback.

**Independent Test**: Click a Valid product from the catalog; view gallery, description, options; open the order form; submit invalid then valid input; verify success banner. Open a "Coming Soon" detail and verify no form is shown. Open a non-existent product ID and verify the not-available message. See [quickstart.md §Product detail + Order Request](./quickstart.md#product-detail--order-request-user-story-3).

### Implementation for User Story 3

- [ ] T033 [P] [US3] Create `alatar-angular/src/app/pages/product-detail/components/image-gallery.component.ts`. Uses the existing `swiper` dependency. Renders product images with thumbnails on desktop and swipe-only on mobile. `loading="lazy"` beyond the first image. Falls back to a placeholder when `images` is empty. Resolves relative URLs via `API_BASE_URL`.
- [ ] T034 [P] [US3] Create `alatar-angular/src/app/pages/product-detail/components/option-group.component.ts`. Renders one option group as a chip group (single-select per group on the public detail). Inputs: `label`, `options: string[]`, `selectedValue: string | null`. Output: `(selectionChange)`. Uses `LocalizedTextPipe` in tolerant bilingual-split mode (research.md §3) to render labels.
- [ ] T035 [P] [US3] Create `alatar-angular/src/app/pages/product-detail/components/meta-summary.component.ts`. Single-line summary of product type/state/season/category using `<ui-badge>` chips.
- [ ] T036 [P] [US3] Create `alatar-angular/src/app/pages/product-detail/components/order-request-form.component.ts` per [data-model.md §5](./data-model.md#5-orderrequestform-form-model). Typed reactive form (`FormBuilder.nonNullable.group({...})`) with controls: `requesterName`, `phoneNumber`, `quantityTons`, `specialSpecification`, `selectedVariety`, `selectedPackaging`, `selectedWeight`, `selectedSize`, `selectedGrade`. Validators per data-model.md §5. On submit, maps to `CreateOrderRequestPayload` and calls `OrderRequestService.createOrderRequest()`. Lifecycle states: idle/dirty/submitting/success/failure with banner UI. Reuses `OptionGroupComponent` when the parent passes the product. Inputs: `productId: string`, `varietyOptions: string[]`, `packagingOptions: string[]`, `weightOptions: string[]`, `sizeOptions: string[]`, `gradeOptions: string[]`, `prefilledSelections: Partial<...>`. Depends on T034.
- [ ] T037 [P] [US3] Create `alatar-angular/src/app/pages/product-detail/product-detail.resolver.ts`. SSR-safe resolver: fetches all products via `ProductsStore.ensureLoaded()` (or a dedicated `ProductService.getProducts()` cache hit), finds the product by route `id` param, returns it; if not found OR `status === 'Invalid'`, returns `null` so the page renders the not-available state (NEVER navigates; avoids redirect-during-resolve). Note: when backend gains `GET /api/products/:id` later, swap implementation in this one file.
- [ ] T038 [US3] Wire the resolver in `alatar-angular/src/app/app.routes.ts`: add `resolve: { product: productDetailResolver }` to the `/products/:id` route definition. Depends on T037.
- [ ] T039 [US3] Rework `alatar-angular/src/app/pages/product-detail/product-detail.page.ts` and `product-detail.page.html` to:
  1. Read the resolved product from `ActivatedRoute.data`.
  2. If null → render the not-available `<ui-empty-state>` with a link back to `/products`.
  3. Else compose: `<app-image-gallery>` + localized name (h1) + bilingual description (with fallback notice via `pickLocalized().fellBack`) + `<app-meta-summary>` + five `<app-option-group>` instances + the order CTA.
  4. CTA button is `<ui-button variant="primary">` "Request this product" when `status === 'Valid'`. Replaced with a "Coming Soon" notice when `status === 'ComingSoon'`. Toggling the CTA reveals `<app-order-request-form>` inline (no modal).
  5. Selected options in the option groups are passed as `prefilledSelections` into the order form.
  Depends on T033, T034, T035, T036, T038.
- [ ] T040 [US3] Add SSR-safe SEO + OG metadata in `product-detail.page.ts` per research.md §6. Use `Title.setTitle()` and `Meta.updateTag()` from `@angular/platform-browser` to set `<title>`, `<meta name="description">`, `<meta property="og:title">`, `<meta property="og:description">`, `<meta property="og:image">`. Strings are localized via `LocalizedTextPipe`-equivalent direct calls to `pickLocalized()`. Reset/clear tags on `ngOnDestroy`.
- [ ] T041 [US3] Add product-detail translation keys to all three i18n JSON files under `productDetail.*` and `orderRequest.*`: `notAvailable.title`, `notAvailable.cta`, `comingSoon.notice`, `descriptionFallbackNotice`, `optionGroups.varieties/packaging/weight/size/grade`, `request.cta`, `request.title`, `request.fields.name/phone/quantity/notes`, `request.errors.required/minLength/phoneFormat/quantityPositive`, `request.submit`, `request.submitting`, `request.success`, `request.failure`. AR authoritative.
- [ ] T042 [US3] Run the detail + order-request smoke test in [quickstart.md §Product detail + Order Request](./quickstart.md#product-detail--order-request-user-story-3). Confirm SSR `<title>` and `og:*` tags via `curl` per quickstart §Verify SSR. Verify the submitted Order Request appears in the existing admin Order Requests list (read directly via `GET /api/order-requests` if no admin UI is wired yet).

**Checkpoint**: All three user stories work independently. Full feature is demoable end-to-end.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Quality gates, performance verification, accessibility audit, and documentation hand-off.

- [ ] T043 [P] Run `/ss-lint` against `alatar-angular/src/app/pages/home/`, `pages/products/`, `pages/product-detail/`. Fix any reported violations. Document any intentional deviations in [research.md](./research.md) §1 if they exist.
- [ ] T044 [P] Run `/ss-a11y` audit on the homepage, products catalog, and product detail. Verify: WCAG AA contrast on text (especially against the brand green), 44×44px touch targets, focus-visible rings, `aria-*` on form fields and chips, document `dir` flips correctly, no info conveyed by color alone (per FR-031..036, SC-010).
- [ ] T045 Manual bilingual end-to-end pass in AR, then EN, then RU, on mobile (360×640), tablet (768×1024), and desktop (1440×900). Verify SC-001 (≤3 clicks to product), SC-002 (filter <1s), SC-003 (order request <2 min), SC-004 (language toggle <1s).
- [ ] T046 Performance check: synthetically seed 500 products into the dev backend (or stub `ProductService.getProducts()` to return 500 mocked items), open `/products`, confirm filter and scroll remain smooth (no dropped frames, filter response <1s). Verifies SC-002, SC-006.
- [ ] T047 [P] Verify SSR output for product detail: `npm run build && npm run serve:ssr:alatar-angular`, then `curl` the response for a known product ID and confirm `<title>` contains the localized product name and `<meta property="og:image">` is set. Verifies FR-016 (deep-linkable URL), SC-005 implication for SEO.
- [ ] T048 Update [CLAUDE.md](../../CLAUDE.md) SPECKIT block to point at this feature's plan if needed. Currently already points at [plan.md](./plan.md) — verify and leave alone if unchanged.
- [ ] T049 Run `/speckit-analyze` (optional) to verify spec/plan/tasks consistency before declaring the feature done.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies, instant.
- **Foundational (Phase 2)**: blocks all user stories. T002 + T003 → T004; everything else parallel within Phase 2.
- **User Stories (Phase 3, 4, 5)**: each depends only on Foundational. Can be implemented in priority order (P1 → P2 → P3) or in parallel by separate developers.
- **Polish (Phase 6)**: depends on the user stories you intend to ship.

### User Story Dependencies

- **US1**: independent.
- **US2**: independent of US1. The catalog page navigates to product detail (US3), but the catalog is fully testable on its own — clicking a card simply opens the existing product-detail stub if US3 isn't done yet.
- **US3**: independent. The detail page can be reached by URL even if the catalog isn't reworked yet.

### Within Each User Story

- Standalone components in different files → parallel.
- Page composition tasks (T022, T030, T039) must wait for their child components.
- Translation key tasks (T023, T031, T041) sequence with their phase but don't block other phases.

### Parallel Opportunities

- **Phase 2**: T002, T003, T005, T006, T007, T008, T009, T010, T011, T012, T013, T014 all parallel. T004 waits for T002+T003. T015 sequences after components if any of them introduce new common keys.
- **Phase 3 (US1)**: T016, T017, T018, T020, T021 all parallel. T019 depends on T016. T022 depends on T017–T021. T023 sequences with T022.
- **Phase 4 (US2)**: T026, T027, T028 parallel after T025. T029 depends on T025+T026. T030 depends on T025, T027, T028, T029. T031 sequences with T030.
- **Phase 5 (US3)**: T033, T034, T035 parallel. T036 depends on T034. T037 parallel with components. T038 depends on T037. T039 depends on T033–T038. T040 part of T039. T041 sequences with T039.
- **Phase 6**: T043, T044, T047 parallel.

---

## Parallel Example: Phase 2 (Foundational)

```text
# Run these 12 tasks in parallel — they touch different files:
Task: T002 — current-lang.signal.ts
Task: T003 — localized-name.ts
Task: T005 — language-preference.service.ts
Task: T006 — card.component.ts
Task: T007 — button.component.ts
Task: T008 — badge.component.ts
Task: T009 — skeleton.component.ts
Task: T010 — empty-state.component.ts
Task: T011 — error-state.component.ts
Task: T012 — image-with-fallback.component.ts
Task: T013 — input.component.ts
Task: T014 — select.component.ts

# Then T004 (depends on T002 + T003), then T015.
```

## Parallel Example: User Story 2

```text
# After T025 (catalog.store.ts) lands:
Task: T026 — product-card.component.ts
Task: T027 — catalog-filters.component.ts
Task: T028 — catalog-search.component.ts

# Then T029 — catalog-grid.component.ts
# Then T030 — products.page.ts/.html composition
# Then T031 — translation keys
# Then T032 — smoke test
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Phase 1: Setup (T001).
2. Phase 2: Foundational (T002–T015) — single sprint of parallel work.
3. Phase 3: US1 (T016–T024) — homepage live.
4. **STOP and DEMO** the homepage. The catalog still routes to the existing stub or is hidden from the navbar until US2 lands.

### Incremental Delivery (recommended)

1. Setup + Foundational complete → Foundation ready.
2. Add US1 → demo homepage.
3. Add US2 → demo catalog. Buyers can browse and find products.
4. Add US3 → demo full flow. Sales team starts receiving live Order Requests.
5. Polish (Phase 6) → ship.

Each story is independently shippable; rolling back any one of them does not break the others.

### Parallel Team Strategy

With three developers after Phase 2 completes:

- Developer A → US1 (homepage).
- Developer B → US2 (catalog).
- Developer C → US3 (detail + order form).

The shared `shared/ui/` primitives and the `LocalizedTextPipe` are already in place from Phase 2, so the three streams compose without merge contention beyond the i18n JSON (sequence the keys tasks).

---

## Notes

- The .NET backend is **not modified** by this feature. Every backend reference is read-only against the existing endpoints (see [contracts/](./contracts/)).
- `localStorage` and `window` accesses are guarded by `isPlatformBrowser` for SSR safety. Tasks that touch these (T005, T040 partly) call out the guard explicitly.
- Existing static HTML files at the repo root (`home.html`, `contact.html`, `gallery.html`, etc.) are **untouched**. The Angular SPA owns `/` and serves the new homepage.
- The existing `ProductsStore` (admin-oriented) is **not modified**; the new `CatalogStore` lives alongside it.
- StyleSeed rules adopted are those documented in [research.md §1](./research.md#1--styleseed-adoption-strategy-under-tailwind-v3--existing-brand). The Tailwind v4 + skin migration is explicitly deferred.
- All user-facing strings route through Transloco (UI chrome) or `LocalizedTextPipe` (data fields). No hard-coded language strings are introduced.
