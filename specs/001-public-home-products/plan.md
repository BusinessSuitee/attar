# Implementation Plan: Public Homepage & Products Catalog

**Branch**: `001-public-home-products` (working on `main`) | **Date**: 2026-04-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/001-public-home-products/spec.md`

## Summary

Deliver two production-grade public pages — **Homepage** and **Products catalog** (with product detail and Order Request submission) — inside the existing Angular 21 SPA at `alatar-angular/`. The work consumes the existing .NET backend without modification, uses the already-configured Transloco i18n (AR default, EN/RU available), respects the existing brand palette (Cairo font, primary green `#0fbd66`), and adopts StyleSeed *layout, spacing, typography, and accessibility rules* without forcing a Tailwind v4 / skin migration. Architecture is purpose-built so adding new public pages, new catalog filters, or new product fields later (and a CRM hand-off downstream) is additive — no rewrites.

The plan favors composition over abstraction: a `CatalogStore` with URL-bound filter state, a thin localization helper bridging Transloco to bilingual API fields, signal-based reactive components, and a single source of truth for the API base URL (already in place via `API_BASE_URL` token).

## Technical Context

**Language/Version**: TypeScript 5.9, Angular 21.1 (zoneless change detection, standalone components, signals, SSR with hydration + event replay)

**Primary Dependencies**:
- `@angular/router` (routing, lazy-loaded standalone components, in-memory scrolling)
- `@angular/forms` (typed reactive forms for the Order Request form)
- `@angular/common/http` with fetch + interceptors (`authInterceptor`, `authErrorInterceptor` — already wired)
- `@jsverse/transloco` 8.x (i18n, AR default, configured in `app.config.ts`)
- `tailwindcss` 3.4 (existing palette: primary `#0fbd66`, accent `#E8871E`, Cairo font)
- `rxjs` 7.8 (used sparingly; signals are the preferred reactive primitive)
- `swiper` 12 (already a dependency — candidate for product image gallery)

**Storage**: N/A on the frontend. State is in-memory signals; URL holds catalog filter state.

**Testing**: `vitest` 4 (already in devDependencies; no tests authored yet). Plan: unit tests for the catalog store (filter logic, URL round-trip), the order-request form validation, and the localized-text helper. Component tests via Angular Testing Library are out of scope for this feature; rely on TypeScript + lint + manual walk-throughs in both languages.

**Target Platform**: Modern evergreen browsers (Chromium, Safari, Firefox) on mobile, tablet, desktop. SSR via `@angular/ssr` with client hydration + event replay. Mobile-first viewport ≥320px.

**Project Type**: Web application (frontend SPA + existing .NET backend at `alatar-dotnet/`).

**Performance Goals**:
- First Contentful Paint < 2.5s on a typical 4G mobile connection.
- Catalog filter interaction < 1s perceived latency at 500 products.
- No dropped frames during scroll/filter at 500 products.
- Product image gallery on detail page lazy-loads beyond first viewport.

**Constraints**:
- Backend is fixed; the frontend MUST adapt to whatever shape the existing `/api/products`, `/api/categories`, `/api/order-requests`, `/api/contacts`, `/api/social-links` return (see [contracts/](./contracts/) for what we observe today).
- Bilingual content (product name, description, option labels) is sourced from per-row API fields, not from Transloco translation files.
- No new design system. Visual rules from StyleSeed (`.claude/CLAUDE.md`) apply on top of the existing Tailwind v3 brand theme — see [research.md](./research.md) §1.
- Existing static HTML pages at the repo root (`about.html`, `contact.html`, etc.) remain untouched. The Angular SPA already has its own `/about`, `/contact`, etc. components — they are out of scope for this feature.
- No Angular CDK / Material introduced in this feature.
- SSR-safe code only: no direct `window`, `document`, or `localStorage` access without `isPlatformBrowser` guards.

**Scale/Scope**: Two top-level pages plus the product detail view and the in-detail order form. Catalog must remain healthy at 500+ products.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The project's constitution at `.specify/memory/constitution.md` is currently the unfilled template. There are no ratified principles to gate against.

**Resolution**: this feature proceeds without a constitution-derived gate. Recommendation surfaced (non-blocking): run `/speckit-constitution` separately to encode the principles this team actually wants to enforce (e.g., "all public-facing pages SSR-renderable", "all interactive elements meet 44×44 touch target", "no `window` access outside `isPlatformBrowser` guards"). Until then, the [requirements quality checklist](./checklists/requirements.md) and the rules baked into `.claude/CLAUDE.md` (StyleSeed Golden Rules) serve as the de-facto gate.

**Initial gate status**: PASS (no principles to violate).
**Post-design re-evaluation**: see bottom of this file.

## Project Structure

### Documentation (this feature)

```text
specs/001-public-home-products/
├── plan.md              # This file (/speckit-plan output)
├── spec.md              # Feature specification (/speckit-specify output)
├── research.md          # Phase 0 — decisions and rationale
├── data-model.md        # Phase 1 — frontend view models, form models, URL state
├── quickstart.md        # Phase 1 — how to run, verify, and demo the feature
├── contracts/           # Phase 1 — observed shapes of the backend endpoints we consume
│   ├── products.api.md
│   ├── categories.api.md
│   ├── order-requests.api.md
│   └── social-links.api.md
├── checklists/
│   └── requirements.md  # Spec quality checklist (already complete)
└── tasks.md             # Phase 2 output — produced by /speckit-tasks (NOT this command)
```

### Source Code (repository root)

The Angular SPA already contains the page directories. This plan adds shared building blocks under `core/` and `shared/`, fills out new feature-scoped folders under `pages/home/sections/` and `pages/products/`, and introduces the catalog store and localization helper.

```text
alatar-angular/
├── src/
│   └── app/
│       ├── app.routes.ts                 # EXISTING — already declares /, /products, /products/:id
│       ├── app.config.ts                 # EXISTING — Transloco, HTTP, API_BASE_URL, scrolling
│       ├── transloco-loader.ts           # EXISTING — loads ar/en/ru JSON
│       │
│       ├── core/
│       │   ├── config/
│       │   │   └── api-base-url.token.ts # EXISTING
│       │   ├── products/
│       │   │   ├── product.service.ts    # EXISTING — getProducts() and admin ops
│       │   │   ├── products.store.ts     # EXISTING (admin-oriented; LEFT ALONE)
│       │   │   └── catalog.store.ts      # NEW — public catalog filter/search/pagination state
│       │   ├── categories/               # NEW (only if research §2 decides yes)
│       │   │   └── category.service.ts
│       │   ├── orders/
│       │   │   └── order-request.service.ts # EXISTING — already supports POST /api/order-requests
│       │   ├── contacts/
│       │   │   └── contact.service.ts    # EXISTING (homepage CTA links to existing /contact page)
│       │   ├── social-links/
│       │   │   └── social-link.service.ts # EXISTING — getPublic()
│       │   └── i18n/                     # NEW — small localization helpers
│       │       ├── current-lang.signal.ts
│       │       └── localized-text.pipe.ts
│       │
│       ├── shared/
│       │   ├── directives/               # EXISTING — keep
│       │   ├── ui/                       # NEW — StyleSeed-aligned generic primitives used by both pages
│       │   │   ├── card.component.ts        # rounded-2xl, shadow-card, no pure black, default mx-6/px-6 helpers
│       │   │   ├── button.component.ts      # primary/secondary/ghost variants, ≥44px tap target, focus ring
│       │   │   ├── input.component.ts       # form input shell with label + error slot
│       │   │   ├── select.component.ts      # form select shell
│       │   │   ├── badge.component.ts       # status / season / type badges
│       │   │   ├── image-with-fallback.component.ts # placeholder + alt + lazy-load
│       │   │   ├── empty-state.component.ts # used for catalog "no results"
│       │   │   ├── error-state.component.ts # used when API fails — non-blocking banner
│       │   │   └── skeleton.component.ts    # shimmer placeholder
│       │   └── format/
│       │       └── localized-name.ts        # pure function (en, ar) -> string given current lang
│       │
│       ├── pages/
│       │   ├── home/
│       │   │   ├── home.page.ts             # EXISTING file — REWORK to compose new sections
│       │   │   ├── home.page.html           # EXISTING — REWORK
│       │   │   ├── home.page.css            # EXISTING — minimize; rely on Tailwind utilities
│       │   │   └── sections/
│       │   │       ├── hero-section.component.ts            # NEW or refactor existing
│       │   │       ├── value-proposition.component.ts       # NEW
│       │   │       ├── featured-categories.component.ts     # NEW — uses /api/categories OR catalog-derived
│       │   │       ├── primary-cta.component.ts             # NEW — "Browse products" + "Contact us"
│       │   │       └── social-strip.component.ts            # NEW — reads SocialLinkService.getPublic()
│       │   │
│       │   ├── products/
│       │   │   ├── products.page.ts         # EXISTING — REWORK to use CatalogStore
│       │   │   ├── products.page.html       # EXISTING — REWORK
│       │   │   ├── products.page.css        # EXISTING — minimize
│       │   │   └── components/
│       │   │       ├── catalog-filters.component.ts         # NEW — category, type, state, season chips
│       │   │       ├── catalog-search.component.ts          # NEW — debounced search input
│       │   │       ├── product-card.component.ts            # NEW — image, bilingual name, badges
│       │   │       └── catalog-grid.component.ts            # NEW — grid + load-more pagination
│       │   │
│       │   └── product-detail/
│       │       ├── product-detail.page.ts   # EXISTING — REWORK
│       │       ├── product-detail.page.html # EXISTING — REWORK
│       │       ├── product-detail.page.css  # EXISTING
│       │       └── components/
│       │           ├── image-gallery.component.ts           # NEW — Swiper-based, lazy
│       │           ├── option-group.component.ts            # NEW — single-select chip group
│       │           ├── meta-summary.component.ts            # NEW — type/state/season/category line
│       │           └── order-request-form.component.ts      # NEW — typed reactive form, posts to OrderRequestService
│       │
│       └── components/                   # EXISTING global chrome — keep
│           ├── navbar/
│           ├── footer/
│           ├── hero/
│           └── social-sidebar/
│
└── public/
    └── assets/
        └── i18n/
            ├── ar.json        # EXISTING — add new keys for home + products + form
            ├── en.json        # EXISTING — add new keys
            └── ru.json        # EXISTING — add new keys (RU already supported in app config)
```

**Structure Decision**: The Angular SPA continues with its existing `pages/`, `core/`, `shared/`, `components/` layout. The two new home/products pages compose small section/component files placed *inside* their page folders to keep feature locality high; only generic primitives that both pages share (Card, Button, Skeleton, EmptyState, etc.) are promoted to `shared/ui/`. The existing admin-oriented `products.store.ts` is left alone — public catalog state lives in a new `catalog.store.ts` so the two consumers (public catalog vs. admin product management) cannot bleed into each other. This honors FR-037 (additive growth) and SC-008 (adding new pages requires no edits to these pages).

## Complexity Tracking

| Decision | Why kept (or added) | Simpler alternative rejected because |
|---|---|---|
| Separate `catalog.store.ts` from existing `products.store.ts` | Existing store is admin-oriented (CRUD, status updates) and groups products by hard-coded `Fruit/Vegetable/Frozen` derived from product type+state. Public catalog has different filter dimensions and a different lifetime. | Reusing the admin store would entangle public and admin concerns, force every future filter change to be backwards-compatible with both, and slow the admin dashboard work that uses it. |
| URL-bound filter state for the catalog | FR-011 requires shareable URLs that restore the same view on reload. | Pure in-memory state would lose deep links — a regression vs. the requirement. |
| Adopt StyleSeed *rules* but not StyleSeed *theme tokens* | The project is on Tailwind v3 with an established green/orange brand. StyleSeed's full skin system targets Tailwind v4. Migrating now is a separate, larger effort. | Forcing the v4 migration into this feature would multiply scope; cherry-picking the rules (mx-6/px-6, no pure black, single accent, card shadows ≤8%, font-size table, ≥44px touch targets) gives 90% of the value with zero migration risk. See research.md §1. |
| `shared/ui/` micro-components (Card, Button, Skeleton, etc.) | Two pages will share these. Defining them once enforces consistency (StyleSeed rules) and makes future pages quick to compose. | Inlining Tailwind classes everywhere works at first, then drifts. A thin wrapper component fixes it cheaply. |
| Server-side filter contract today, server- or client-implemented later | Current `/api/products` returns the full list with no query parameters. Design `CatalogStore.query({...})` as the contract anyway, and implement it client-side over the existing endpoint until/unless the backend gains query support. | Hard-coding "fetch all, filter on client" in the page would force a rewrite when the catalog grows past what's reasonable to ship in one payload. |
| Add a `LocalizedTextPipe` + `current-lang.signal.ts` instead of inline `lang === 'ar' ? x : y` ternaries | FR-019 (description fallback when one language is missing) and FR-031..033 (full bilingual coverage) need consistent behavior across many places. | Inline ternaries breed inconsistency and miss the fallback rule. |
| Keep `swiper` for the gallery instead of adding a new carousel library | Already a project dependency. | Adding `@angular/cdk` or another carousel just for one gallery is gratuitous. |

## Post-Design Re-Evaluation (after Phase 1)

- **Constitution Check**: still PASS — no principles defined to violate. Once `/speckit-constitution` is run, re-evaluate.
- **Spec drift?**: no FR was loosened. Two were *narrowed* by research:
  - FR-007 displays category metadata when present; if research §2 concludes the public catalog uses backend categories, the card surfaces a category badge — otherwise it falls back to type+state badges only. Either path satisfies the FR.
  - FR-021 displays bilingual option labels using whatever shape the backend returns; if options are flat strings (per current Angular type), labels render as-is in both languages with no translation bridge.
- **Complexity introduced?**: only the items in the table above, each justified.
- **Future-readiness audit**:
  - Adding a new public page → just add a new lazy route + page folder. No edits to home or products. ✓ (FR-037, SC-008)
  - Adding a new filter dimension → add a field to `CatalogFilterState`, a chip group to `catalog-filters.component.ts`, one URL param. The filter pipeline in `CatalogStore` is open for extension. ✓ (FR-039)
  - Adding a new product card field → `product-card.component.ts` has a metadata row slot; add the field there. ✓ (FR-040)
  - Order Request → CRM hand-off → `OrderRequestService` already posts to the existing `/api/order-requests` endpoint with the full schema. The future CRM consumes the same backend store. No frontend change needed. ✓ (FR-038, SC-009)

**Result**: Phase 1 design holds. Ready for `/speckit-tasks`.
