# Phase 0 Research — Public Homepage & Products Catalog

**Date**: 2026-04-27
**Feature**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)

This document records the technical decisions made during Phase 0 — what was chosen, why, and what alternatives were rejected. Each section corresponds to a real ambiguity surfaced when the spec met the existing codebase.

---

## §1 — StyleSeed adoption strategy under Tailwind v3 + existing brand

### Decision

Adopt StyleSeed **rules** (layout, spacing, typography contexts, accessibility floor, card semantics, single-accent discipline) on top of the existing Tailwind v3 setup. **Do not** migrate to Tailwind v4 or import a StyleSeed skin in this feature.

Concretely, this feature treats the following StyleSeed rules as binding:

- **Layout**: `mx-6` for single floating cards, `px-6` for grid containers; `space-y-6` between page sections.
- **Single accent**: `primary` (`#0fbd66`) is the only accent color; everything else stays in the existing grayscale ramp.
- **No pure black**: darkest text uses the existing `background-dark`/text neutral, not `#000`.
- **Numbers 2:1 with units**: applies anywhere a metric appears (e.g., quantity in tons on the order form preview).
- **Typography by context**: page sections use the StyleSeed font-size table (e.g., section title `text-[18px] font-bold`, body `text-[14px]`/`text-[15px]`, hero metric `text-[48px]`); CSS variables for font sizes are explicitly avoided (per StyleSeed v4 anti-pattern).
- **Card shadows ≤ 8% opacity**.
- **Touch targets ≥ 44×44px**.
- **Visual rhythm**: never two consecutive sections of the same type.
- **Cairo font** stays — it is the project's typographic identity for AR and reads well in EN.

### Rationale

- The brand palette (`#0fbd66` primary, `#E8871E` accent, gold `#d4af37`) is already shipped to production and recognized by partners; replacing it inside this feature would muddy scope and invite a brand discussion that does not belong here.
- StyleSeed's *rules* are framework-agnostic. They survive the Tailwind v3 → v4 transition. We capture the value now and revisit the skin migration later as its own initiative.
- Forcing a Tailwind v4 + skin migration into this feature would (a) break the existing admin dashboard, navbar, and footer that share the same Tailwind config, (b) require rebuilding the i18n RTL story under a different token system, and (c) push the delivery of the homepage and products page out by weeks for no proportional user-visible gain.

### Alternatives considered

- **Full StyleSeed adoption (Tailwind v4 + skin)** — rejected: out of scope, multiplies risk, no incremental shipping path that doesn't double the work.
- **Ignore StyleSeed entirely; freestyle on Tailwind v3** — rejected: contradicts spec FR-036 and gives up the consistency benefits StyleSeed provides for free.
- **Build a parallel "StyleSeed-light" skin file** — rejected: adds a new layer to maintain. The simpler move is "follow the rules, use the existing tokens."

### Implication for tasks

The `shared/ui/` primitives encode these rules (Card has rounded-2xl + shadow ≤8%, Button has min-h-11 min-w-11 + focus ring, etc.). When `/ss-lint` is later run on the new pages, only true violations will surface — not "you didn't migrate to v4."

---

## §2 — Backend categories vs. frontend-derived categories

### Decision

Use the backend **`GET /api/categories`** endpoint as the source of truth for categories surfaced on the homepage and used in the catalog filter. Add a new `CategoryService` and a small read-only category cache.

The existing `ProductsStore.productsByCategory` (which derives Fruit/Vegetable/Frozen from product type+state) is a useful **derived view** for the existing admin UI; the public catalog does not consume it.

### Rationale

- The spec defines categories as a first-class entity with bilingual name, type, and season (see Key Entities in spec.md). Treating type+state as "the categories" loses the bilingual name and the season metadata that the spec calls out.
- The admin dashboard plan already manages categories as a separate CRUD entity. Two consumers (admin manages them; public catalog reads them) of one source is the right shape.
- Future categories (e.g., "Herbs", "Roots") cannot be modeled as a {type × state} cross — they need to live as their own rows.

### Alternatives considered

- **Use only the {type, state, season} cross product as categories** — rejected: contradicts the data model that admin will write against; loses bilingual category names.
- **Use both: show category cards on home from `/api/categories`, but filter products by type+state** — rejected: the user-visible split is confusing — clicking a "Frozen Vegetables" homepage card should land on the catalog already filtered to that category, not to type=Vegetable+state=Frozen.

### Open question (deferred to implementation, not blocking the plan)

The backend's `/api/products` response (per `ProductService` Angular type) does **not currently include a `categoryId` field on each product**. To filter products by category, the catalog will either need (a) a join via a category endpoint that returns categorized product IDs, or (b) a backend-side filter parameter. Today neither exists.

**Mitigation in this feature**: the catalog filter UI exposes Category as a filter dimension *if* the products API exposes a category reference per row by the time the implementation lands. If it does not, Category falls back to a homepage navigation hint only (clicking a category card on home pre-applies a `?type=…&state=…&season=…` filter set chosen to approximate that category). The category chip in the catalog filter is hidden in that fallback path. This keeps both UI paths future-compatible without blocking on backend changes.

This will be re-evaluated in `/speckit-tasks` once we confirm the backend response shape against the live API.

### Implication for tasks

- Add `core/categories/category.service.ts` exposing `getAll(): Observable<CategoryDto[]>`.
- The homepage's `featured-categories.component.ts` consumes this service.
- The catalog filter Category chip group is feature-flagged off by default; turning it on is a 1-line change once the products API surfaces category references.

---

## §3 — Bilingual product options shape

### Decision

Treat product option arrays (`varieties`, `packagingOptions`, `weightOptions`, `sizeOptions`, `gradeOptions`) as **flat `string[]`** for this feature, matching the current `ProductListItem` type at `core/products/product.service.ts`.

Render the option label as-is. If the option string contains a delimiter that suggests a bilingual pair (e.g., `"Box | صندوق"`), the localized-text helper will split on a configured delimiter and pick the side matching the current language; otherwise the raw string is shown.

### Rationale

- The Angular type today says `string[]`. Building the UI against speculation (bilingual `{ key, en, ar }` objects) would add a translation layer that the backend may never honor.
- The split-by-delimiter heuristic gracefully handles the case where the team chooses to encode bilingual labels in the option string itself, without locking us into a specific shape.

### Alternatives considered

- **Strongly type options as `LocalizedProductOption[]` everywhere** — rejected: contradicts the current type; would require backend-coordinated changes to honor.
- **Re-fetch a "labels" endpoint per option** — rejected: invents API shape; out of scope.

### Implication for tasks

- The `option-group.component.ts` accepts a `string[]` and renders chips.
- `LocalizedTextPipe` includes a tolerant "maybe bilingual" mode that splits on a configured delimiter (default `|`) when present.
- Documented in `data-model.md` as a known soft contract, with a TODO to revisit when the backend formalizes options.

---

## §4 — Catalog pagination & filtering: server vs. client

### Decision

Define the `CatalogStore.query()` interface with **server-style semantics** (filter object + page + pageSize → paged result), but **implement it client-side** today (fetch the full list once via the existing `getProducts()`, then filter/paginate in memory). Cache the full list in the store; refresh on tab focus older than 5 minutes.

### Rationale

- The current backend doesn't support filter/pagination query parameters on `/api/products`. We can ship the feature today.
- Designing the store interface with the future shape means no rewrites when the backend gains query support — only the implementation of `query()` swaps from "filter the in-memory cache" to "call the backend."
- At expected catalog sizes (tens to low hundreds of products) the client-side filter is fast enough to satisfy SC-002 (<1s filter response) and SC-006 (smooth at 500 products).

### Alternatives considered

- **Hard-code "fetch all + filter on client" everywhere; redesign later** — rejected: violates FR-008 spirit and creates a known rewrite.
- **Block this feature until backend adds query support** — rejected: needlessly couples the public site delivery to a backend change.
- **Introduce server-side filtering only, requiring a backend change first** — rejected: adds backend scope; the spec explicitly forbids backend changes here.

### Implication for tasks

- `CatalogStore.query(filter, page, pageSize)` returns `{ items, total, hasMore }` regardless of where the filter ran.
- Pagination is **load-more** (not numbered pages): on mobile, it is friendlier and easier to retain scroll position.
- A constant `CATALOG_PAGE_SIZE = 24` (multiple of common grid widths 2/3/4 across responsive breakpoints).

---

## §5 — Default language and persistence

### Decision

- **Default language remains AR** (already configured in `app.config.ts`).
- Persist visitor preference in `localStorage` under `attar.lang` once they explicitly toggle. Until they toggle, no preference is stored.
- On first visit, if no preference exists and the browser language is `en-*` or `ru-*`, pre-select that language; otherwise stay on AR.
- All `localStorage` access is wrapped in an `isPlatformBrowser` check so SSR doesn't break.

### Rationale

- Alatar's primary market context is Arabic-speaking; AR-default matches the user's stated business intent.
- Browser-locale auto-detection is a low-cost UX win that respects the visitor without overriding an explicit choice.
- A single storage key with a clear namespace prevents collisions if the project later adopts other settings.

### Alternatives considered

- **Auto-detect every visit, no persistence** — rejected: ignores explicit visitor choice, frustrating returning visitors.
- **Cookie-based persistence to share with SSR** — rejected: adds complexity for low marginal value; SSR can render the default AR page and let the client switch on hydration if needed.

### Implication for tasks

- A small `LanguagePreferenceService` reads/writes `localStorage` SSR-safely and bridges to Transloco.
- The existing language toggle in the navbar (likely already present) calls into this service.

---

## §6 — SSR and SEO posture for product detail

### Decision

Product detail pages render server-side with the product data fetched in a route-resolver. Page `<title>` and `<meta name="description">` are set per product using the localized name and description. Open Graph image is the product's first image.

### Rationale

- Deep-link sharing on WhatsApp and LinkedIn (where B2B inquiries originate) only renders preview cards if OG meta is set.
- Angular SSR is already configured. Putting product data into a resolver means the SSR pass has the data needed to generate meta tags before the response is flushed.

### Alternatives considered

- **Set meta tags on the client after fetch** — rejected: too late for OG previews when shared.
- **Pre-render all product detail pages at build time** — rejected: products change without redeploys; pre-render falls behind.

### Implication for tasks

- Add a `ProductDetailResolver` that fetches the product (or 404s) before navigation completes.
- Use Angular's `Title` and `Meta` services in the page component. Translate the meta strings via Transloco for static labels; product-specific strings use the product's bilingual fields directly.

---

## §7 — Virtual scroll vs. simple pagination

### Decision

Use **simple "load more" pagination** with `CATALOG_PAGE_SIZE = 24`. Do not introduce `@angular/cdk` virtual scrolling in this feature.

### Rationale

- At expected scale (current product count ≈ low hundreds at most) virtual scrolling is overkill.
- Adding `@angular/cdk` doubles the bundle's animation/CDK weight for one screen.
- Load-more works with SSR (initial 24 products are SSR-rendered; subsequent pages fetch on click) without any special handling.
- If profiling later shows scroll lag at 1000+ products, virtual scrolling can be retrofitted into the existing `catalog-grid.component.ts` without changing the public store interface.

### Alternatives considered

- **CDK Virtual Scroll from day one** — rejected: premature optimization, adds dependency, complicates SSR.
- **Numbered pagination** — rejected: worse mobile UX, harder to keep scroll position when navigating into a product detail and back.

### Implication for tasks

- `catalog-grid.component.ts` is a regular grid with a "Load more" button at the end.
- The button is hidden when `hasMore === false`.

---

## §8 — Form validation philosophy for the Order Request form

### Decision

- **Required**: `requesterName` (≥2 chars), `phoneNumber` (≥6 chars, plausible format), `quantityTons` (>0).
- **Optional**: `specialSpecification` (notes), all option group selections.
- **Phone format** is validated as "plausible" (digits, `+`, spaces, `-`, parentheses; length 6–20). No per-country validation in this feature.
- Validation runs on blur; the submit button is disabled until the form is valid.
- Server-side errors (HTTP 400/500) are surfaced as a non-blocking banner above the form; field values are preserved.

### Rationale

- B2B inquiry forms with stricter validation lose conversions for international visitors with unusual phone formats.
- "Plausible" client-side validation is a sanity check; the sales team handles fine-grained correction.

### Alternatives considered

- **No client-side phone validation** — rejected: empty/garbage submissions waste sales team time.
- **Strict country-aware phone validation (libphonenumber)** — rejected: adds a 100KB+ dependency for marginal gain.

### Implication for tasks

- Validators live in `order-request-form.component.ts`.
- The form uses `FormBuilder`'s `nonNullable` typed forms.

---

## Summary of decisions

| Area | Decision |
|------|----------|
| §1 StyleSeed | Adopt rules, not the v4 skin migration |
| §2 Categories | Use `/api/categories` as source of truth; degrade gracefully if `categoryId` not on products |
| §3 Option labels | Treat as `string[]`; tolerant bilingual split via delimiter |
| §4 Pagination | Server-shaped contract, client-implemented today, load-more UX |
| §5 Language | AR default, persisted on toggle, browser-locale fallback |
| §6 SSR/SEO | Resolver-fetched product detail with per-product meta + OG |
| §7 Virtual scroll | Not now; revisit only if profiling demands it |
| §8 Form validation | Plausible-format checks, server errors non-blocking, values preserved |

All Phase 0 NEEDS CLARIFICATION items resolved or deferred to implementation with a documented mitigation path. Proceed to Phase 1.
