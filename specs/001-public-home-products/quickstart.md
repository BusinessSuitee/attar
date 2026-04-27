# Quickstart — Public Homepage & Products Catalog

**Feature**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)

This guide walks through running the feature locally, verifying it against the spec, and demoing the user journeys.

---

## Prerequisites

- Node.js 20+ and npm 11.
- The .NET backend reachable. Either:
  - Run it locally (defaults to `https://localhost:7253` or `http://127.0.0.1:5070` — `app.config.ts` auto-selects), or
  - Use the production URL `https://attar.runasp.net` (`app.config.ts` falls back to this in non-localhost contexts).

## Run the SPA

```bash
cd alatar-angular
npm install        # first time only
npm start          # serves at http://localhost:4200
```

Server-side rendering (optional, useful for verifying SEO/OG tags on product detail):

```bash
cd alatar-angular
npm run build
npm run serve:ssr:alatar-angular
```

---

## Smoke test the new pages

### Homepage (User Story 1)

1. Open `http://localhost:4200/` in a fresh browser profile.
2. Confirm:
   - Hero with company name + value proposition + primary CTA renders **above the fold** on a 360×640 viewport.
   - Featured categories cards load from `/api/categories` (network tab shows the request; cards render the bilingual category names).
   - Two visible CTAs: "Browse products" (→ `/products`) and "Contact us" (→ existing `/contact`).
   - Social strip renders icons sourced from `/api/social-links`.
3. Toggle language EN ↔ AR via the navbar:
   - Document direction flips (`<html dir="rtl">` ↔ `<html dir="ltr">`).
   - All visible text translates (no missing keys printed in console).
   - Layout has no horizontal scroll.
4. Resize the window from 320px to 1440px:
   - No content escapes the viewport.
   - Cards reflow gracefully.

### Products catalog (User Story 2)

1. From the homepage, click "Browse products". URL becomes `/products`.
2. Confirm:
   - Skeleton placeholders render briefly, then the first 24 products appear in a responsive grid.
   - Each card shows the localized name, primary image (or placeholder), and badges for type / state / season.
   - "Coming Soon" products have a visible badge and remain clickable.
   - "Invalid" products do **not** appear.
3. Apply filters one at a time:
   - Click a category chip → URL gains `?category=<id>` and the list narrows.
   - Click a type chip (Fruit / Vegetable) → URL gains `?type=Fruit` and chips combine.
   - Add `&season=Winter` and `&q=orange` via UI → list reflects the intersection.
4. Reload the page with the filter URL:
   - The same filters are applied; the same product list renders.
5. Click "Clear all filters":
   - Query string clears, full list reappears.
6. Type a search term that matches no products:
   - Empty state appears with a "Clear filters" action.
7. Scroll to the end of the list:
   - "Load more" button is visible if `hasMore`. Click it; the next 24 append; URL updates `?page=2`.

### Product detail + Order Request (User Story 3)

1. Click any Valid product. URL becomes `/products/<id>`.
2. Confirm:
   - Image gallery shows all product images, swipeable on mobile (Swiper).
   - Bilingual name and description render in the active language (with fallback notice if the description in that language is empty).
   - All five option groups (Varieties, Packaging, Weight, Size, Grade) render their available values.
   - "Request this product" CTA is visible.
3. Click "Request this product":
   - Form opens, pre-populated with selected options if any were chosen above.
4. Fill the form:
   - Empty submit attempt → inline validation surfaces required fields, submit stays disabled.
   - Fill name (≥2 chars), phone (e.g., `+20 100 123 4567`), quantity (e.g., `5`), notes (optional).
   - Submit. Confirm the network request hits `POST /api/order-requests` with the correct payload (Network tab).
5. Confirmation:
   - Success banner renders within 3s.
   - Form resets.
6. Try a "Coming Soon" product detail:
   - Order CTA replaced with a "Coming Soon" notice — no form available.
7. Try a deep-link to a non-existent product (`/products/00000000-0000-0000-0000-000000000000`):
   - Friendly "not available" message with a link back to the catalog.

### Bilingual sanity check

For each of the three flows above, repeat once in AR (default) and once in EN. Confirm:

- Document direction flips correctly.
- Form labels and validation messages are translated.
- Number formatting reads naturally in both languages.
- Form values are preserved across a language toggle mid-fill.

---

## Verify SSR + SEO (optional)

```bash
curl -s http://localhost:4200/products/<some-product-id> | grep -E '<title>|og:'
```

Expected: the response body already contains the product's localized name in `<title>` and `<meta property="og:image">` pointing at the product's primary image. If the response shows generic site-wide tags, the resolver isn't wired correctly.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Categories fail to load on homepage | Backend `/api/categories` not reachable | Check `app.config.ts` `resolveApiBaseUrl` — confirm localhost detection is matching your environment. |
| All products vanish after switching language | Filter pipeline picked up a stale `lang` value | Ensure `current-lang.signal.ts` updates from `transloco.langChanges$`. |
| Order Request POST returns 400 | Phone format failing backend validation while client validation passes | Tighten the client regex to require at least 7 digits, or relax server validation. |
| Page goes blank on direct load of `/products/:id` | SSR resolver threw on missing product | The resolver should redirect to `/products` with a flash message, not throw. |
| Console: `localStorage is not defined` | SSR running browser-only code | Wrap the access in `isPlatformBrowser` check. |
| Right-side scrollbar in AR | A child element has fixed `left` / `right` instead of `start` / `end` | Use logical properties (`ms-*`, `me-*`) per StyleSeed Golden Rules. |

---

## Demo script (for stakeholders)

Time-boxed 3-minute demo:

1. **0:00–0:30** Land on the homepage in AR. Show hero, featured categories, social strip. Highlight "no scroll, mobile-first."
2. **0:30–1:00** Switch language to EN. Layout flips LTR. All translations render. No reload.
3. **1:00–1:45** Navigate to Products. Apply two filters + a search term. Show URL updates. Reload and confirm filters persist.
4. **1:45–2:15** Click a product. Show image gallery, options, "Request this product."
5. **2:15–3:00** Submit an Order Request. Show confirmation. Note that this lead lands in the existing admin Order Requests list and is what the future CRM will consume — zero rework.

Close: "Adding About, Services, Blog later doesn't touch any of this — they're additive lazy routes."

---

## What's NOT in this feature (set expectations)

- No admin dashboard or auth flows.
- No checkout, cart, payments, accounts.
- No analytics events.
- No newsletter signup, no live chat.
- No public visibility of price or stock.
- Existing static HTML pages at the repo root remain untouched.
