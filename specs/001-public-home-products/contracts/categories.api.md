# Contract: Categories API (as consumed by the public site)

**Endpoint**: `GET {API_BASE_URL}/api/categories`
**Source of truth (frontend)**: a new `CategoryService` introduced by this feature at `alatar-angular/src/app/core/categories/category.service.ts`.

This endpoint is referenced by the spec but is not yet consumed by any frontend code. This document defines the **expected shape** the frontend will consume; if the backend response differs, we adapt the frontend type, not the backend.

## Request

```http
GET /api/categories HTTP/1.1
```

No query parameters. No authentication required.

## Expected response 200

```json
[
  {
    "id": "string (uuid)",
    "name": "string",
    "nameAr": "string",
    "type": "Fruit" | "Vegetable" | "Frozen",
    "season": "Summer" | "Winter" | "AllYear"
  }
]
```

## Frontend interface

```ts
// alatar-angular/src/app/core/categories/category.service.ts

export type CategoryType = 'Fruit' | 'Vegetable' | 'Frozen';
export type CategorySeason = 'Summer' | 'Winter' | 'AllYear';

export interface CategoryDto {
  id: string;
  name: string;
  nameAr: string;
  type: CategoryType;
  season: CategorySeason;
}

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly httpClient = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  getAll(): Observable<CategoryDto[]> {
    return this.httpClient.get<CategoryDto[]>(`${this.apiBaseUrl}/api/categories`);
  }
}
```

## Caching

Categories are read once per visit and cached in memory inside a small store; subsequent navigations within the SPA reuse the cached list. No browser persistence.

## Errors

| Status | Frontend behavior |
|--------|-------------------|
| 5xx, network failure | Featured-categories section on the homepage shows a friendly fallback ("Categories will be available shortly"). Catalog page falls back to type/state/season filter chips with no Category chip group. |
| Empty array | Same as failure: hide category-driven UI; type/state/season chips are still available on the catalog. |

## Open items

- The exact bilingual field naming (`name`/`nameAr` vs. `nameEn`/`nameAr`) needs verification when implementing. The frontend's `CategoryDto` mirrors the convention used in `ProductListItem`; if the backend returns differently, only this DTO changes.
- No category-to-product join is exposed today. See products.api.md "Open items" §1 for the implication.
