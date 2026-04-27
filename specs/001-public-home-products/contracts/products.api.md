# Contract: Products API (as consumed by the public site)

**Endpoint**: `GET {API_BASE_URL}/api/products`
**Source of truth**: `alatar-angular/src/app/core/products/product.service.ts` (`ProductService.getProducts()`)

This document records the **observed shape** of the products endpoint based on the existing Angular type definitions. Backend authority lives in `alatar-dotnet/`.

## Request

```http
GET /api/products HTTP/1.1
```

No query parameters supported today (see research.md §4 for why this is acceptable for v1 of this feature).

No authentication required for the public consumer (the admin app uses the same endpoint with the auth interceptor adding a token when present).

## Response 200

```json
[
  {
    "id": "string (uuid)",
    "name": "string",
    "nameAr": "string",
    "sku": "string",
    "price": 0,
    "stockQuantity": 0,
    "status": "Valid" | "Invalid" | "ComingSoon",
    "descriptionEn": "string",
    "descriptionAr": "string",
    "productType": "Fruit" | "Vegetable",
    "productState": "Fresh" | "Frozen",
    "season": "Summer" | "Winter" | "AllYear",
    "varieties": ["string", "..."],
    "packagingOptions": ["string", "..."],
    "weightOptions": ["string", "..."],
    "sizeOptions": ["string", "..."],
    "gradeOptions": ["string", "..."],
    "imageUrls": ["string (relative or absolute)", "..."],
    "images": [
      { "id": "string (uuid)", "url": "string (relative or absolute)" }
    ]
  }
]
```

### Frontend handling

| Field | Public-site treatment |
|-------|----------------------|
| `price`, `stockQuantity`, `sku` | NEVER rendered |
| `status === 'Invalid'` | Filtered out of all public views |
| `status === 'ComingSoon'` | Visible in catalog and detail; order CTA hidden |
| `status === 'Valid'` | Fully visible; orderable |
| `name` / `nameAr` | Localized via current language |
| `descriptionEn` / `descriptionAr` | Localized; if active-language description is empty, the other language is shown with a notice |
| `imageUrls` / `images` | Either field may be relative or absolute. Frontend prefixes relative paths with `API_BASE_URL`. Prefer `images` (has `id`) for the gallery; fall back to `imageUrls` if `images` is empty/missing. |
| Option arrays (`varieties`, `packagingOptions`, etc.) | Rendered as-is via `LocalizedTextPipe`'s tolerant bilingual-split mode |

## Errors

| Status | Frontend behavior |
|--------|-------------------|
| 5xx, network failure | `CatalogStore` retries up to 2× with backoff (already implemented in the existing `ProductsStore`); after that, the page shows a non-blocking error banner with a Retry action. Page chrome remains usable. |
| Empty array (`200 []`) | Catalog shows the global empty state ("Catalog will be available shortly"); homepage hides featured products section. |

## Open items / soft contract

1. **No `categoryId` field per product today**. If/when the backend adds one, the catalog filter Category chip group is enabled (one-line change). See research.md §2.
2. **Option labels currently look like flat strings**. If the backend later returns `LocalizedProductOption[]` (`{key, en, ar}`), the frontend's `LocalizedTextPipe` is upgraded in one place. See research.md §3.
3. **No filter/pagination query parameters today**. When added, only `CatalogStore.query()` changes; pages don't.

## Future endpoint shape (informational, not prescriptive)

The frontend store calls `query({ filter, page, pageSize })`. When the backend formalizes query parameters, the call evolves to roughly:

```http
GET /api/products?type=Fruit&state=Fresh&season=Winter&category=<uuid>&q=orange&page=1&pageSize=24
```

Returning:

```json
{
  "items": [ /* ProductListItem[] */ ],
  "total": 0,
  "page": 1,
  "pageSize": 24,
  "totalPages": 0
}
```

This shape mirrors the `OrderRequestsPageResponse` and `ContactsPageResponse` already in use elsewhere — consistent across the codebase.
