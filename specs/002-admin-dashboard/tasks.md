---
description: "Task list for feature implementation: Admin Dashboard (US1 Products focus + foundational layer)"
---

# Tasks: Admin Dashboard

**Input**: Design documents from `specs/002-admin-dashboard/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: NOT requested by the feature spec. Test tasks are omitted. Use the [quickstart.md](./quickstart.md) smoke checks as the verification baseline.

**Scope of this iteration**: detailed tasks cover **User Story 1 (Products & Categories management)** plus the cross-cutting **foundational primitives that US1 needs** (optimistic helper, toast service, confirm dialog, data table). User Stories US2–US6 are listed as **deferred phases** awaiting their per-story data-model and contracts work; they will be expanded in future `/speckit-tasks` runs once those design artifacts are written.

This matches the spec's "independently shippable user story" intent: ship US1 first, then expand the data model and tasks for US2 (Orders), US3 (Contacts), US4 (Social Links), US5 (Overview), US6 (Settings) as each rolls in.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Maps task to a user story (US1); omitted for Setup, Foundational, and Polish phases
- All file paths are project-relative under `alatar-angular/src/app/` unless otherwise noted

## Path Conventions

- Frontend root: `alatar-angular/`
- App source: `alatar-angular/src/app/`
- Translations: `alatar-angular/public/assets/i18n/{ar,en,ru}.json`
- Backend (read-only here): `alatar-dotnet/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Ensure folders exist for new admin code; the Angular SPA itself is already initialized and the admin shell is in place.

- [X] T001 Create new folders inside `alatar-angular/src/app/admin/`: `shared/stores/`, `shared/status/`, `shared/ui/`, `shared/toasts/`. No file content yet — these directories host work in subsequent phases.

---

## Phase 2: Foundational (Blocking Prerequisites for US1)

**Purpose**: Build the cross-cutting admin-only primitives that US1 needs end-to-end. Primitives that only later stories use (`<admin-side-drawer>`, `<admin-status-workflow>`, drag-drop directive, `<admin-kpi-tile>`, `<admin-pagination>`) are deferred to those stories' phases to keep this iteration lean.

**⚠️ CRITICAL**: No US1 work begins until Phase 2 is complete.

- [X] T002 [P] Create the optimistic-update helper at `alatar-angular/src/app/admin/shared/stores/optimistic.helper.ts` per [data-model.md §8](./data-model.md#8-optimisticoperationt-r-cross-cutting-helper) and [research.md §6](./research.md#6--optimistic-update-helper). Single function `optimistic<R>(opts)` that calls `applyLocally()` synchronously, subscribes to `callServer()`, fires `toast.success` on success, and on error calls `rollback()` + `toast.error` with a Retry action that re-runs the same op. Pure helper; injects `ToastService` only when toast messages are configured.
- [X] T003 [P] Create the toast service at `alatar-angular/src/app/admin/shared/toasts/toast.service.ts` per [data-model.md §9](./data-model.md#9-toastqueuemodel) and [research.md §5](./research.md#5--toast--notification-pattern). Signal-based `toasts: Signal<Toast[]>`, methods `success(message)`, `error(message, action?)`, `info(message)`, `dismiss(id)`. Auto-dismiss via `setTimeout` (4s success, 8s error, 6s info), cancellable on manual dismiss. `providedIn: 'root'`.
- [X] T004 Create the toast host at `alatar-angular/src/app/admin/shared/toasts/toast-host.component.ts`. Standalone `<admin-toast-host>` component reading `ToastService.toasts` via signal. Renders the toast queue stacked at the top-end of the admin viewport (top-right LTR, top-left RTL — use `start`/`end` logical positioning). Uses Spec 001's `<ui-button>` for the optional action button. Depends on T003.
- [X] T005 Mount `<admin-toast-host>` once inside `alatar-angular/src/app/admin/shell/admin-shell.component.ts` (existing file). Add the import + selector to the existing template; do not modify any other shell behavior. Depends on T004.
- [X] T006 [P] Create `alatar-angular/src/app/admin/shared/ui/confirm-dialog.component.ts` per [research.md §4](./research.md#4--modal--dialog-primitive-without-cdk). Standalone `<admin-confirm-dialog>` using the native `<dialog>` element with `showModal()` for focus trap + ESC dismissal. Inputs: `[open]: boolean`, `[title]: string`, `[description]: string`, `[confirmLabel]`, `[cancelLabel]`, `[tone]: 'neutral' \| 'danger'`. Outputs: `(confirm)`, `(cancel)`. Content projection slot for body so the same shell hosts both confirmations and small forms (used later by social-link create/edit dialog). All visible labels via Transloco.
- [X] T007 [P] Create `alatar-angular/src/app/admin/shared/ui/data-table.component.ts` per [plan.md Complexity Tracking](./plan.md#complexity-tracking) and FR-062. Standalone `<admin-data-table>` rendering a tabular list driven by a `[columns]` config input. Each column is `{ key, headerKey (translation), cell: (row) => TemplateRef \| string, sortable?, width? }`. Inputs: `[items]`, `[columns]`, `[isLoading]`, `[hasError]`, `[emptyMessageKey]`. Outputs: `(rowClick)`. Skeleton state shows configurable row count. Empty state uses Spec 001's `<ui-empty-state>`. Error state uses Spec 001's `<ui-error-state>`. Adding a new column later means adding a config entry — no edits to this component.

**Checkpoint**: Foundation ready — US1 can begin.

---

## Phase 3: User Story 1 — Products & Categories management (Priority: P1) 🎯 MVP

**Goal**: An admin can curate the product catalog (list + filter + search + create + edit + image upload + status change) and manage categories (list + create + edit + delete). All operations bilingual EN/AR with optimistic status updates and confirmation on destructive actions.

**Independent Test**: Per [quickstart.md §Smoke test — User Story 1](./quickstart.md#smoke-test--user-story-1-products--categories). Sign in, open `/admin/products`, browse and filter the seeded catalog, create a category, create a new product (no images section), confirm route auto-transitions to `/admin/products/<id>/edit`, upload images, change status (with optimistic update + toast), edit a bilingual option group, verify legacy single-language entries render in both languages without forcing a re-encode.

### Implementation for User Story 1 — Categories sub-area

- [X] T008 [P] [US1] Extend `alatar-angular/src/app/core/categories/category.service.ts` (existing) per [contracts/categories.api.md](./contracts/categories.api.md): add `create(payload: CreateCategoryPayload): Observable<CategoryIdResponse>`, `update(id, payload): Observable<CategoryIdResponse>`, `delete(id): Observable<void>`. Define `CreateCategoryPayload` interface. Do NOT touch the existing `getAll()`.
- [X] T009 [US1] Create `alatar-angular/src/app/admin/sections/products/categories.store.ts`. Signals: `categories`, `isLoading`, `hasError`, `errorMessage`. Methods: `ensureLoaded()`, `reload()`, `create(payload)`, `update(id, payload)`, `delete(id)`. Non-optimistic for create/update/delete (server may reject delete if category has products — surface error in a toast and keep the row). Depends on T008.
- [X] T010 [P] [US1] Create `alatar-angular/src/app/admin/sections/products/components/categories-pane.component.ts`. Renders the categories sub-pane on the products list page: `<admin-data-table>` with columns for bilingual name (`LocalizedTextPipe`), type, season, plus a row-end actions cell with Edit and Delete buttons. Header has a "+ Add category" button. Edit and Add open `<admin-confirm-dialog>` hosting a small `CategoryFormModel` form per [data-model.md §7](./data-model.md#7-categoryformmodel). Delete shows confirmation, then calls store. Depends on T006, T007, T009.

### Implementation for User Story 1 — Products list

- [X] T011 [US1] Create `alatar-angular/src/app/admin/sections/products/admin-catalog.store.ts` per [data-model.md §4 + §10](./data-model.md#4-admincatalogfilterstate-url-bound). Signals: `items`, `isLoading`, `hasError`, `errorMessage`, `filter` (`AdminCatalogFilterState`). Methods: `ensureLoaded()`, `reload()`, `setFilter(updater)`, `clearFilters()`, `applyOptimisticStatus(productId, newStatus, rollback)`. Includes pure helpers `serializeFilterState(state): Params` and `parseFilterState(params): AdminCatalogFilterState`. Filtering runs client-side over the cached full list (matches Spec 001's pattern); server-side filtering is a one-file swap when the backend gains query params.
- [X] T012 [P] [US1] Create `alatar-angular/src/app/admin/sections/products/components/products-filters.component.ts`. Renders chip groups for Status (Valid / Coming Soon / Invalid), Type (Fruit / Vegetable), State (Fresh / Frozen), Season (Summer / Winter / AllYear), plus a debounced (250ms) search input bound to `state.search`. Inputs: current filter state. Outputs: `(filterChange)` per chip click, `(searchChange)` from search input, `(clearAll)` from "Clear filters" action. Uses Spec 001's `<ui-button variant="ghost">` for chips and `<ui-input>` for search.
- [X] T013 [P] [US1] Create `alatar-angular/src/app/admin/sections/products/components/products-list-table.component.ts`. Wraps `<admin-data-table>` with the products columns config: thumbnail (uses Spec 001's `<ui-image>` aspect=1/1), bilingual name (`LocalizedTextPipe`), SKU, status pill (`<ui-badge>` with tone derived from status), type, state, season, stock, price. Row click navigates to `/admin/products/:id/edit`. Status pill is non-interactive in the list — status changes happen on the edit page (per data-model invariant 7).
- [X] T014 [US1] Rework `alatar-angular/src/app/admin/sections/products/products.page.ts` and `products.page.html` (currently 37-line placeholders) to:
  1. Inject `AdminCatalogStore`, `CategoriesStore`, `ActivatedRoute`, `Router`.
  2. On init, parse `route.queryParamMap` → `parseFilterState` → `store.setFilter()`. Subscribe to filter signal and push `serializeFilterState` to URL via `router.navigate([], { queryParams, queryParamsHandling: 'merge' })`.
  3. Compose: `<admin-page-header>` (title, subtitle, "+ New product" CTA navigating to `/admin/products/new`) + `<app-products-filters>` + `<app-products-list-table>` + `<app-categories-pane>` (in a separate `<admin-section-card>` below the products section).
  4. Show `<ui-error-state>` above the table when `store.hasError() === true`.
  Depends on T010, T011, T012, T013.

### Implementation for User Story 1 — Product create/edit (full-page route per Q3 clarification)

- [ ] T015 [US1] Create `alatar-angular/src/app/admin/sections/products/product-edit.store.ts`. Signals: `product` (loaded `ProductListItem` or `null`), `isLoading`, `hasError`, `errorMessage`, `imageGalleryState` (per [data-model.md §6](./data-model.md#6-productimagegallerystate-edit-page)). Methods: `loadProduct(id)`, `applyOptimisticStatus(newStatus)`, `addPendingUploads(files)`, `clearPendingUpload(tempKey)`, `applyServerImages(images)`, `removeImage(imageId)`. Image add/delete operations call the existing `ProductService` methods.
- [ ] T016 [P] [US1] Create `alatar-angular/src/app/admin/sections/products/components/option-groups-editor.component.ts` per [data-model.md §5 (option groups) + research.md §8](./research.md#8--bilingual-options-editor-ux). Renders 5 group sections (Varieties, Packaging, Weight, Size, Grade). Each row is two side-by-side `<ui-input>`s (EN / AR) plus a remove button. Add-row button per group. Implements `ControlValueAccessor` so it plugs directly into the parent typed reactive form as a single `FormArray<OptionRowGroup>` per group. On serialization to backend (handled in the parent form): empty AR → `"<EN>"`; non-empty AR → `"<EN> | <AR>"`. Legacy single-language strings render with EN populated and AR empty (per Q4 clarification).
- [ ] T017 [P] [US1] Create `alatar-angular/src/app/admin/sections/products/components/image-gallery-editor.component.ts` per [data-model.md §6 + research.md §9](./research.md#9--image-gallery-editor-ux). Renders the image grid (3-col desktop / 2-col mobile) using `<ui-image>`; the first thumbnail carries a "Primary" badge. Drop-zone + `<input type="file" multiple accept="image/*">` for adding images. Pre-checks file type (starts with `image/`) and size (≤5MB) before upload. Per-file progress overlay. Per-file error with Retry. Delete via `<admin-confirm-dialog>`. Reorder is **out of scope this iteration** (no backend endpoint per research §9). Inputs: `[productId]`, `[state]: ProductImageGalleryState`. Outputs: `(filesPicked)`, `(deleteRequested)`.
- [ ] T018 [P] [US1] Create `alatar-angular/src/app/admin/sections/products/components/product-form.component.ts` per [data-model.md §5](./data-model.md#5-productformmodel-typed-reactive-form-for-create--edit). Builds the typed reactive `ProductFormModel` via `FormBuilder.nonNullable.group({...})`. Inputs: `[mode]: 'create' \| 'edit'`, `[initialValue]: Partial<ProductFormModel> \| null`. Outputs: `(submit)` emits the validated value; `(statusChange)` emits new status (edit mode only — fires the optimistic PATCH separately from main save). Uses Spec 001's `<ui-input>` and `<ui-select>` plus the new `<app-option-groups-editor>`. SKU input is `disabled` in edit mode (immutable). Validation per data-model §5 table.
- [ ] T019 [US1] Create `alatar-angular/src/app/admin/sections/products/product-edit.page.ts` and `product-edit.page.html`. The component:
  1. Reads the route param `id` (or detects the `/new` segment) to determine create vs edit mode.
  2. In edit mode, on init calls `ProductEditStore.loadProduct(id)`; renders `<ui-skeleton>` until loaded. If product not found / Invalid, render `<ui-empty-state>` with a back-to-list link.
  3. Renders `<admin-page-header>` (title from product name in edit mode, "New product" in create) + `<app-product-form>` + (edit mode only) `<app-image-gallery-editor>`.
  4. On `(submit)` from the form: call `ProductService.createProduct()` (create mode) or `updateProduct()` (edit mode). Create success → `router.navigate(['/admin/products', newId, 'edit'])` (per Q1 + Q3 clarifications). Edit success → toast.success + reload product. Failure → toast.error with Retry, form preserved.
  5. On `(statusChange)` from the form (edit only): use `optimistic()` helper to call `ProductService.changeProductStatus()`; rollback on failure.
  6. On `(filesPicked)` from gallery: call `ProductService.uploadProductImages()` per file with progress.
  7. On `(deleteRequested)` from gallery: open `<admin-confirm-dialog>`, on confirm call `ProductService.deleteProductImage()`.
  Depends on T002, T006, T015, T016, T017, T018.
- [ ] T020 [US1] Update `alatar-angular/src/app/admin/admin.routes.ts` to add `/admin/products/new` and `/admin/products/:id/edit` routes (lazy-loaded standalone component for `ProductEditPageComponent`). Both routes use `data: { sectionId: 'products', titleKey: 'admin.nav.products' }` so the existing sidebar highlight / breadcrumb logic continues working. Depends on T019.

### Translations

- [X] T021 [US1] Add admin-products translation keys to all three i18n JSON files (`alatar-angular/public/assets/i18n/{ar,en,ru}.json`) under `admin.products.*` and `admin.categories.*`: page titles + subtitles, list column headers, filter labels and chip values, search placeholder, "+ New product" CTA, "+ Add category" CTA, status values (Valid / Coming Soon / Invalid), edit page section titles ("Identity", "Pricing & Stock", "Description", "Classification", "Status", "Varieties", "Packaging", "Weight", "Size", "Grade", "Images"), form field labels and placeholders, validation error messages (required, min length, pattern, min value), success/failure toasts ("Product saved", "Status updated", "Could not save", "Could not change status — Retry"), confirm-dialog titles/bodies for delete (product image, category), empty-state copy for "no products" / "no categories", error-state copy with Retry. AR is authoritative; EN translated; RU may temporarily mirror EN. **Note**: Edit-page-specific keys ("Identity", "Pricing & Stock", form fields, validation messages, image gallery copy) will be added with T015–T020 in the next round.

### Verification

- [ ] T022 [US1] Run the US1 smoke test in [quickstart.md](./quickstart.md#smoke-test--user-story-1-products--categories): categories CRUD, products list filters + URL round-trip, product create with two-step transition to edit, image upload + delete, status change with optimistic update + toast, bilingual option editor including legacy data, AR/EN toggle preserves form values.

**Checkpoint**: US1 fully functional and demoable as standalone MVP.

---

## Phase 4 — User Stories US2–US6 (Deferred)

The spec defines five additional user stories. Each is independently shippable and will be expanded into its own task block once its design artifacts are written.

| # | Story | Status | What's needed before tasks can be generated |
|---|---|---|---|
| US2 | Order Requests inbox | **Deferred** | Add `OrderRequestViewModel` + `PaginationState` + `OrderStatusWorkflow` to [data-model.md](./data-model.md); add `contracts/order-requests.api.md`. Foundational tasks: `<admin-side-drawer>`, `<admin-status-workflow>`, `<admin-pagination>`, `order-status.workflow.ts`. |
| US3 | Contact Leads inbox | **Deferred** | Add `ContactLeadViewModel` + `ContactStatusWorkflow` to data-model; add `contracts/contacts.api.md`. Reuses US2's primitives (drawer, status workflow, pagination). |
| US4 | Social Links manager | **Deferred** | Add `SocialLinkFormModel` + drag-drop reorder model to data-model; add `contracts/social-links.api.md`. Foundational tasks: `<admin-drag-drop-list>` directive, `social-link-form-dialog.component.ts` (reuses `<admin-confirm-dialog>` shell). |
| US5 | Overview dashboard | **Deferred** | Add `KpiTileData` + `ActivityFeedItem` + iterative-fetch helper to data-model. Foundational tasks: `iterative-fetch-recent.ts`, `<admin-kpi-tile>`, `<app-activity-feed>`. Depends partly on US2/US3 stores being available. |
| US6 | Settings & Profile | **Deferred** | Smallest story (read profile + logout). Tasks will fit in 3–4 entries. Can ship in parallel with US2 since it has no shared dependencies beyond auth. |

To expand any of these into actionable tasks: extend [data-model.md](./data-model.md) with that story's models, add the relevant `contracts/{section}.api.md`, and re-run `/speckit-tasks`. The next pass will detect the new design artifacts and produce a tasks block for that story.

---

## Phase 5: Polish & Cross-Cutting (US1 scope)

**Purpose**: Quality gates after US1 lands. Polish for US2–US6 will be added when those stories complete.

- [ ] T023 [P] Run `/ss-lint` against `alatar-angular/src/app/admin/sections/products/` and `alatar-angular/src/app/admin/shared/`. Fix any violations. Document intentional deviations in [research.md](./research.md) §1 if applicable.
- [ ] T024 [P] Run `/ss-a11y` audit on `/admin/products` and `/admin/products/:id/edit`. Verify: WCAG AA contrast on text, 44×44px touch targets on all interactive elements, focus-visible rings, `aria-invalid` / `aria-describedby` on form fields, document direction (`<html dir>`) flips correctly with language toggle, no information conveyed by color alone (status pill carries text label too).
- [ ] T025 Manual bilingual end-to-end pass in AR, then EN, then RU on `/admin/products` list, create form, edit form, image gallery, categories pane. Verify SC-001 (find any product ≤30s), SC-002 (status transition <1s perceived), SC-003 (full create + image flow <5min), SC-005 (100% language parity), SC-007 (status transition in 2 clicks), SC-009 (all destructive actions confirmed), SC-012 (optimistic rollback on server error fires a visible toast).
- [ ] T026 Performance check: load `/admin/products` against the seeded 34-product dataset, then synthetically extend (stub `ProductService.getProducts()` to return 500 mocked items), confirm filter and search remain smooth (no dropped frames, filter response <1s). Verifies SC-002, SC-004 implication for the products list.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies, instant.
- **Foundational (Phase 2)**: blocks US1. T002 + T003 are independent. T004 depends on T003. T005 depends on T004. T006 + T007 are independent.
- **US1 (Phase 3)**: depends on Phase 2. Within US1, tasks are in implementation order with clear file-level parallelism.
- **US2–US6 (Phase 4)**: deferred — each requires its own design artifacts before tasks can be authored.
- **Polish (Phase 5)**: depends on US1 being complete.

### Within User Story 1

- T008 (categories service extension) → T009 (categories store) → T010 (categories pane).
- T011 (catalog store) → T012, T013 parallel (filters + table) → T014 (page composition).
- T015 (edit store) → T016, T017, T018 parallel (option editor + gallery + form) → T019 (edit page composition) → T020 (route registration).
- T021 (translations) sequences with T010 / T014 / T019 because UI strings reference these keys.
- T022 (smoke test) depends on T020 + T021.

### Parallel Opportunities

- **Phase 2**: T002, T003, T006, T007 in parallel (4 tasks). T004 then T005 sequential.
- **US1**: T008 || (T011) — both independent; T012, T013 parallel after T011; T015, T016, T017, T018 parallel after T011/T015; categories pane (T009 → T010) parallel with products list track.

---

## Parallel Example: Phase 2 (Foundational)

```text
# Run these 4 in parallel — different files, no inter-dependencies:
Task: T002 — optimistic.helper.ts
Task: T003 — toast.service.ts
Task: T006 — confirm-dialog.component.ts
Task: T007 — data-table.component.ts

# Then T004 (depends on T003), then T005 (depends on T004).
```

## Parallel Example: User Story 1 forms layer

```text
# After T011 (catalog store) and T015 (edit store) land:
Task: T012 — products-filters.component.ts
Task: T013 — products-list-table.component.ts
Task: T016 — option-groups-editor.component.ts
Task: T017 — image-gallery-editor.component.ts
Task: T018 — product-form.component.ts

# Then T014 (products page composition) and T019 (edit page composition) sequentially.
```

---

## Implementation Strategy

### MVP First (US1 only — this iteration)

1. Phase 1: Setup (T001).
2. Phase 2: Foundational (T002–T007) — parallel sprint.
3. Phase 3: US1 (T008–T022) — Products + Categories live in the dashboard.
4. **STOP and DEMO**: per the [quickstart.md demo script](./quickstart.md#demo-script-for-stakeholders-3-minutes). Other admin sections remain placeholders until their stories ship.

### Incremental Delivery (recommended)

1. Setup + Foundational complete → ship US1 → demo Products management.
2. Extend data-model + contracts for US2 (Orders inbox) → re-run `/speckit-tasks` → ship US2.
3. Same pattern for US3 (Contacts), US4 (Social Links), US5 (Overview), U6 (Settings).
4. Each story is independently shippable; rolling back any one of them does not break the others.

### Parallel Team Strategy (after US1 ships)

Once Phase 2 foundational primitives exist, multiple developers can take different stories simultaneously since each lives in its own `admin/sections/{section}/` folder:

- Developer A → US2 (Orders).
- Developer B → US3 (Contacts) — inherits 80% of US2's components (drawer, status workflow, pagination).
- Developer C → US4 (Social Links).

US5 (Overview) is best done last since it consumes the other stores. US6 (Settings) is small enough to fit in any developer's spare cycles.

---

## Notes

- The .NET backend is **not modified** by this feature. Every backend reference is read-only against the existing endpoints (see [contracts/](./contracts/)).
- The existing admin shell, sidebar, topbar, breadcrumbs, layout primitives (`admin/layout/*`), and auth guards are reused as-is. No edits to those files except the single shell-mount of `<admin-toast-host>` (T005).
- Spec 001's foundational layer (`shared/ui/*`, `core/i18n/*`, `shared/format/*`) is reused without modification.
- Optimistic updates with explicit rollback are wired only via the `optimistic()` helper (T002) to keep the rollback contract enforceable in one place.
- All admin-facing strings route through Transloco; no hard-coded language strings.
- StyleSeed rules adopted are those documented in [research.md §1 of Spec 001](../001-public-home-products/research.md). The Tailwind v4 + skin migration remains explicitly deferred.
- Tests are intentionally omitted per the spec; smoke checks in `quickstart.md` are the verification baseline. Unit tests (vitest) for the optimistic helper and form validators may be added post-MVP.
