# Contract: Products API (admin perspective)

**Endpoints**:
- `GET {API_BASE_URL}/api/products` — list (admin sees all statuses)
- `POST {API_BASE_URL}/api/products` — create
- `PUT {API_BASE_URL}/api/products/{id}` — update
- `PATCH {API_BASE_URL}/api/products/{id}/status` — change status
- `POST {API_BASE_URL}/api/products/{id}/images` — upload one or many images (multipart)
- `DELETE {API_BASE_URL}/api/products/{id}/images/{imageId}` — delete one image

**Source of truth (frontend)**: `alatar-angular/src/app/core/products/product.service.ts`. All method signatures already exist; the admin dashboard reuses them as-is.

## GET /api/products

### Request

```http
GET /api/products HTTP/1.1
Authorization: Bearer <token>
```

No query parameters today. Returns the full product list including `Valid`, `Coming Soon`, and `Invalid` items.

### Response 200

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
    "imageUrls": ["string (relative)", "..."],
    "images": [{ "id": "string (uuid)", "url": "string (relative)" }]
  }
]
```

### Admin treatment

| Field | Admin behavior |
|-------|----------------|
| `price`, `stockQuantity` | **Visible** in list and edit form (admin-only fields). |
| `status` | All values shown; status pill in the list; status workflow control on detail. |
| `varieties` / `packagingOptions` / etc. | Rendered in the option-groups editor as bilingual two-input rows (per data-model §5). |
| `images` | Used as the source of truth for the image gallery (preferred over `imageUrls` because each image carries its own `id` for delete). |

## POST /api/products

### Request

```http
POST /api/products HTTP/1.1
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "string", "nameAr": "string", "sku": "string",
  "price": 0, "openingStock": 0,
  "descriptionEn": "string", "descriptionAr": "string",
  "productType": "Fruit" | "Vegetable",
  "productState": "Fresh" | "Frozen",
  "season": "Summer" | "Winter" | "AllYear",
  "varieties": ["string", "..."],
  "packagingOptions": ["string", "..."],
  "weightOptions": ["string", "..."],
  "sizeOptions": ["string", "..."],
  "gradeOptions": ["string", "..."]
}
```

Each option string is `"<EN>"` if the AR side is empty, or `"<EN> | <AR>"` otherwise (per research §8 + data-model §5).

### Response 200/201

```json
{ "productId": "string (uuid)" }
```

### Frontend handling

- On success, navigate to `/admin/products/<productId>/edit` (per Q1 clarification) so the admin can add images.
- On 4xx (e.g., duplicate SKU), surface the server message in a toast; preserve the form.

## PUT /api/products/{id}

### Request

```http
PUT /api/products/{id} HTTP/1.1
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "string", "nameAr": "string",
  "price": 0, "stockQuantity": 0,
  "descriptionEn": "string", "descriptionAr": "string",
  "productType": "...", "productState": "...", "season": "...",
  "varieties": ["string"], "packagingOptions": ["string"],
  "weightOptions": ["string"], "sizeOptions": ["string"], "gradeOptions": ["string"]
}
```

Note: `sku` is NOT in the update payload (immutable per backend convention). `status` is NOT in the update payload — use the dedicated PATCH endpoint.

### Response 200

```json
{ "productId": "string (uuid)" }
```

### Frontend handling

- Success: success toast; form remains open with fresh values from the server.
- Failure: error toast with retry; form values preserved.

## PATCH /api/products/{id}/status

### Request

```http
PATCH /api/products/{id}/status HTTP/1.1
Authorization: Bearer <token>
Content-Type: application/json

{ "status": "Valid" | "Invalid" | "ComingSoon" }
```

### Response 200

```json
{ "productId": "string (uuid)" }
```

### Frontend handling

- Wrapped in `optimistic()` (per data-model §8): UI updates immediately; rollback + error toast on failure.

## POST /api/products/{id}/images

### Request

```http
POST /api/products/{id}/images HTTP/1.1
Authorization: Bearer <token>
Content-Type: multipart/form-data

files=<binary>
files=<binary>   # multiple files allowed
```

### Response 200

```json
[
  { "id": "string (uuid)", "relativePath": "string", "displayOrder": 0 }
]
```

### Frontend handling

- Per-file progress via `HttpClient.request` with `reportProgress: true` (or per-file requests).
- Per-file error: failed file remains in the pending tiles with a Retry button; other files succeed and append to the gallery.
- Pre-upload validation: file type starts with `image/`; size ≤ 5MB.

## DELETE /api/products/{id}/images/{imageId}

### Request

```http
DELETE /api/products/{id}/images/{imageId} HTTP/1.1
Authorization: Bearer <token>
```

### Response 204

No body.

### Frontend handling

- Confirmation dialog before the call (FR-007).
- Non-optimistic: the image disappears from the gallery only after the server confirms.
- Failure: error toast; gallery unchanged.

## Future shape (informational)

When the backend adds query parameters to `GET /api/products`, the admin catalog store will swap its filter implementation from "client-side over the cached full list" to "server-side via query params" — single-file change.

```http
GET /api/products?status=Valid&type=Fruit&season=Winter&q=orange&page=1&pageSize=25
```

The store's `query()` interface is already shaped to accept this.
