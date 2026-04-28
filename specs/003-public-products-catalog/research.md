# Phase 0 Research: Public Products Catalog — "Field to Frame"

**Date**: 2026-04-28 | **Plan**: [plan.md](./plan.md)

---

## Decision Log

### D-001 — Mosaic Grid Implementation

**Decision**: Pure CSS Grid with `grid-column: span 2` for hero cards. No JS layout library.

**Rationale**: The existing project uses Tailwind CSS 3.4. A two-column mosaic (hero card spans 2 cols, remaining cards fill 1 col each) is trivially expressed with CSS Grid's `auto-flow: dense` and a `span 2` class. No dependency, no JS reflow.

**Alternatives considered**: Masonry.js, Packery — rejected because they require JS-driven layout recalculation on every resize, which conflicts with Angular's `ChangeDetectionStrategy.OnPush` and introduces jank on filter transitions.

---

### D-002 — Category Lane Navigation

**Decision**: Horizontally scrollable `<div>` with `overflow-x: auto; scroll-snap-type: x mandatory`. No carousel library.

**Rationale**: The project already excludes new dependencies (plan constraint). CSS scroll-snapping gives smooth lane selection on both touch and mouse. Each lane is a `<button>` element containing a full-bleed `<img>` (covered by `object-fit: cover`) with the category name overlaid.

**Category cover photo source**: `CategoryDto` has no `coverImage` field. Solution: the category lane background is derived on the frontend by taking the first `Valid` product image from that category's product list (which is already loaded into `ProductsStore`). This requires no new API call.

---

### D-003 — "In Season Now" Detection

**Decision**: Frontend constant mapping `ProductSeason` → calendar month numbers. No new backend field.

**Rationale**: `ProductListItem.season` is already one of `Summer | Winter | AllYear`. Approximate month ranges are industry-standard for Egypt: Summer = Apr–Sep (months 4–9), Winter = Oct–Mar (months 10, 11, 12, 1, 2, 3), AllYear = all 12 months. A product is "in season now" when the current month falls in the product's season range.

```ts
// core/products/season-calendar.utils.ts
const SEASON_MONTHS: Record<ProductSeason, number[]> = {
  Summer:  [4, 5, 6, 7, 8, 9],
  Winter:  [10, 11, 12, 1, 2, 3],
  AllYear: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
};

export function isInSeasonNow(season: ProductSeason): boolean {
  const currentMonth = new Date().getMonth() + 1;
  return SEASON_MONTHS[season].includes(currentMonth);
}

export function getAvailableMonths(season: ProductSeason): number[] {
  return SEASON_MONTHS[season];
}
```

---

### D-004 — "Load More" Strategy

**Decision**: Client-side slicing of the already-loaded `ProductsStore.products` signal. Show first 12 items; "Load more" appends the next 12 from the cached signal.

**Rationale**: `ProductService.getProducts()` returns all products in one call (no server-side pagination). The store caches them in a signal. Implementing client-side "Load more" is a `computed` slice with a `pageSize` signal — zero additional HTTP calls.

**Alternative**: Lazy HTTP pagination — rejected because the backend endpoint returns all products and has no `?page=` parameter.

---

### D-005 — Image Gallery Swipe (Detail Page)

**Decision**: Reuse `swiper` 12 (already a project dependency from Spec 001) for the product detail gallery.

**Rationale**: `swiper` is already in `package.json`. It provides touch swipe, keyboard navigation, and loop support without adding a new dependency. The existing `product-detail.page.ts` uses manual `activeImageIndex` signal — we'll replace that with Swiper's Angular integration (`SwiperComponent`) for the new gallery component.

**Alternative**: Custom PointerEvents-based swipe — rejected because Swiper is already available and covers all edge cases (iOS momentum, keyboard, RTL).

---

### D-006 — Product Identifier in Routes (slug vs id)

**Decision**: Keep `id` as the route parameter. The route stays `/products/:id`. Rename the param semantically in templates as "product identifier." When the backend later adds slug support, the route can change to `/products/:slug` with a backward-compat redirect.

**Rationale**: `ProductListItem` has no `slug` field. The spec uses `[slug]` as a conceptual placeholder. Using ID avoids any new backend work and keeps the existing `ProductsStore.productById()` lookup intact.

---

### D-007 — Contact CTA Navigation (detail page)

**Decision**: The "Contact to Order" CTA navigates to `/contact?crop=[productName]`. The contact page's reactive form reads `crop` from query params on `ngOnInit` and pre-fills the crop field.

**Rationale**: The current products page opens an inline modal for both order request and contact — this was designed before dedicated product detail pages existed. The new architecture has a full detail page, so the CTA should navigate instead of open a modal. The contact page already exists at `/contact`; it just needs to read a `?crop=` query param.

**Impact**: The inline `OrderRequestFormState` and `ContactFormState` in the current `products.page.ts` become irrelevant for the new page and can be removed as part of the rework.

---

### D-008 — Season Calendar Popover

**Decision**: Native `<dialog>` element styled as an anchored popover, opened via `.showModal()` positioned relative to the clicked cell.

**Rationale**: No CDK or popup library is in scope. The `<dialog>` approach used in `confirm-dialog.component.ts` (admin) is already established. For the season calendar cell click, a dialog with `position: fixed` + JS-computed `top`/`left` from `getBoundingClientRect()` of the clicked cell achieves the popover effect. Backdrop click dismisses it.

---

### D-009 — Category Accent Colors

**Decision**: Frontend constant keyed to `productType + productState`:

```ts
// core/products/season-calendar.utils.ts
export const CATEGORY_ACCENT: Record<string, string> = {
  'Fruit-Fresh':     '#f97316',   // orange
  'Vegetable-Fresh': '#22c55e',   // green
  'Frozen':          '#0ea5e9',   // sky / ice blue
};

export function getCategoryAccent(type: ProductType, state: ProductState): string {
  const key = state === 'Frozen' ? 'Frozen' : `${type}-${state}`;
  return CATEGORY_ACCENT[key] ?? '#94a3b8';
}
```

---

### D-010 — Editorial Content Fields ("How we grow it")

**Decision**: Map `descriptionEn`/`descriptionAr` from `ProductListItem` to the "How we grow it" paragraph. The atmospheric image reuses the first product image (same as the gallery).

**Rationale**: No new backend fields needed. `ProductListItem` already has bilingual description fields. The editorial constraint (requiring the client to author rich per-product stories) remains — placeholders use the existing description text until the client provides richer copy.

---

### D-011 — Packaging Spec Display

**Decision**: Render `packagingOptions`, `weightOptions`, `sizeOptions`, `gradeOptions` as tagged chip lists in a structured panel (not a formal table), since the current data model stores these as flat `string[]` arrays without dimension/weight structured objects.

**Rationale**: `ProductListItem` has `packagingOptions: string[]`, `weightOptions: string[]`, etc. These are unstructured strings (e.g., "10 kg carton", "5 kg bag"). A structured table with columns (name / dimensions / weight) is not currently feasible without backend changes. The plan will render them as labeled chip groups within the specs panel, with a note that richer structured packaging data can be added in a future backend iteration.

---

### D-012 — SSR Compatibility

**Decision**: All three new/reworked pages MUST be SSR-compatible. The existing Angular config has SSR enabled for all public routes. Guard any `window`/`document`/`localStorage` access with `isPlatformBrowser`.

**Rationale**: Angular 21 with hydration + event replay is already configured for public pages (per plan.md Spec 001/002 context). The season calendar uses `new Date()` for "current month" — this must be deferred to `afterNextRender` or initialized via `PLATFORM_ID` to avoid hydration mismatches.

---

### D-013 — Removed Features from Existing Products Page

**Decision**: The new catalog page REMOVES the inline order-request modal and inline contact modal that exist in the current `products.page.ts`. These are replaced by:
- Order request → navigate to detail page, then use "Contact to Order" CTA
- Inline contact modal → `/contact?crop=[name]` navigation

**Rationale**: The existing modal UX was a stopgap for when there were no dedicated product detail pages. The new architecture separates browsing (catalog) from evaluation (detail) from conversion (contact). Removing the modals reduces the catalog page's complexity by ~300 lines.

---

## Resolved Clarifications

All spec clarifications are resolved:
- **Grade data (spec Q1)**: Deferred — grades page is explicitly out of scope for this plan.
- **Slug vs ID**: D-006 above — use ID, treat slug as a future enhancement.
- **Atmospheric image**: D-010 above — reuse first product image; editorial content uses existing description fields.
- **Packaging table**: D-011 above — render as chip groups given current flat-array data shape.
