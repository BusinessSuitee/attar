# Contract: Categories API (admin perspective)

**Endpoints**:
- `GET {API_BASE_URL}/api/categories` — list
- `POST {API_BASE_URL}/api/categories` — create
- `PUT {API_BASE_URL}/api/categories/{id}` — update
- `DELETE {API_BASE_URL}/api/categories/{id}` — delete

**Source of truth (frontend)**: `alatar-angular/src/app/core/categories/category.service.ts` (added in Spec 001). The admin dashboard adds the create/update/delete calls; the existing `getAll()` is reused.

## GET /api/categories

### Request

```http
GET /api/categories HTTP/1.1
```

No auth required for read. The admin uses the same endpoint the public site uses.

### Response 200

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

## POST /api/categories

### Request

```http
POST /api/categories HTTP/1.1
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "string",
  "nameAr": "string",
  "type": "Fruit" | "Vegetable" | "Frozen",
  "season": "Summer" | "Winter" | "AllYear"
}
```

### Response 200/201

```json
{ "categoryId": "string (uuid)" }
```

## PUT /api/categories/{id}

### Request

```http
PUT /api/categories/{id} HTTP/1.1
Authorization: Bearer <token>
Content-Type: application/json

{ "name": "string", "nameAr": "string", "type": "...", "season": "..." }
```

### Response 200

```json
{ "categoryId": "string (uuid)" }
```

## DELETE /api/categories/{id}

### Request

```http
DELETE /api/categories/{id} HTTP/1.1
Authorization: Bearer <token>
```

### Response 204 (no body) / 4xx if rejected

### Frontend handling

- Confirmation dialog before the call.
- Non-optimistic: the category disappears only after server confirmation.
- If the server rejects (e.g., category has products attached), surface the server message in a toast and keep the category visible.

## Frontend service additions

The existing `CategoryService` already exposes `getAll(): Observable<CategoryDto[]>`. This feature adds:

```ts
interface CreateCategoryPayload {
  name: string; nameAr: string; type: CategoryType; season: CategorySeason;
}
interface CategoryIdResponse { categoryId: string; }

class CategoryService {
  // EXISTING
  getAll(): Observable<CategoryDto[]>;

  // NEW (added by this feature)
  create(payload: CreateCategoryPayload): Observable<CategoryIdResponse>;
  update(id: string, payload: CreateCategoryPayload): Observable<CategoryIdResponse>;
  delete(id: string): Observable<void>;
}
```
