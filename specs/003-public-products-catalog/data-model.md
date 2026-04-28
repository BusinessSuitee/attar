# Data Model: Public Products Catalog — "Field to Frame"

**Date**: 2026-04-28 | **Plan**: [plan.md](./plan.md)

---

## Frontend View Models

### `PublicProductCard`
Derived from `ProductListItem` for use in the catalog grid and season calendar.

```ts
interface PublicProductCard {
  id: string;
  name: string;               // EN
  nameAr: string;             // AR
  status: ProductStatus;      // 'Valid' | 'ComingSoon' | 'Invalid'
  productType: ProductType;   // 'Fruit' | 'Vegetable'
  productState: ProductState; // 'Fresh' | 'Frozen'
  season: ProductSeason;      // 'Summer' | 'Winter' | 'AllYear'
  thumbnailUrl: string | null;
  isInSeasonNow: boolean;     // derived — see season-calendar.utils.ts D-003
  accentColor: string;        // derived — see D-009, getCategoryAccent()
}
```

**Derivation**: `isInSeasonNow` and `accentColor` are computed by `ProductCatalogStore` (new) from `ProductListItem` fields + frontend utilities. They are **not** stored in the backend.

---

### `PublicProductDetail`
Full view model for the detail page — wraps `ProductListItem` with derived presentation fields.

```ts
interface PublicProductDetail {
  id: string;
  name: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  status: ProductStatus;
  productType: ProductType;
  productState: ProductState;
  season: ProductSeason;
  varieties: string[];
  packagingOptions: string[];
  weightOptions: string[];
  sizeOptions: string[];
  gradeOptions: string[];
  imageUrls: string[];        // ordered; first = primary
  isInSeasonNow: boolean;
  availableMonths: number[];  // [1..12], derived from season
  accentColor: string;
}
```

---

### `CategoryLane`
View model for a category navigation lane.

```ts
interface CategoryLane {
  key: 'all' | 'Fruit' | 'Vegetable' | 'Frozen';
  labelKey: string;           // i18n key
  coverImageUrl: string | null; // first Valid product image in category
  accentColor: string;
  productCount: number;
}
```

**Derivation**: Built from `ProductsStore.validProductsByCategory` + `CategoryService`. Cover image is the `thumbnailUrl` of the first `Valid` product in the category.

---

### `SeasonCalendarRow`
One row in the `/seasons` grid — one product across 12 months.

```ts
interface SeasonCalendarRow {
  productId: string;
  name: string;
  nameAr: string;
  thumbnailUrl: string | null;
  accentColor: string;
  availableMonths: number[];  // subset of [1..12]
}
```

---

### `CatalogFilterState`
URL-serializable filter state for the catalog page.

```ts
interface CatalogFilterState {
  category: 'all' | 'Fruit' | 'Vegetable' | 'Frozen';
  season: 'all' | 'Summer' | 'Winter' | 'AllYear';
  availability: 'all' | 'in-season' | 'coming-soon';
}

// URL query param keys: ?category=Fruit&season=Summer&availability=in-season
```

---

## Frontend Utilities (new files)

### `core/products/season-calendar.utils.ts`

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

export function isInSeasonNow(season: ProductSeason): boolean {
  const month = new Date().getMonth() + 1;
  return SEASON_MONTHS[season].includes(month);
}

export function getAvailableMonths(season: ProductSeason): number[] {
  return SEASON_MONTHS[season];
}

export function getCategoryAccent(type: ProductType, state: ProductState): string {
  const key = state === 'Frozen' ? 'Frozen' : `${type}-${state}`;
  return CATEGORY_ACCENT[key] ?? '#94a3b8';
}
```

---

## Store Design

### `PublicCatalogStore` — NEW (`pages/products/public-catalog.store.ts`)

Signal-based store that wraps `ProductsStore` and layers catalog-specific concerns.

| Signal | Type | Description |
|--------|------|-------------|
| `filter` | `Signal<CatalogFilterState>` | Active filter; synced to/from URL |
| `visiblePage` | `Signal<number>` | Number of 12-item batches shown |
| `visibleItems` | `Computed<PublicProductCard[]>` | Filtered + sliced items for current page |
| `hasMore` | `Computed<boolean>` | True if more items exist beyond current page |
| `categoryLanes` | `Computed<CategoryLane[]>` | All + per-type lanes with derived cover images |
| `isLoading` | delegates to `ProductsStore` | |
| `hasError` | delegates to `ProductsStore` | |

**Methods**:
- `setFilter(patch: Partial<CatalogFilterState>): void`
- `resetFilter(): void`
- `loadMore(): void` — increments `visiblePage`

**URL state**: On `ngOnInit`, reads `?category`, `?season`, `?availability` from query params. On `filter` change, pushes to URL via `Router.navigate([], { queryParams })`.

---

## Route Parameters

| Route | Param | Mapped to |
|-------|-------|-----------|
| `/products` | `?category`, `?season`, `?availability` | `CatalogFilterState` |
| `/products/:id` | `:id` | `ProductsStore.productById(id)` |
| `/seasons` | none | all `Valid` + `ComingSoon` products |

---

## State Transitions (Detail Page)

```
Gallery state:
  activeIndex: 0..n-1
  On swipe left  → activeIndex = min(activeIndex + 1, n-1)
  On swipe right → activeIndex = max(activeIndex - 1, 0)
  On thumb click → activeIndex = clicked index
  On keyboard →   → ArrowRight increments, ArrowLeft decrements

Season calendar popover:
  selectedCell: { productId, monthIndex } | null
  On cell click  → selectedCell = { productId, monthIndex }
  On backdrop    → selectedCell = null
  On ESC         → selectedCell = null
```

---

## i18n Keys — New Namespace `products_v2.*`

New keys added to `en.json` / `ar.json` / `ru.json`:

```jsonc
"products_v2": {
  "catalog": {
    "category_all": "All Products",
    "in_season_badge": "In Season",
    "coming_soon_badge": "Coming Soon",
    "filter_availability_all": "All",
    "filter_availability_in_season": "In Season Now",
    "filter_availability_coming_soon": "Coming Soon",
    "load_more": "Load more products",
    "empty": "No products match your selection.",
    "empty_action": "Clear filters",
    "no_image": "No image available"
  },
  "detail": {
    "contact_cta": "Contact to Order",
    "specs_title": "Packaging & Specs",
    "story_title": "How we grow it",
    "related_title": "You might also like",
    "availability_title": "Seasonal availability",
    "not_found": "Product not found.",
    "not_found_cta": "Browse all products",
    "gallery_prev": "Previous image",
    "gallery_next": "Next image",
    "image_counter": "{{current}} / {{total}}"
  },
  "seasons": {
    "page_title": "Season Calendar",
    "page_subtitle": "Plan your procurement — see which crops are available each month.",
    "view_product": "View product →",
    "month_1": "Jan", "month_2": "Feb", "month_3": "Mar",
    "month_4": "Apr", "month_5": "May", "month_6": "Jun",
    "month_7": "Jul", "month_8": "Aug", "month_9": "Sep",
    "month_10": "Oct", "month_11": "Nov", "month_12": "Dec"
  }
}
```
