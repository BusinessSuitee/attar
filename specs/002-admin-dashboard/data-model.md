# Phase 1 Data Model — Admin Dashboard (Products focus)

**Date**: 2026-04-27
**Feature**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Research**: [research.md](./research.md)

This document describes the **frontend** view models, form models, URL state, and helper shapes used by the admin dashboard. It is **scoped to the Products & Categories user story (US1)** plus the cross-cutting helpers that every section reuses (optimistic ops, toast queue, KPI fetch). Models for Orders, Contacts, Social Links, Overview, and Settings will be added in incremental updates as those user stories ship.

For the backend's actual response shapes, see [contracts/](./contracts/).

---

## 1. AdminUser (read-only, used by the shell)

Source: `GET /api/auth/me`. Already typed in `core/auth/`.

| Field | Type | Used for |
|-------|------|----------|
| `email` | `string` | shown in topbar user menu, settings page |
| `role` | `string` | always `"Admin"` for v1 (single role); reserved for future RBAC |
| `tokenExpiresAt` | `string` (ISO 8601) | shown on settings page; auth interceptor handles 401 if expired |

Lifetime: loaded once on shell mount; cached in an `AdminSessionStore`.

---

## 2. Product (admin view model)

Source: `GET /api/products` returns `ProductListItem[]` (already typed in `core/products/product.service.ts`). The admin sees **all** fields, including those hidden from the public site.

### Fields consumed by admin pages

| Field | Type | Visible on admin? |
|-------|------|-------------------|
| `id` | `string` (uuid) | yes (route param, list keying) |
| `name` | `string` | yes (EN name) |
| `nameAr` | `string` | yes (AR name) |
| `sku` | `string` | yes (read-only on edit) |
| `price` | `number` | **yes (admin-only)** |
| `stockQuantity` | `number` | **yes (admin-only)** |
| `status` | `'Valid' \| 'Invalid' \| 'ComingSoon'` | yes (status pill + transition) |
| `descriptionEn` | `string` | yes |
| `descriptionAr` | `string` | yes |
| `productType` | `'Fruit' \| 'Vegetable'` | yes (filter + form) |
| `productState` | `'Fresh' \| 'Frozen'` | yes (filter + form) |
| `season` | `'Summer' \| 'Winter' \| 'AllYear'` | yes (filter + form) |
| `varieties` | `string[]` | yes (option group editor) |
| `packagingOptions` | `string[]` | yes |
| `weightOptions` | `string[]` | yes |
| `sizeOptions` | `string[]` | yes |
| `gradeOptions` | `string[]` | yes |
| `imageUrls` / `images` | `string[]` / `{id,url}[]` | yes (gallery editor) |

### Derived computed fields

- `displayName(lang)` — uses `pickLocalized({ en: name, ar: nameAr }, lang)` from Spec 001.
- `displayDescription(lang)` — same pattern.
- `primaryImageUrl` — first entry of `images` (or `imageUrls`), prefixed with `API_BASE_URL` if relative.
- `statusTone` — `Valid → success`, `ComingSoon → warning`, `Invalid → neutral`.

### Future extension slot (FR-040 / FR-062 reuse)

The product card and list row reserve a `meta-row` slot. New fields the backend may add later (certifications, origin region, MOQ, lead time, harvest dates) are rendered there without redesigning. No view-model changes needed today.

---

## 3. Category (admin view model)

Source: `GET /api/categories`. See [contracts/categories.api.md](./contracts/categories.api.md).

| Field | Type |
|-------|------|
| `id` | `string` (uuid) |
| `name` | `string` (EN) |
| `nameAr` | `string` (AR) |
| `type` | `'Fruit' \| 'Vegetable' \| 'Frozen'` |
| `season` | `'Summer' \| 'Winter' \| 'AllYear'` |

Used in the Categories sub-pane on the products page (FR-011..015).

---

## 4. AdminCatalogFilterState (URL-bound)

The Products list page (`/admin/products`) serializes its filter state to and from the URL so an admin can share or bookmark a filtered view.

```ts
interface AdminCatalogFilterState {
  search: string | null;        // matches name (EN/AR) and SKU, case-insensitive
  status: ProductStatus | null; // 'Valid' | 'Invalid' | 'ComingSoon'
  type: ProductType | null;     // 'Fruit' | 'Vegetable'
  state: ProductState | null;   // 'Fresh' | 'Frozen'
  season: ProductSeason | null; // 'Summer' | 'Winter' | 'AllYear'
}
```

### URL serialization

- `?q=<search>` (omitted if empty)
- `?status=Valid|Invalid|ComingSoon`
- `?type=Fruit|Vegetable`
- `?state=Fresh|Frozen`
- `?season=Summer|Winter|AllYear`

Round-trip invariant: `parse(serialize(state)) === state` for any valid state.

> **Note**: unlike the public catalog (Spec 001), the admin catalog does **not** filter `Invalid` products by default; the admin sees everything.

---

## 5. ProductFormModel (typed reactive form for create + edit)

Powers `/admin/products/new` and `/admin/products/:id/edit`. One form group used in both modes; create mode hides nothing but resets to defaults; edit mode pre-fills from the loaded product.

```ts
type ProductFormModel = FormGroup<{
  // Identity
  name:           FormControl<string>;     // EN name, required, ≥2 chars
  nameAr:         FormControl<string>;     // AR name, required, ≥2 chars
  sku:            FormControl<string>;     // required, ≥3 chars, immutable on edit (disabled control)

  // Pricing & stock (admin-only fields)
  price:          FormControl<number>;     // required, ≥0
  openingStock:   FormControl<number>;     // create only; required, ≥0
  stockQuantity:  FormControl<number>;     // edit only; required, ≥0

  // Description
  descriptionEn:  FormControl<string>;     // optional, free text
  descriptionAr:  FormControl<string>;     // optional, free text

  // Classification
  productType:    FormControl<'Fruit' | 'Vegetable'>;
  productState:   FormControl<'Fresh' | 'Frozen'>;
  season:         FormControl<'Summer' | 'Winter' | 'AllYear'>;

  // Status (edit only — create defaults to 'Valid' server-side)
  status:         FormControl<ProductStatus | null>;

  // Option groups (each group is a FormArray of bilingual rows)
  varieties:        FormArray<OptionRowGroup>;
  packagingOptions: FormArray<OptionRowGroup>;
  weightOptions:    FormArray<OptionRowGroup>;
  sizeOptions:      FormArray<OptionRowGroup>;
  gradeOptions:     FormArray<OptionRowGroup>;
}>;

type OptionRowGroup = FormGroup<{
  en: FormControl<string>;   // EN label, ≥1 char
  ar: FormControl<string>;   // AR label, optional but encouraged
}>;
```

### Validation rules

| Control | Rule | Error key |
|---------|------|-----------|
| `name` | required, min length 2 | `required`, `minlength` |
| `nameAr` | required, min length 2 | `required`, `minlength` |
| `sku` | required (create), min length 3, regex `/^[A-Z0-9-]+$/i` | `required`, `pattern` |
| `price` | required, ≥0 | `required`, `min` |
| `openingStock` / `stockQuantity` | required, ≥0 | `required`, `min` |
| `productType` | required (one of) | `required` |
| `productState` | required (one of) | `required` |
| `season` | required (one of) | `required` |
| Option `en` | required when row exists, ≥1 char | `required`, `minlength` |
| Option `ar` | none (optional; legacy single-language entries supported per Q4) | — |

### Submission mapping (form → backend)

**Create** (`POST /api/products`):
- Each option row serializes to a single string: `ar.trim()` empty ? `en.trim()` : `\`${en.trim()} | ${ar.trim()}\`` (per research §8).
- Maps to `CreateProductPayload` already typed in `ProductService`.
- After successful create, the page transitions to `/admin/products/:newId/edit` (per Q1 clarification) so the admin can add images.

**Edit** (`PUT /api/products/{id}`):
- Same option serialization.
- Maps to `UpdateProductPayload`.
- SKU is excluded from the payload (immutable per backend convention).
- Status changes use the **separate** `PATCH /api/products/{id}/status` endpoint, not the main update — so the form's `status` control fires its own optimistic call when changed.

### Lifecycle

| Form state | UI |
|------------|----|
| pristine, invalid | "Save" disabled |
| dirty, invalid | inline errors on touched fields, "Save" disabled |
| dirty, valid | "Save" enabled |
| submitting | "Save" shows spinner, form locked |
| success (create) | navigate to `/admin/products/:id/edit`, success toast, image-gallery section enabled |
| success (edit) | success toast, form remains open with fresh values |
| failure | failure toast with Retry, form values preserved, "Save" re-enabled |

---

## 6. ProductImageGalleryState (edit page)

State for the image-gallery editor on `/admin/products/:id/edit`.

```ts
interface ProductImageGalleryState {
  productId: string;
  images: ProductImageInfo[];                              // server-confirmed gallery
  pendingUploads: Map<string, PendingUpload>;              // tempKey → upload progress
}

interface PendingUpload {
  tempKey: string;        // client-generated UUID for the pending tile
  fileName: string;
  progress: number;       // 0..100
  error: string | null;   // null = uploading; non-null = failed, retry available
}
```

### Behaviors

- On file drop or `<input type="file">` change, every selected file is added to `pendingUploads` with progress=0.
- Frontend pre-checks: file type starts with `image/`, file size ≤ 5MB. Failures are added to `pendingUploads` with an immediate `error` so the admin sees per-file feedback.
- Successful uploads append to `images` and remove from `pendingUploads`.
- Failed uploads stay in `pendingUploads` until the admin clicks Retry or X (dismiss).
- Delete is non-optimistic: opens `<admin-confirm-dialog>`, on confirm calls `DELETE /api/products/{id}/images/{imageId}`, on success removes from `images`.
- Reorder / change-primary: **out of scope this iteration** (no backend endpoint).

---

## 7. CategoryFormModel

Powers the categories sub-pane on `/admin/products`.

```ts
type CategoryFormModel = FormGroup<{
  name:    FormControl<string>;                                  // EN, required, ≥2
  nameAr:  FormControl<string>;                                  // AR, required, ≥2
  type:    FormControl<'Fruit' | 'Vegetable' | 'Frozen'>;        // required
  season:  FormControl<'Summer' | 'Winter' | 'AllYear'>;         // required
}>;
```

Used in two modes:
- **Create**: opened from a "+ Add category" button, hosted in `<admin-confirm-dialog>`.
- **Edit**: opened by clicking a category row, same dialog shell, pre-filled.

Submission maps to the backend's `POST /api/categories` and `PUT /api/categories/{id}` shapes.

Delete: non-optimistic (server may reject if products reference the category); on rejection, surface the error in a toast and keep the category visible.

---

## 8. OptimisticOperation&lt;T, R&gt; (cross-cutting helper)

Defined in `admin/shared/stores/optimistic.helper.ts`. Used by:

- Product status transition (`PATCH /api/products/{id}/status`)
- Order request status transition (when US2 lands)
- Contact status transition (when US3 lands)
- Social link enabled toggle (when US4 lands)
- Social link drag-drop reorder (when US4 lands)

```ts
interface OptimisticOptions<R> {
  applyLocally: () => void;            // e.g., update a signal-backed list
  callServer: () => Observable<R>;     // the HTTP call
  rollback: () => void;                // restore previous state on failure
  successMessage?: string;             // toast on success (optional)
  failureMessage?: string;             // toast on failure (optional, with Retry action)
}

function optimistic<R>(opts: OptimisticOptions<R>): void;
```

The helper:
1. Calls `applyLocally()` synchronously (UI updates immediately).
2. Subscribes to `callServer()`.
3. On success → optional success toast.
4. On error → `rollback()`, error toast with a Retry action that re-runs the same `optimistic()` call.

---

## 9. ToastQueueModel

Defined in `admin/shared/toasts/toast.service.ts`.

```ts
interface Toast {
  id: string;                     // for `track` in the host loop
  level: 'success' | 'error' | 'info';
  message: string;
  action?: { label: string; run: () => void };  // e.g., Retry
  createdAt: number;              // ms; used for auto-dismiss timing
  durationMs: number;             // 4000 success, 8000 error, 6000 info
}
```

The service exposes:
- `toasts: Signal<Toast[]>` — read by `<admin-toast-host>`.
- `success(message)`, `error(message, action?)`, `info(message)` — appends to the queue.
- `dismiss(id)` — removes a toast manually.
- Auto-dismiss is driven by `setTimeout` per toast, cancelled if dismissed early.

---

## 10. Shared list-store shape (used by US1 catalog and reusable by US2/US3)

Every list-style admin section's store follows this shape (so a new section is mostly a 50-LOC variant):

```ts
abstract class ListSectionStore<TItem, TFilter> {
  abstract readonly items:        Signal<TItem[]>;
  abstract readonly isLoading:    Signal<boolean>;
  abstract readonly hasError:     Signal<boolean>;
  abstract readonly errorMessage: Signal<string | null>;
  abstract readonly filter:       Signal<TFilter>;

  abstract setFilter(updater: (prev: TFilter) => TFilter): void;
  abstract reload(): void;

  // For paginated stores (orders, contacts):
  // abstract readonly page:     Signal<number>;
  // abstract readonly pageSize: Signal<number>;
  // abstract readonly total:    Signal<number>;
  // abstract setPage(page: number): void;
}
```

`AdminCatalogStore` is the concrete implementation for products. It does NOT paginate (the backend returns the full list today) but exposes the shape so future server-side pagination is a swap.

---

## 11. State transitions

### Products list filter

```text
initial (from URL or all-null)
  │
  ├─ user types in search ──► debounced 250ms ──► state.search updated
  ├─ user clicks filter chip ──► state field toggled
  └─ user clicks "Clear all" ──► all fields reset

After every transition: serialize(state) → router.navigate replacing query params.
```

### Product status

```text
Valid ◄──► ComingSoon ◄──► Invalid
  ▲                              │
  └──────────────────────────────┘ (any → any allowed)
```

Optimistic apply, rollback on server error. Status badge in the list row reflects the new value instantly.

### Product create flow

```text
[/admin/products/new] (form, no images section)
        │
        ├─ user fills + Save → POST /api/products
        │     ├─ success → router.navigate(`/admin/products/${newId}/edit`)
        │     │              (now image-gallery section is enabled — Q1 clarification)
        │     └─ failure → toast.error, form preserved
```

### Product edit flow

```text
[/admin/products/:id/edit]
        │
        ├─ user edits non-status field + Save → PUT /api/products/:id
        │     ├─ success → toast.success, form stays
        │     └─ failure → toast.error, form preserved
        │
        ├─ user clicks status action → optimistic PATCH /api/products/:id/status
        │     ├─ success → toast.success
        │     └─ failure → rollback + toast.error with Retry
        │
        ├─ user uploads images → POST /api/products/:id/images
        │     └─ per-file progress + error feedback
        │
        └─ user deletes image → confirm dialog → DELETE /api/products/:id/images/:imageId
              ├─ success → remove from gallery
              └─ failure → toast.error, gallery unchanged
```

---

## 12. Invariants (US1 scope)

1. **SKU is immutable on edit** — the form control is disabled in edit mode.
2. **Pricing and stock are visible to admins** — explicitly different from the public site.
3. **All product status values are visible** in the admin list (Valid + ComingSoon + Invalid) — the admin filters explicitly if they want a subset.
4. **Bilingual fields render two side-by-side inputs** — the `|` delimiter is invisible to the admin.
5. **Legacy single-language option strings render in both languages** without forcing a re-encode (per Q4 clarification).
6. **The create form has no image-gallery section**; images are only manageable on `:id/edit` (per Q1 clarification).
7. **Delete operations are never optimistic** — they wait for server confirmation, then remove from the UI.
8. **Status transitions are always optimistic** with explicit rollback on failure.
9. **Filter state in the URL is the single source of truth** for the products list view.

---

## 13. Out of model (US1 scope)

Not modeled in this iteration. Will be added when the relevant user story ships:

- **Order Request** view model and status workflow (US2).
- **Contact Lead** view model and status workflow (US3).
- **Social Link** view model, drag-drop reorder, custom icon upload (US4).
- **KPI tile** data model and "iterative-fetch until older" helper consumption (US5).
- **Activity feed** merged event model (US5).
- **Pagination state** for orders/contacts (US2/US3).
- **Settings/Profile** view (US6).
- **Lead scoring, sales-rep assignment, activity timeline, follow-up reminders, audit log** — explicit non-goals; not modeled.
