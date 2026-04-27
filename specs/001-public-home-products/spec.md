# Feature Specification: Public Homepage & Products Catalog

**Feature Branch**: `001-public-home-products`
**Created**: 2026-04-27
**Status**: Draft
**Input**: User description: "Build the public-facing Homepage and Products page for Alatar (an Egyptian fresh & frozen produce export company website). Build only these two pages, but architect them so the future expansion into a larger website + internal CRM is straightforward. Bilingual EN/AR with RTL is first-class. Use the StyleSeed design engine. The .NET backend already exposes the relevant endpoints — do not change it."

## Overview

Alatar is an Egyptian B2B exporter of fresh and frozen produce (fruits and vegetables). The public website is the first surface that international buyers, importers, and wholesalers see. Today the site is a collection of static HTML pages; an Angular SPA is being built to replace and extend it. This feature delivers the two highest-value public pages — **Homepage** and **Products catalog** — as the foundation of the new SPA.

The strategic intent is a B2B *inquiry* funnel, not e-commerce: a visitor learns who Alatar is, browses the produce catalog, and submits an Order Request that the sales team (and eventually a CRM) will follow up on. There is no checkout, no cart, no payments, no buyer accounts.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - First-time visitor lands and finds the path forward (Priority: P1)

A B2B buyer (importer, wholesaler, food-service procurement officer) visits the homepage for the first time, often via a referral, search engine, or LinkedIn outreach. Within seconds they need to understand: who is Alatar, what do they sell, why should the visitor trust them, and how do they take the next step (browse products or contact sales).

**Why this priority**: This is the entry point of every customer journey. If the homepage fails to communicate the company and route the visitor onward, no other feature on the site matters. It also delivers immediate value standalone — even before the products page is built, a clear homepage with a route to existing static pages is shippable.

**Independent Test**: Open the site root in a fresh browser (mobile and desktop), in both Arabic and English. Confirm the visitor (a) immediately sees the company name and an unambiguous one-line value proposition, (b) sees featured produce categories sourced from the live backend, (c) has at least two visible primary actions: "Browse products" and "Contact us", and (d) can switch language and have the entire page re-render correctly in RTL/LTR.

**Acceptance Scenarios**:

1. **Given** the visitor opens the homepage in a fresh browser, **When** the first viewport renders, **Then** the company hero (name + value proposition) and a primary CTA are visible without scrolling.
2. **Given** the visitor scrolls past the hero, **When** they reach the categories section, **Then** they see a visual list of produce categories pulled live from the backend (not hard-coded).
3. **Given** the visitor clicks "Browse products" on the homepage, **When** the click is registered, **Then** they navigate to the Products catalog page.
4. **Given** the visitor clicks "Contact us" on the homepage, **When** the click is registered, **Then** they reach the existing contact page (or an in-page contact entry that hands off to the existing contact endpoint).
5. **Given** the visitor toggles the language from English to Arabic, **When** the toggle completes, **Then** all visible homepage text translates and the layout flips to RTL — header, hero, categories, footer included.
6. **Given** the visitor opens the homepage on a mobile device, **When** the page renders, **Then** all sections are readable and tappable without horizontal scrolling.
7. **Given** the backend categories endpoint is temporarily unreachable, **When** the homepage loads, **Then** the page still renders, the categories section shows a friendly fallback (e.g., "Categories will be available shortly"), and no broken layout appears.

---

### User Story 2 - Buyer browses and filters the product catalog (Priority: P2)

A buyer who has either landed directly on the Products page or arrived from the homepage now wants to explore what Alatar offers. They may have a specific product in mind ("frozen strawberries"), a category in mind ("winter vegetables"), or no preconception. They need to see what is available, narrow it down quickly, and identify products worth a deeper look.

**Why this priority**: The catalog is the heart of the inquiry funnel. It is the page where intent converts into a shortlist. Without filtering and search, a buyer with a specific need cannot self-serve. This is the first feature that exercises the full backend contract for products and categories.

**Independent Test**: Navigate to the Products page. Confirm the visitor can (a) see a paginated/lazy-loaded grid of products with image, name, and key labels; (b) filter by category, type (Fruit/Vegetable), state (Fresh/Frozen), and season; (c) search by product name in either language; (d) see the URL update to reflect the current filter state so it can be shared; (e) handle 500+ products without scroll lag or full re-renders.

**Acceptance Scenarios**:

1. **Given** the visitor opens the Products page with no filters, **When** the list loads, **Then** they see the first page of products (image, bilingual name, type/state/season indicators) and a clear control to load more or paginate.
2. **Given** the visitor selects a category from the filter, **When** the filter is applied, **Then** the product list updates to show only matching products, the URL reflects the selected category, and the filter chip is visibly active.
3. **Given** the visitor types text into the search box, **When** they pause typing, **Then** the list updates to show products whose name (in either EN or AR) matches the search substring case-insensitively.
4. **Given** the visitor combines multiple filters (e.g., category = "Citrus", state = "Fresh", season = "Winter") plus a search term, **When** all filters are applied, **Then** the list reflects the intersection of all criteria, and a "Clear filters" control is visible.
5. **Given** the active filters return zero results, **When** the empty state appears, **Then** the visitor sees a helpful message explaining no matches were found and a one-click "Clear filters" action.
6. **Given** the visitor copies and re-opens the URL with active filters, **When** the page reloads, **Then** the filters are restored from the URL and the same result set appears.
7. **Given** a product has status "Coming Soon", **When** it appears in the list, **Then** it shows a clear "Coming Soon" badge and is visually distinguished but still clickable for details.
8. **Given** the visitor switches language while viewing filtered results, **When** the toggle completes, **Then** filters remain applied, product names translate, and layout flips RTL/LTR without losing scroll position.
9. **Given** the catalog contains 500+ products, **When** the visitor scrolls or paginates, **Then** scrolling and filtering remain smooth (no full-list re-render, no perceptible lag).

---

### User Story 3 - Buyer views product details and submits an Order Request (Priority: P3)

A buyer who has shortlisted a product wants to inspect it closely (photos, full description, available varieties / packaging / weights / sizes / grades) and then submit an inquiry to Alatar's sales team specifying what they need. This submission is the conversion event of the entire site.

**Why this priority**: Order Request submissions are the only transactional output of the public site. They are the leads that feed the sales team today and the future CRM tomorrow. This story directly creates business value (qualified leads).

**Independent Test**: From the catalog, click any product. Confirm (a) full bilingual product detail with image gallery and option groups renders, (b) a clearly placed "Request this product" CTA opens an Order Request form, (c) the form captures the visitor's name, phone, quantity in tons, special specifications, and their selected options for that product, (d) submission succeeds against the live backend and the visitor sees an unambiguous confirmation, (e) submission failures preserve the form values and offer retry.

**Acceptance Scenarios**:

1. **Given** the visitor clicks a product card, **When** the detail view opens, **Then** they see the product's image gallery, bilingual name and description, type/state/season metadata, and all option groups (Varieties, Packaging, Weight, Size, Grade) with bilingual labels.
2. **Given** the visitor selects one option from each relevant option group, **When** they tap "Request this product", **Then** a form opens pre-populated with the selected options and the product reference.
3. **Given** the visitor fills the form (name, phone, quantity in tons, optional notes) and submits, **When** the submission succeeds, **Then** they see a clear success confirmation including a reference indication (e.g., "We received your request and will contact you within 1 business day"), and the form is cleared.
4. **Given** the submission fails (network or server error), **When** the failure is detected, **Then** the form values remain intact, an actionable error message appears, and the submit action can be retried.
5. **Given** the visitor's input fails validation (missing name, invalid phone, zero quantity), **When** they attempt to submit, **Then** clear inline messages identify the offending fields and submission is blocked.
6. **Given** a product has status "Coming Soon", **When** the visitor opens its detail page, **Then** the product detail is fully visible but the Order Request CTA is replaced with a "Coming Soon" notice (no inquiry form is shown).
7. **Given** the visitor opens a deep link to a product that is no longer available (status "Invalid" or deleted), **When** the page attempts to load, **Then** they see a friendly "This product is no longer available" message with a link back to the catalog.
8. **Given** the visitor switches language while filling the form, **When** the toggle completes, **Then** form values are preserved, labels translate, and the layout flips RTL/LTR.

---

### Edge Cases

- **Product without images**: detail view and card show a category-appropriate placeholder; layout does not break.
- **Product with description in only one language**: the available language is shown; if the visitor's current language has no description, a small notice indicates the description is shown in the other language.
- **Empty catalog (no products at all)**: a friendly empty state explains the catalog will be available soon; filters and search are hidden.
- **Backend slow or unreachable**: skeleton placeholders render first; on timeout, a non-blocking error banner with retry replaces the failing section while the rest of the page remains usable.
- **Visitor switches language mid-form submission**: in-flight submission completes; on next render, form is shown in the new language with values preserved.
- **Long product names or descriptions**: layout truncates gracefully with ellipsis on cards and shows full text on detail.
- **Bidirectional content (Arabic name + English variety codes)**: text renders with correct directionality per segment.
- **Visitor on slow 3G**: first viewport content is prioritized; images lazy-load; non-critical content is deferred.
- **Filter combination yields a very large result set (e.g., "all fruits")**: pagination/lazy loading prevents rendering everything at once.
- **Visitor opens a product detail in a new tab**: the deep link works, page metadata (title, OG tags) reflects the product so the link is share-friendly.

## Requirements *(mandatory)*

### Functional Requirements

#### Homepage

- **FR-001**: The homepage MUST display a hero section containing the company name, a one-line value proposition, and at least one primary call-to-action above the fold on a typical mobile viewport.
- **FR-002**: The homepage MUST display a featured produce categories section sourced live from the categories backend endpoint; categories MUST NOT be hard-coded in the page.
- **FR-003**: The homepage MUST present at least two clearly distinct primary calls-to-action: one routing to the Products catalog, one routing to a contact path (existing static contact page is acceptable).
- **FR-004**: The homepage MUST display Alatar's social links pulled live from the social links backend endpoint, respecting display order and "enabled" flags returned by the backend.
- **FR-005**: The homepage MUST render correctly on mobile (≤430px width), tablet, and desktop without horizontal scrolling and without layout breakage.
- **FR-006**: The homepage MUST be tolerant of partial backend availability: if categories or social links fail to load, the rest of the page MUST still render with friendly fallback messaging in the affected sections.

#### Products catalog page

- **FR-007**: The Products page MUST display a list of products from the products backend endpoint, showing for each product at minimum: primary image (or placeholder), name in the current language, and visual indicators for type (Fruit/Vegetable), state (Fresh/Frozen), and season.
- **FR-008**: The list MUST be paginated or lazy-loaded; visitors MUST NOT be served the full catalog in a single payload regardless of catalog size.
- **FR-009**: Visitors MUST be able to filter the catalog by category, by type (Fruit/Vegetable), by state (Fresh/Frozen), and by season independently and in combination.
- **FR-010**: Visitors MUST be able to search the catalog by product name; the search MUST match against both Arabic and English names with case-insensitive substring matching.
- **FR-011**: Active filters and search terms MUST be reflected in the page URL such that the URL is shareable and reloading the URL restores the same view.
- **FR-012**: A "Clear all filters" action MUST be visible whenever any filter or search term is active.
- **FR-013**: Empty result sets MUST display a helpful empty state with a clear "Clear filters" action; loading states MUST display skeleton placeholders rather than blank space.
- **FR-014**: Product cards MUST visually distinguish products with status "Coming Soon" via a badge or label.
- **FR-015**: Products with status "Invalid" MUST NOT appear in the catalog.
- **FR-016**: Clicking a product card MUST navigate to that product's detail view via a deep-linkable URL that includes the product identifier.
- **FR-017**: The catalog MUST remain responsive and smooth (no perceptible scroll or filter lag) when the underlying dataset reaches at least 500 products.

#### Product detail view

- **FR-018**: The detail view MUST display the product's image gallery; the visitor MUST be able to view all images of the product.
- **FR-019**: The detail view MUST display the product's bilingual name and description; if the description in the active language is missing, the available language MUST be shown with a small notice.
- **FR-020**: The detail view MUST display the product's type, state, season, and category metadata.
- **FR-021**: The detail view MUST display all option groups defined for the product (Varieties, Packaging, Weight, Size, Grade) using the bilingual labels supplied by the backend.
- **FR-022**: For products with status "Valid", the detail view MUST present a primary "Request this product" call-to-action that opens an Order Request form.
- **FR-023**: For products with status "Coming Soon", the detail view MUST replace the Order Request call-to-action with a non-actionable "Coming Soon" notice and MUST NOT expose the inquiry form.
- **FR-024**: For products that cannot be loaded (Invalid, deleted, or 404), the detail view MUST display a friendly "not available" message with a navigation link back to the catalog.

#### Order Request submission

- **FR-025**: The Order Request form MUST capture, at minimum: requester full name, requester phone, quantity (in tons), and an optional special specifications / notes field.
- **FR-026**: The form MUST capture, for each option group of the product, the visitor's selected option (when the group has options); selections MUST default to the option pre-selected on the detail view if any.
- **FR-027**: The form MUST validate inputs client-side before submission: name and phone are required; quantity must be a positive number; phone must be in a plausible format.
- **FR-028**: On submit, the form MUST send only the fields supported by the existing Order Request backend contract; the frontend MUST NOT introduce new fields that the backend does not understand.
- **FR-029**: A successful submission MUST result in a clear confirmation visible to the visitor within 3 seconds of receiving the backend response.
- **FR-030**: A failed submission (network or server error) MUST preserve all form values, display an actionable error message, and allow retry without re-entering data.

#### Bilingual & layout cross-cutting

- **FR-031**: Both pages MUST be available in Arabic and English; a language switcher MUST be globally accessible and persist the visitor's choice across pages and sessions.
- **FR-032**: When Arabic is active, the layout MUST be RTL — text alignment, document direction, navigation order, and decorative directional iconography MUST flip; when English is active, the layout MUST be LTR.
- **FR-033**: All visible text on both pages MUST be sourced from a translation system; no user-facing string MUST be hard-coded in a single language.
- **FR-034**: Both pages MUST be mobile-first responsive, supporting viewports from 320px upward.
- **FR-035**: All interactive elements MUST meet a 44×44px minimum touch target on mobile.
- **FR-036**: The visual design of both pages MUST follow the StyleSeed design engine (tokens, components, layout rules) configured for this project; no parallel design system MUST be introduced.

#### Architectural future-readiness (observable constraints)

- **FR-037**: Adding a new public page (e.g., About, Services, Blog) MUST NOT require structural changes to the Homepage or Products page; routing MUST be organized so new pages are additive.
- **FR-038**: Order Request submissions made through the public site MUST be retrievable through the existing admin Order Requests endpoints with all fields populated and no information loss.
- **FR-039**: Adding a new filter dimension to the catalog (e.g., certifications, origin region) in a future iteration MUST NOT require redesigning the existing filter UI or rewriting the catalog page.
- **FR-040**: Adding new fields to a product card (e.g., MOQ, lead time, certification icons) in a future iteration MUST NOT require redesigning the card layout.

### Key Entities

- **Product** *(read-only on the public site)*: a sellable produce item. Carries bilingual name and description, status (Valid / Coming Soon / Invalid — only Valid and Coming Soon appear publicly), classification (Type: Fruit/Vegetable; State: Fresh/Frozen; Season), category reference, image gallery, and five option groups (Varieties, Packaging, Weight, Size, Grade) where each option carries an internal key plus bilingual labels. Pricing and stock quantity exist on the entity but are NOT exposed publicly.
- **Category** *(read-only on the public site)*: a grouping of products. Carries bilingual name, type, and season. Used to populate homepage featured categories and the catalog category filter.
- **Order Request** *(write-only on the public site)*: a B2B inquiry generated by a visitor for a specific product. Carries requester contact information (name, phone), product reference, snapshot of selected options at the time of submission, requested quantity (in tons), optional special specifications, and creation timestamp. Status, soft-delete state, and admin lifecycle fields are managed by the backend, not by the public site.
- **Social Link** *(read-only on the public site)*: a configured external presence (platform, URL, label, icon, color, display order). Only links flagged enabled by the backend are shown publicly.
- **Language Preference** *(client-side)*: the visitor's selected language (EN or AR). Persisted across navigation and reloads. Drives translation lookup and document direction.
- **Filter State** *(client-side)*: the current combination of search term, category, type, state, and season filters on the catalog. Reflected in the URL and reconstructable from the URL on reload.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visitor can navigate from the homepage to a specific product's detail view in 3 clicks or fewer on both mobile and desktop.
- **SC-002**: 95% of catalog filter interactions update the visible product list within 1 second on a typical 4G mobile connection.
- **SC-003**: A visitor can complete and submit an Order Request from a product detail view in under 2 minutes, assuming they know what they want to order.
- **SC-004**: 100% of user-facing text on the Homepage and Products page is available in both Arabic and English; toggling language updates the visible page content within 1 second.
- **SC-005**: First viewport of the Homepage and the Products catalog page renders within 2.5 seconds on a typical 4G mobile connection.
- **SC-006**: The catalog page remains smooth (no dropped frames during scroll or filter) with at least 500 products in the dataset.
- **SC-007**: At least 95% of well-formed Order Request submissions result in a confirmation visible to the visitor within 3 seconds of submit; failed submissions preserve form values 100% of the time.
- **SC-008**: Adding a new public page (e.g., About) requires no edits to the Homepage or Products page source files; only additive routing and a new page module are required.
- **SC-009**: An Order Request submitted through the public site appears in the admin Order Requests list with all fields (requester, product, options, quantity, specifications) populated and no information loss.
- **SC-010**: The site passes WCAG AA contrast checks on both Homepage and Products page in both LTR and RTL modes; all interactive elements meet the 44×44px minimum touch target rule.
- **SC-011**: Bounce rate on the Homepage is below 60% within the first 30 days of launch (indicator that visitors find a path forward).
- **SC-012**: At least 70% of visitors who reach a product detail view who interact with the Order Request CTA complete the form (indicator the form is not friction-heavy).

## Assumptions

- **Backend stability**: the existing endpoints (`GET /api/products`, `GET /api/categories`, `POST /api/order-requests`, `POST /api/contacts`, `GET /api/social-links`) are stable in shape and contract for the duration of this feature; no backend changes are part of this scope.
- **Default language**: when a visitor has no stored preference, Arabic (AR) is the default, given Alatar's primary market context. Browser locale may override this if it indicates English.
- **Static pages remain**: existing static HTML pages (`about.html`, `contact.html`, `gallery.html`, `partners.html`, `stations.html`, `products.html`) remain in place and untouched; the Angular SPA progressively replaces them. The Homepage being built here becomes the primary `/` route. Cross-links between SPA pages and remaining static pages are acceptable.
- **No public pricing**: product prices and stock quantities are NOT shown publicly. This is a B2B inquiry site, not e-commerce.
- **No checkout, cart, or accounts**: there is no buyer login, no cart, no payment, no order history. Each Order Request is a one-shot inquiry.
- **No newsletter, no live chat**: marketing capture and live chat are out of scope for this feature.
- **"Coming Soon" products are visible but not orderable**: they appear in the catalog with a badge and have a detail page, but the Order Request form is not exposed for them.
- **"Invalid" products are hidden**: they do not appear in the catalog and their detail pages return a "not available" message.
- **Image hosting**: product and social-link images are served via paths returned by the backend; the frontend does not host its own image library.
- **Featured categories on the homepage**: by default, all categories returned by the backend are eligible to be featured; the frontend displays them in the order returned by the backend, capped at a reasonable visual limit (e.g., the first 6) on mobile to avoid overwhelming the homepage.
- **Quantity unit**: the Order Request quantity is captured in tons, matching the existing backend `OrderRequest` schema. No other units are exposed to the visitor.
- **Phone validation**: phone numbers are validated for plausible format only (length, allowed characters); strict per-country validation is out of scope.
- **Translation source**: a translation file/system already exists or will be introduced as part of this feature's plan; this spec does not prescribe its technology.
- **Lead capture is funnel-clean**: every Order Request lands in the existing backend store with a complete record so that, when the future CRM is introduced, no migration of public-site-generated leads is needed beyond reading the existing endpoints.
- **Performance budget**: targets in Success Criteria assume a 4G mobile connection and a mid-tier Android device. Slower connections will degrade gracefully via skeletons and lazy loading but are not held to the same numeric targets.
- **Accessibility floor**: the feature targets WCAG AA at minimum. AAA is desirable but not a release blocker.
- **No SEO scope creep**: basic SEO (page titles, meta description, OG tags for product detail) is included; advanced SEO (sitemaps, schema.org structured data, blog) is out of scope and will be addressed in future features.

## Dependencies

- **.NET backend** at `alatar-dotnet/` — products, categories, order-requests, contacts, social-links endpoints.
- **Angular SPA** at `alatar-angular/` — host application for the new pages.
- **StyleSeed design engine** — installed at `.claude/skills/ss-*` and configured per `.claude/CLAUDE.md`. Provides tokens, components, layout rules, and accessibility primitives.
- **Existing static HTML pages** — referenced from CTAs (e.g., contact) until those pages are migrated into the SPA in future features.
