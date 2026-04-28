# Contract: Products API

**Consumed by**: `/products` catalog, `/products/:id` detail, `/seasons` calendar  
**Source**: Existing `GET /api/products` — no changes to this contract required.

---

## `GET /api/products`

Returns the full product list. No query parameters. No server-side pagination.

**Response** `200 OK`:
```json
[
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "Navel Orange",
    "nameAr": "برتقال نافل",
    "sku": "ORG-NAV-001",
    "price": 12.50,
    "stockQuantity": 500,
    "status": "Valid",
    "descriptionEn": "Premium Egyptian Navel oranges, hand-picked from our Nile Delta farms.",
    "descriptionAr": "برتقال نافل مصري فاخر، مقطوف يدوياً من مزارع دلتا النيل.",
    "productType": "Fruit",
    "productState": "Fresh",
    "season": "Winter",
    "varieties": ["Washington Navel", "Cara Cara"],
    "packagingOptions": ["10 kg carton", "5 kg bag"],
    "weightOptions": ["10 kg", "15 kg", "20 kg"],
    "sizeOptions": ["Size 48", "Size 56", "Size 64", "Size 72"],
    "gradeOptions": ["Grade A", "Grade B"],
    "imageUrls": [
      "https://cdn.example.com/products/navel-orange-1.jpg",
      "https://cdn.example.com/products/navel-orange-2.jpg"
    ],
    "images": [
      { "id": "img-001", "url": "https://cdn.example.com/products/navel-orange-1.jpg" }
    ]
  }
]
```

**Field notes relevant to this feature**:

| Field | Usage |
|-------|-------|
| `status` | Only `"Valid"` and `"ComingSoon"` products are shown publicly. `"Invalid"` are hidden. |
| `season` | Mapped to calendar months via `SEASON_MONTHS` utility (see data-model.md). |
| `imageUrls[0]` | Used as card thumbnail and gallery primary image. |
| `descriptionEn` / `descriptionAr` | Used as "How we grow it" story text. |
| `packagingOptions`, `weightOptions`, `sizeOptions`, `gradeOptions` | Rendered as chip groups in the Packaging & Specs panel. |

**No new endpoints required** for catalog, detail, or season calendar pages.

---

## `GET /api/categories`

**Response** `200 OK`:
```json
[
  {
    "id": "cat-001",
    "name": "Citrus",
    "nameAr": "حمضيات",
    "type": "Fruit",
    "season": "Winter"
  }
]
```

**Usage**: Category list is used to populate category lane labels and counts. Cover image is derived on the frontend (first `Valid` product image in each `productType + productState` group). The `CategoryDto` has no `coverImage` field — this is a frontend derivation, not a contract requirement.

**Note**: Category lanes in the new catalog are grouped by `productType + productState` (matching `ProductsStore.productsByCategory`), not by the `CategoryDto.id` from this endpoint. The categories endpoint is used for lane labels/counts only.
