# Phase 1 Data Model — Public Homepage & Products Catalog

**Date**: 2026-04-27
**Feature**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Research**: [research.md](./research.md)

This document describes the **frontend** view models, form models, and URL state shapes used by the homepage, catalog, product detail, and order request flow. It does NOT redefine the backend's domain model — it describes how the frontend interprets and shapes the data it consumes.

For the backend's actual response shapes, see [contracts/](./contracts/).

---

## 1. Product (frontend view model)

Source: `GET /api/products` returns `ProductListItem[]` (already typed at `core/products/product.service.ts`).

### Fields consumed by public pages

| Field | Type | Used for |
|-------|------|----------|
| `id` | `string` (uuid) | route param, list keying |
| `name` | `string` | English name |
| `nameAr` | `string` | Arabic name |
| `descriptionEn` | `string` | English description (detail page) |
| `descriptionAr` | `string` | Arabic description (detail page) |
| `productType` | `'Fruit' \| 'Vegetable'` | filter dimension, badge |
| `productState` | `'Fresh' \| 'Frozen'` | filter dimension, badge |
| `season` | `'Summer' \| 'Winter' \| 'AllYear'` | filter dimension, badge |
| `status` | `'Valid' \| 'ComingSoon' \| 'Invalid'` | catalog visibility, "Coming Soon" badge, order CTA gating |
| `varieties` | `string[]` | option group on detail |
| `packagingOptions` | `string[]` | option group on detail |
| `weightOptions` | `string[]` | option group on detail |
| `sizeOptions` | `string[]` | option group on detail |
| `gradeOptions` | `string[]` | option group on detail |
| `imageUrls` / `images` | `string[]` / `{id,url}[]` | gallery on detail, primary image on cards |

### Fields explicitly hidden on the public site

`price`, `stockQuantity`, `sku` — never rendered to public visitors (per spec assumptions: B2B inquiry, no e-commerce surface).

### Derived fields (computed on the client)

| Computed | How |
|----------|-----|
| `displayName` | localized-text helper picks `name` (EN) or `nameAr` (AR), falling back to whichever is non-empty if the active-language field is empty |
| `displayDescription` | same rule applied to `descriptionEn` / `descriptionAr` |
| `primaryImageUrl` | first entry of `images` (preferred for the `id` to support gallery navigation) or `imageUrls`, prefixed with `API_BASE_URL` if relative |
| `isOrderable` | `status === 'Valid'` |
| `isVisibleInCatalog` | `status !== 'Invalid'` |

### Future-extension slots

Card and detail layouts reserve a `metadata-row` and `attributes-block` slot for future fields (certifications, origin region, MOQ, lead time, harvest dates) that the backend may add. No view-model changes are made today.

---

## 2. Category (frontend view model)

Source: `GET /api/categories` (see [contracts/categories.api.md](./contracts/categories.api.md)).

| Field | Type | Used for |
|-------|------|----------|
| `id` | `string` (uuid) | filter param, route param if a category landing page is added later |
| `name` | `string` | English category name (homepage card title in EN) |
| `nameAr` | `string` | Arabic category name (homepage card title in AR) |
| `type` | `'Fruit' \| 'Vegetable' \| 'Frozen'` | optional badge on category card |
| `season` | `'Summer' \| 'Winter' \| 'AllYear'` | optional secondary badge |

### Derived

- `displayName` — localized-text rule.
- `homeCardImage` — best-effort: pick a representative product's primary image whose category matches; fall back to a per-`type` placeholder if none matches.

### Open contract item

Whether a `Product` exposes a `categoryId` is not yet confirmed (see research.md §2). The frontend's filter pipeline tolerates either path.

---

## 3. CatalogFilterState (URL-bound)

The catalog page serializes its filter state to and from the URL. This is the contract for FR-011 (shareable URLs).

### Shape

```ts
interface CatalogFilterState {
  search: string | null;        // free-text, trimmed
  categoryId: string | null;    // category UUID
  type: ProductType | null;     // 'Fruit' | 'Vegetable'
  state: ProductState | null;   // 'Fresh' | 'Frozen'
  season: ProductSeason | null; // 'Summer' | 'Winter' | 'AllYear'
  page: number;                 // 1-based; 1 by default
}
```

### URL serialization

Each non-null field maps to a query parameter:

- `?q=<search>` (omitted if empty)
- `?category=<id>`
- `?type=Fruit|Vegetable`
- `?state=Fresh|Frozen`
- `?season=Summer|Winter|AllYear`
- `?page=N` (omitted when `1`)

Example: `/products?type=Fruit&season=Winter&q=orange`

### Round-trip invariant

`deserialize(serialize(state)) === state` for any valid `CatalogFilterState`. Unknown query parameters are ignored (forward-compatibility).

### Reset behavior

"Clear all filters" sets every field back to its default (`null`/`1`). The URL is updated via `router.navigate([], { queryParams: {} })`.

---

## 4. PagedResult&lt;T&gt;

Used by `CatalogStore.query()` regardless of where filtering happens (client or server, per research §4).

```ts
interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
```

### Defaults

- `pageSize = CATALOG_PAGE_SIZE` (`24`).
- `page` starts at `1`.

### Behavior

- `hasMore = items.length + (page - 1) * pageSize < total`.
- "Load more" appends the next page's items to the visible list; the store keeps an `accumulated` array separate from the latest `items` page so re-filtering is clean.

---

## 5. OrderRequestForm (form model)

Powers the in-detail Order Request form. Posted to `POST /api/order-requests` via the existing `OrderRequestService`.

### Form group shape (Angular typed reactive form)

```ts
type OrderRequestForm = FormGroup<{
  requesterName:        FormControl<string>;     // required, ≥2 chars, trimmed on submit
  phoneNumber:          FormControl<string>;     // required, plausible format, length 6–20
  quantityTons:         FormControl<number>;     // required, > 0
  specialSpecification: FormControl<string>;     // optional notes

  // Single-select per option group on the public detail page (the backend accepts arrays;
  // we send a 0- or 1-length array for simplicity now and can switch to multi-select later
  // without backend changes).
  selectedVariety:      FormControl<string | null>;
  selectedPackaging:    FormControl<string | null>;
  selectedWeight:       FormControl<string | null>;
  selectedSize:         FormControl<string | null>;
  selectedGrade:        FormControl<string | null>;
}>;
```

### Validation rules

| Control | Rule | Error key |
|---------|------|-----------|
| `requesterName` | required, min length 2 | `required`, `minlength` |
| `phoneNumber` | required, regex `/^[+\d][\d\s\-()]{5,19}$/` | `required`, `pattern` |
| `quantityTons` | required, > 0 | `required`, `min` |
| `specialSpecification` | none | — |
| `selectedVariety/Packaging/Weight/Size/Grade` | none (optional even if the product offers options) | — |

### Submission mapping (frontend → backend)

Maps to the existing `CreateOrderRequestPayload` typed at `core/orders/order-request.service.ts`:

```ts
{
  productId,                                                // from route
  selectedVarieties:        selectedVariety   ? [selectedVariety]   : [],
  selectedPackagingOptions: selectedPackaging ? [selectedPackaging] : [],
  selectedWeightOptions:    selectedWeight    ? [selectedWeight]    : [],
  selectedSizeOptions:      selectedSize      ? [selectedSize]      : [],
  selectedGradeOptions:     selectedGrade     ? [selectedGrade]     : [],
  specialSpecification:     specialSpecification?.trim() || null,
  requesterName:            requesterName.trim(),
  phoneNumber:              phoneNumber.trim(),
  quantityTons,
}
```

### Lifecycle

| State | UI |
|-------|----|
| pristine, invalid | submit button disabled |
| dirty, invalid | inline errors on touched fields, submit disabled |
| dirty, valid | submit enabled |
| submitting | submit button shows spinner, form locked |
| success | success banner, form reset, close after 3s OR keep visible until dismissed |
| failure | error banner, form values preserved, submit re-enabled |

---

## 6. LanguagePreference (client-side)

```ts
type LanguagePreference = 'ar' | 'en' | 'ru';
```

### Storage

- Key: `attar.lang`
- Storage: `localStorage` (browser only; `isPlatformBrowser` guarded).
- Lifecycle:
  - On boot (browser): if key exists and is a valid `LanguagePreference`, use it. Otherwise, infer from `navigator.language` (`en-*` → `en`, `ru-*` → `ru`, anything else → `ar`). Do NOT write the inferred value — only the explicit toggle writes.
  - On toggle: write the new value.
  - On SSR: always render in default `ar`.

### Bridge to Transloco

A `LanguagePreferenceService` is the only place that calls `transloco.setActiveLang()`. Components read the active language via `current-lang.signal.ts` (a signal wrapping Transloco's `langChanges$`).

---

## 7. SocialLinkRef (already typed in core)

Source: `GET /api/social-links` (already typed at `core/social-links/social-link.service.ts` as `SocialLinkDto`).

The homepage `social-strip.component.ts` consumes only links where `isEnabled === true`, ordered by `displayOrder`. No transformation needed.

Custom icons: prefer `customIconUrl` if present (relative to API base), else map `iconKey` to a Lucide-style icon (or text label fallback).

---

## 8. Entity relationship summary

```text
Visitor
  ├─► chooses LanguagePreference  (client-side, persisted)
  ├─► browses Product[]           (filtered through CatalogFilterState)
  │     └─► views one Product     (resolver-loaded for SSR + meta tags)
  │           └─► submits OrderRequestForm  → POST /api/order-requests
  └─► follows SocialLinkRef[]     (homepage strip, footer)

Category[] is read once per session and used:
  ├─► on homepage as featured cards
  └─► in catalog as a filter dimension (when products expose a category reference)
```

---

## 9. State transitions

Most of the public site is read-only state. Two transitions are worth being explicit about:

### CatalogFilterState transitions

```text
initial (from URL or all-null)
  │
  ├─ user types in search ──► debounced 250ms ──► state.search updated, page reset to 1
  ├─ user clicks filter chip ──► state field toggled, page reset to 1
  ├─ user clicks "Clear all" ──► all fields reset, page = 1
  └─ user clicks "Load more" ──► state.page incremented (no other field changes)

After every transition: serialize(state) → router.navigate replacing query params.
```

### OrderRequestForm transitions

```text
idle (form mounted)
  │
  ├─ user edits fields ──► dirty, validation runs on blur
  ├─ user clicks Submit (valid) ──► submitting
  │     ├─ 2xx ──► success, form reset
  │     └─ 4xx/5xx ──► failure, form values preserved, banner shown
  └─ user navigates away ──► form discarded (no unsaved-changes warning in v1)
```

---

## 10. Invariants

1. **A product with `status = 'Invalid'` is never visible** in the catalog or detail.
2. **A product with `status = 'ComingSoon'` is visible everywhere except the order CTA**, which is replaced by a "Coming Soon" notice.
3. **Pricing and stock are never rendered** to public visitors regardless of API response.
4. **No user-facing string is hard-coded in a single language** — all UI text routes through Transloco; all data text routes through the localized-text helper.
5. **The filter state in the URL is the single source of truth** for the catalog view; reloading the URL reproduces the view exactly.
6. **`CatalogStore.query()` is the only way the page reads products** — components never call `ProductService` directly. This keeps the future server-side migration localized.

---

## 11. Out of model

Explicitly *not* modeled in this feature:

- Buyer accounts, wishlists, carts, favorites.
- Saved searches.
- Multi-product order requests (one product per request).
- Internal admin / CRM data structures (separate spec).
- Analytics events (separate, additive concern).
