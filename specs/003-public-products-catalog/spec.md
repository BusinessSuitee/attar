# Feature Specification: Public Products Catalog — "Field to Frame"

**Feature Branch**: `003-public-products-catalog`
**Created**: 2026-04-28
**Status**: Draft
**Input**: Public product pages redesign with photo-first editorial approach, season calendar, and export grade comparison.

---

## Overview

Redesign the public-facing product experience for Alatar Sons — an Egyptian agricultural export company. The experience must serve two distinct audiences simultaneously: **international B2B procurement officers** evaluating produce for bulk orders, and **local B2C visitors** discovering seasonal produce.

The design principle ("Field to Frame") treats every product photograph as the primary communication — white background, generous white space, and minimal chrome let produce colors and textures carry the page. Four pages/surfaces are in scope, two of which are new to the site.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Browse & Filter Catalog (Priority: P1)

An international buyer visits the site to discover what Alatar currently exports. They need to quickly filter by product type or season, scan visually, and navigate to a detail page — all in under 60 seconds.

**Why this priority**: The catalog is the primary entry point for new visitors and the most-visited page. Everything else depends on products being discoverable here.

**Independent Test**: Navigating to `/products`, filtering by type, and clicking through to a product detail page can be tested in isolation and already delivers the core value proposition.

**Acceptance Scenarios**:

1. **Given** a visitor lands on `/products`, **When** the page loads, **Then** they see a horizontal scrollable category lane with crop photography for each category, followed by a mosaic product grid (hero card + standard cards).
2. **Given** a visitor selects a category lane, **When** the click is registered, **Then** the mosaic grid animates (fade + reflow) to show only products in that category — without a page reload.
3. **Given** a visitor activates a filter pill (e.g., "In Season Now"), **When** the filter is applied, **Then** only matching products appear, and the filter pill shows an active state; the URL reflects the filter so it can be bookmarked.
4. **Given** a filtered state with no matching products, **When** no results exist, **Then** an empty state is shown with a suggestion to broaden the filter, not a blank grid.
5. **Given** a visitor scrolls to the end of visible products, **When** more products exist, **Then** a "Load more" button appears; clicking it appends the next batch without resetting scroll position.
6. **Given** a product is currently in season, **When** displayed in the grid, **Then** a pulsing green dot badge reading "In Season Now" is visible on the card.

---

### User Story 2 — Deep-Dive Product Detail (Priority: P1)

A procurement officer clicks a product and needs to evaluate it for purchase: variety, packaging options, quality specifications, and seasonal availability — all on one page.

**Why this priority**: Detail pages convert browsers into inquiries. This is the most commercially critical page.

**Independent Test**: Navigating directly to `/products/[slug]` delivers a complete product evaluation experience and enables the Contact CTA, independently of catalog browse.

**Acceptance Scenarios**:

1. **Given** a visitor opens a product detail page, **When** it renders, **Then** they see a split layout: image gallery occupying 60% of viewport width on desktop (full width on mobile) and product information panel on the right 40%.
2. **Given** multiple product images exist, **When** a visitor swipes (mobile) or uses keyboard arrows (desktop), **Then** the gallery cycles through images with a smooth transition; the active image index is always visible.
3. **Given** the product information panel, **When** displayed, **Then** it shows: bilingual product name (English primary, Arabic secondary), a one-line origin story, classification chips (season, type, state), and a primary "Contact to Order" CTA button.
4. **Given** a visitor scrolls below the fold, **When** they reach the story section, **Then** they see a "How we grow it" paragraph and a full-width atmospheric image.
5. **Given** a visitor scrolls to the packaging section, **When** rendered, **Then** a table displays available packaging formats (e.g., 10 kg carton, 5 kg bag) with dimensions and export markings.
6. **Given** a visitor views the seasonal availability mini-chart, **When** rendered, **Then** a 12-month bar indicates which months the product is available, with the current month highlighted.
7. **Given** the related products section, **When** rendered, **Then** it shows a horizontally scrollable row of other products from the same category or season.
8. **Given** a visitor taps "Contact to Order", **When** the CTA is activated, **Then** they are taken to the contact page with the product name pre-filled in the message subject.

---

### User Story 3 — Plan Procurement via Season Calendar (Priority: P2)

An international buyer needs to plan annual purchasing across multiple crops. They visit `/seasons` to see at a glance which products are available in which months, enabling multi-crop procurement planning.

**Why this priority**: No competitor offers this view. It directly serves B2B buyers planning procurement calendars and significantly differentiates the site.

**Independent Test**: `/seasons` can be built, deployed, and used independently as a standalone planning tool — even before the catalog redesign is complete.

**Acceptance Scenarios**:

1. **Given** a visitor navigates to `/seasons`, **When** the page loads, **Then** they see a 12-month grid with products as rows and months as columns; cells are colored with the product's accent color when the product is available that month.
2. **Given** the current month, **When** the calendar renders, **Then** the current month column is visually highlighted (e.g., bolder border, subtle tint).
3. **Given** a visitor clicks a filled availability cell, **When** the click is registered, **Then** a product card popover appears showing the product photo, name, and "View product" link — without navigating away.
4. **Given** a mobile visitor, **When** viewing the season calendar, **Then** the layout adapts to a vertical timeline: months scroll vertically, and each month shows a horizontal strip of available products as mini cards.
5. **Given** a visitor wants to explore a specific month's harvest, **When** they filter or tap a month header, **Then** the view highlights only products available that month.

---

### User Story 4 — Compare Export Grades (Priority: P3)

A procurement quality officer visits `/grades/[product]` to compare export quality grades for a specific crop before finalizing a purchase order.

**Why this priority**: High commercial value for repeat B2B buyers, but dependent on P1/P2 being live. Can be deferred to a subsequent release without blocking the core experience.

**Independent Test**: Each `/grades/[product]` page is self-contained and can be tested and linked to independently — even as a static page before full integration.

**Acceptance Scenarios**:

1. **Given** a visitor navigates to `/grades/oranges`, **When** the page loads, **Then** they see a comparison table with columns for each grade (Premium A / Standard B / Export C) and rows for: size range, Brix level, color standard, weight tolerance, and available packaging.
2. **Given** the comparison table, **When** rendered, **Then** the recommended grade for export (if applicable) is visually highlighted.
3. **Given** a "Download spec sheet" CTA, **When** clicked, **Then** a PDF is downloaded or opened containing the full technical specifications for that product's grades.
4. **Given** a visitor reaches this page from a product detail page, **When** the breadcrumb renders, **Then** it shows: Home → Products → [Product Name] → Export Grades.

---

### Edge Cases

- What happens when a product has no images? → Show a branded placeholder with the product's category icon; do not render a broken image.
- What happens when all products are filtered out? → Show a friendly empty state ("No products match — try broadening your selection") with a "Clear filters" shortcut.
- What happens on the season calendar when a product has no availability data? → Omit that product row from the calendar entirely rather than showing empty cells.
- What happens when a product slug in the URL does not exist? → Serve a 404 page with a "Browse all products" CTA.
- What happens when the "Download spec sheet" PDF is not yet uploaded for a product? → Hide the CTA entirely; do not show a broken link.
- How does the site handle a visitor whose preferred language is not yet fully translated? → Fall back gracefully to English for missing strings; never show a raw translation key.
- What happens if a product has only one image? → The gallery renders without navigation controls (no prev/next); the single image fills the gallery area.

---

## Requirements *(mandatory)*

### Functional Requirements

#### Catalog Page (`/products`)

- **FR-001**: The catalog MUST display a horizontally scrollable category lane at the top of the page, with one lane per product category, each showing full-bleed crop photography and the category name.
- **FR-002**: Selecting a category lane MUST filter the product grid to show only products in that category, with a smooth animated transition (fade + reflow). The URL MUST update to reflect the active filter.
- **FR-003**: The catalog MUST display a mosaic grid where the first card in each visible set is a "hero card" spanning two columns, followed by standard single-column cards. All cards use a 3:4 portrait aspect ratio.
- **FR-004**: The catalog MUST provide a horizontal filter bar (sticky on scroll) with pills for: availability status (In Season Now / Coming Soon / All), product type, and season. All pills MUST be independently toggleable and combinable.
- **FR-005**: Products that are currently in season MUST display a pulsing green dot badge labelled "In Season Now" on the card.
- **FR-006**: Hovering over a product card (desktop) MUST trigger a subtle image zoom (scale 1.05) and reveal an information strip sliding from the bottom showing the product name and season.
- **FR-007**: The catalog MUST support infinite-style loading via a "Load more" button (no numbered pagination). Loading MUST NOT reset scroll position.
- **FR-008**: Filter state MUST be reflected in the URL query string so filtered views can be shared and bookmarked.
- **FR-009**: All filter transitions MUST avoid full page reloads; the grid MUST animate between states.

#### Product Detail Page (`/products/[slug]`)

- **FR-010**: The product detail page MUST use a split layout on desktop: image gallery on the left (60% width) and product information panel on the right (40% width). On mobile, the gallery appears above the information panel, both at full width.
- **FR-011**: The image gallery MUST support swipe navigation on touch devices and keyboard arrow navigation on desktop. An indicator MUST show the current image index (e.g., "2 / 5").
- **FR-012**: The product information panel MUST display: bilingual product name (English primary large, Arabic secondary smaller), a one-line origin statement, classification chips (season, type, state), and a "Contact to Order" CTA button.
- **FR-013**: The "Contact to Order" CTA MUST navigate to the contact page with the product name pre-populated in the message subject field.
- **FR-014**: Below the fold, the page MUST include a "How we grow it" section with one paragraph of descriptive text and a full-width atmospheric image.
- **FR-015**: The page MUST include a packaging & export specs table listing available packaging formats (name, dimensions, weight, export marking).
- **FR-016**: The page MUST include a seasonal availability mini-chart: a 12-cell horizontal bar (one cell per month), filled for available months. The current month MUST be visually highlighted.
- **FR-017**: The page MUST include a related products horizontal scroll section showing other products from the same category or season (minimum 3 cards when data permits).
- **FR-018**: If a product slug does not resolve to a known product, the page MUST display a not-found state with a "Browse all products" link.

#### Season Calendar Page (`/seasons`) — NEW

- **FR-019**: The `/seasons` page MUST render a 12-column (months) × N-row (products) availability grid. Cells are filled with the product's accent color when the product is available in that month.
- **FR-020**: The current month column MUST be visually distinguished from other months at all times.
- **FR-021**: Clicking or tapping a filled availability cell MUST display a product card popover with: product thumbnail, bilingual name, and a "View product →" link. Clicking outside the popover MUST dismiss it.
- **FR-022**: On mobile viewports, the season calendar MUST reflow to a vertical layout: months become the primary vertical scroll axis; each month shows a horizontal strip of its available products as mini cards.
- **FR-023**: The page MUST include a brief introductory heading and subline explaining the calendar's purpose (for first-time visitors).

#### Export Grade Comparison Page (`/grades/[product]`) — NEW

- **FR-024**: The `/grades/[product]` page MUST display a side-by-side comparison table with one column per grade (Premium A / Standard B / Export C) and rows for: size range, Brix level, color standard, weight tolerance, and packaging options.
- **FR-025**: If a recommended grade exists for export, its column MUST be visually highlighted (e.g., branded border, subtle tint).
- **FR-026**: A "Download spec sheet" CTA MUST be present when a PDF spec sheet URL is available for the product. The CTA MUST be hidden when no PDF is available.
- **FR-027**: The page MUST include a breadcrumb trail: Home → Products → [Product Name] → Export Grades.
- **FR-028**: If the product slug is not recognized, a not-found state with a "View all products" link MUST be shown.

#### Global / Cross-Cutting

- **FR-029**: All interactive elements (cards, filter pills, gallery controls, CTA buttons, calendar cells) MUST have a minimum touch target of 44×44 px.
- **FR-030**: All pages MUST be fully bilingual (English and Arabic) with RTL layout support for Arabic. A Russian translation MUST be maintained for existing Russian strings.
- **FR-031**: All pages MUST use a strictly white (`#FFFFFF`) background. No colored page backgrounds are permitted; the single accent color is brand green (`#0fbd66`).
- **FR-032**: Images that fail to load MUST display a branded placeholder (category icon on white) — never a broken image icon.
- **FR-033**: Filter state, active category, and scroll position MUST survive a browser back/forward navigation (use URL state for filters; do not rely on in-memory state alone).

### Key Entities

- **Product**: A crop available for export or purchase. Key attributes: name (EN + AR), slug, category, season, type (Fruit / Vegetable / Frozen), state (Fresh / Frozen), status (Valid / ComingSoon / Invalid), images[], origin story, packaging formats[], accent color (for season calendar).
- **Category**: A grouping of products (e.g., Citrus, Grapes, Root Vegetables). Key attributes: name (EN + AR), slug, cover photograph.
- **Packaging Format**: A purchasable unit configuration. Key attributes: name, weight, dimensions, export marking, grade (Premium A / Standard B / Export C).
- **Export Grade**: A quality tier for a product. Key attributes: grade label, size range, Brix range, color standard, weight tolerance, associated packaging formats, spec sheet PDF URL.
- **Season Availability**: A mapping of product → available months (month numbers 1–12).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A visitor can locate a specific product by category or season filter and reach its detail page in 3 taps or fewer on mobile.
- **SC-002**: A B2B buyer can identify which products are available in a target procurement month in under 30 seconds using the Season Calendar.
- **SC-003**: The catalog grid loads its initial set of products and becomes interactive within 2 seconds on a mid-range mobile device over a standard 4G connection.
- **SC-004**: The product detail gallery transitions between images without perceptible lag (under 100 ms visual response to swipe/keypress).
- **SC-005**: All four pages achieve a Lighthouse accessibility score of 90 or above.
- **SC-006**: Filter changes on the catalog page are reflected in the visible grid within 300 ms (perceived as instant).
- **SC-007**: The "Contact to Order" CTA successfully pre-fills the contact form subject with the product name 100% of the time.
- **SC-008**: Pages render correctly and are fully functional in both LTR (English/Russian) and RTL (Arabic) layout modes.

---

## Assumptions

- The existing backend (`/api/products`, `/api/categories`) returns all data needed for the catalog and detail pages. No new backend endpoints are required for the catalog, detail, or season calendar pages.
- Export grade data (sizes, Brix, color standards, spec sheet PDFs) will be added to the backend before the grades page is built; this data does not currently exist in the API — the grades page is deferred to a later release once the data layer is ready. [NEEDS CLARIFICATION: Is grade/spec-sheet data available or planned?]
- "Seasonal availability" per product is derivable from the existing `season` field (Summer / Winter / AllYear) mapped to approximate calendar months. A precise month-by-month availability array is assumed to be addable to the product record without a major backend change.
- Product "accent color" for the season calendar cells will be defined per category (not per product) and maintained as a frontend constant keyed to category slug, rather than a backend field.
- The "How we grow it" text and the atmospheric image per product are editorial content that must be authored by the client — placeholder content will be used during development.
- Pricing is intentionally not displayed; all purchase intent is directed to the Contact page ("Contact to Order" model).
- The existing Angular SPA routing and `ProductService` / `CategoryService` will be reused and extended, not replaced.
- SSR (server-side rendering) applies to all public pages for SEO; admin pages remain client-only.
- PDF spec sheets will be hosted as static files (e.g., in `/public/assets/specs/`) or linked from an external CDN — no document management system is in scope.
