# Quickstart: Public Products Catalog — "Field to Frame"

**Date**: 2026-04-28

---

## Prerequisites

Same as Spec 001 — the existing Angular SPA + .NET backend already running.

```bash
# Backend (from alatar-dotnet/)
dotnet run

# Frontend (from alatar-angular/)
npm run dev
# → http://localhost:4200
```

Ensure `VITE_API_BASE_URL` in `.env` or `environment.ts` points to the running backend.

---

## Pages & Routes

| Route | Component | Status |
|-------|-----------|--------|
| `/products` | `ProductsPageComponent` | REWORK |
| `/products/:id` | `ProductDetailPageComponent` | REWORK |
| `/seasons` | `SeasonsPageComponent` | NEW |

---

## Smoke Tests

### 1. Catalog page — basic load
1. Navigate to `http://localhost:4200/products`
2. ✅ Category lanes appear at the top with crop photography
3. ✅ Products render in a mosaic grid (hero card + standard cards)
4. ✅ Products currently in season show a pulsing green "In Season" dot

### 2. Catalog — filter by category
1. Click "Fruit" category lane
2. ✅ Grid animates and shows only Fruit products
3. ✅ URL updates to `?category=Fruit`
4. Reload the page
5. ✅ Filter state is restored from URL

### 3. Catalog — filter pills
1. Click "In Season Now" pill
2. ✅ Only in-season products visible
3. Click "Coming Soon" pill
4. ✅ Only coming-soon products visible

### 4. Catalog — load more
1. If more than 12 products exist, scroll to bottom
2. ✅ "Load more products" button appears
3. Click it
4. ✅ Next 12 products append without page reload or scroll reset

### 5. Catalog — empty state
1. Apply a filter combination with no matching products
2. ✅ "No products match your selection" message + "Clear filters" button appears

### 6. Product detail — split layout
1. Click any product card (not "Coming Soon")
2. ✅ Navigates to `/products/:id`
3. ✅ Desktop: gallery on left (60%), info panel on right (40%)
4. ✅ Mobile (resize to 375px): gallery stacked above info panel

### 7. Product detail — gallery
1. On a product with multiple images
2. ✅ Swipe (mobile) or press arrow keys (desktop) cycles through images
3. ✅ Image counter shows "2 / 4" format
4. On a product with 1 image: ✅ No prev/next controls shown

### 8. Product detail — Contact CTA
1. Click "Contact to Order"
2. ✅ Navigates to `/contact?crop=[productName]`
3. ✅ Contact form "crop" field is pre-filled with the product name

### 9. Product detail — seasonal chart
1. On any product detail page
2. ✅ 12-cell month bar visible
3. ✅ Available months filled in product's accent color
4. ✅ Current month cell has a highlighted border

### 10. Product detail — not found
1. Navigate to `/products/nonexistent-id-xyz`
2. ✅ "Product not found" message + "Browse all products" link

### 11. Season calendar — grid
1. Navigate to `http://localhost:4200/seasons`
2. ✅ Grid shows products as rows, months (Jan–Dec) as columns
3. ✅ Cells filled with accent color for available months
4. ✅ Current month column highlighted

### 12. Season calendar — popover
1. Click any filled cell in the calendar
2. ✅ Popover appears with product thumbnail, bilingual name, "View product →" link
3. Click outside the popover
4. ✅ Popover closes

### 13. Season calendar — mobile
1. Resize browser to 375px width
2. ✅ Calendar reflows to vertical layout (months scroll vertically, products per month shown as horizontal strip)

### 14. RTL layout
1. Switch language to Arabic
2. ✅ All three pages render correctly in RTL
3. ✅ Category lanes scroll RTL
4. ✅ Product detail split: gallery on RIGHT, info on LEFT (RTL)
5. ✅ Season calendar columns and rows remain correctly oriented

### 15. SSR smoke test
1. View page source (`Ctrl+U`) on `/products`
2. ✅ Product grid HTML is present in the source (not empty hydration placeholders)
3. Same check for `/products/:id` and `/seasons`

---

## Known Limitations at Launch

- **"How we grow it" text**: Uses `descriptionEn`/`descriptionAr` from the existing product record. Richer editorial content requires the client to author per-product copy in the admin.
- **Category lane cover photo**: Derived from the first Valid product's image in that type+state group. If no products exist in a category, the lane shows a placeholder.
- **Packaging specs**: Rendered as chip groups (not a structured table) because the backend stores packaging as flat string arrays.
- **Product slug**: Routes use product `id`, not a human-readable slug. Slug support requires a future backend change.
