# Feature Specification: Admin Dashboard

**Feature Branch**: `002-admin-dashboard`
**Created**: 2026-04-27
**Status**: Draft
**Input**: User description: "Build the Admin Dashboard for Alatar — the operations console that internal staff use to manage products, fulfill incoming leads, and configure the public site. Six pages: Products & Categories, Order Requests, Contact Leads, Social Links, Overview, Settings. Backend already exposes everything; reuse Spec 001's shared/ui primitives and the existing admin shell. Designed so the future CRM grows additively, not by rewrite."

## Overview

Alatar's public site collects two flows of intent — **order requests** (a buyer wants a specific product) and **contact leads** (a buyer wants to start a conversation). Today, those submissions land in a backend that has no human-facing surface. The team responds via direct database access. This spec delivers the Admin Dashboard: the operations console where internal staff manage the produce catalog, work the incoming lead pipeline, and configure the public site.

The dashboard is also the **seed of Alatar's future CRM**. The architectural decisions in this spec must keep that door open — adding lead scoring, sales-rep assignment, follow-up reminders, conversion analytics, multi-user roles, and audit logs later must be additive work, not a rewrite. But none of those CRM features are built now; only what the existing backend already supports and the operations team needs day-to-day.

The dashboard's six pages are independently shippable user stories so the team can release Products management first (highest leverage), then Orders, then Contacts, etc., without a big-bang release.

## Clarifications

### Session 2026-04-27

- Q: Image upload timing during product create — when can the admin attach images to a product? → A: Two-step explicit. The create form has no image upload section. After "Save", the page transitions to the edit view where the "Add images" section is enabled.
- Q: KPI "last 7 days" computation when the backend has no stats endpoint? → A: Iterative fetch until older — keep fetching pages until the oldest item in the page is older than 7 days OR a hard max of 5 pages is reached, whichever comes first. The visible count and the "+N more" indicator (when capped) are both derived from this scan.
- Q: Edit surface for products (the richest entity)? → A: Full-page routes — `/admin/products/new` for create and `/admin/products/:id/edit` for edit. Products' bilingual fields, 5 option groups, and image gallery need full width and deep-linkability. Order Requests, Contacts, and Social Links may use lighter surfaces (drawer/modal/inline) since their detail is simpler.
- Q: Bilingual product options on existing seeded data — what happens to the 34 already-seeded products with non-bilingual option strings? → A: Leave existing options as-is. The frontend tolerant `LocalizedTextPipe` (built in Spec 001) renders strings without a `|` delimiter as-is in both languages. No backend migration. Admins re-encode bilingual labels lazily as they edit each product over time.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Curate the produce catalog (Priority: P1)

An admin keeps Alatar's product catalog accurate so the public website always reflects what the company can supply this season. They add new products, update bilingual names and descriptions, manage the five option groups (Varieties, Packaging, Weight, Size, Grade), upload images, change status (Valid / Coming Soon / Invalid), and manage the categories that products belong to.

**Why this priority**: Without product management, the public catalog is unmaintainable and depends on database access. This is the highest-leverage page in the dashboard — every other public-site behavior flows from it. It also exercises the most backend endpoints (CRUD + multipart image upload + status change), so getting it right validates the dashboard's shape.

**Independent Test**: An admin signs in, opens `/admin/products`, browses the existing catalog with filters and search, opens an existing product and edits any field including bilingual fields and option groups, uploads new images and removes an old one, changes the status, and saves — all without page reload. Same admin opens the categories sub-area, creates a new category, edits it, and deletes it.

**Acceptance Scenarios**:

1. **Given** an admin signs in, **When** they navigate to `/admin/products`, **Then** they see the full product catalog (Valid + Coming Soon + Invalid) with image thumbnail, bilingual name, SKU, status, type, state, season, stock quantity, and price visible per row.
2. **Given** the products list is loaded, **When** the admin combines status, type, state, and season filters and a search term, **Then** the visible list narrows to matches across both English and Arabic name and SKU.
3. **Given** the admin clicks "Add product", **When** the create form opens, **Then** they can enter all required fields (name EN+AR, SKU, price, opening stock, description EN+AR, type, state, season) and option groups, and submit.
4. **Given** the admin opens an existing product for editing, **When** they change any field and save, **Then** the list reflects the new values without a full page reload, and the save action is reversible by re-editing.
5. **Given** the admin is editing a product, **When** they upload one or several images, **Then** each upload's progress is visible and the gallery refreshes with the newly uploaded images preserved.
6. **Given** a product has multiple images, **When** the admin deletes a specific image, **Then** the gallery removes it immediately and remaining images keep their order.
7. **Given** the admin changes a product's status (e.g., Valid → Coming Soon), **When** the change is acknowledged, **Then** the list pill updates immediately; if the server rejects the change, the pill reverts to the previous value and a non-blocking error banner appears.
8. **Given** the admin opens the categories sub-area, **When** they create, edit, or delete a category, **Then** the operation completes with confirmation for deletes and the categories list reflects the change.
9. **Given** the admin attempts to delete a category that has products attached (server rejects), **When** the rejection is received, **Then** the UI surfaces a clear error and the category remains.
10. **Given** the admin edits a product in Arabic, **When** they switch the language toggle to English, **Then** the form fields stay in their respective language slots, no data is lost, and the layout flips RTL/LTR.

---

### User Story 2 — Work the order requests inbox (Priority: P2)

An admin processes the queue of order requests submitted from the public site. They open a request, review the requester's contact info, the product asked about, the selected options, the quantity, and any special specifications, then progress the request through the sales workflow: New → InReview → Contacted → Confirmed → Closed. Stale requests can be soft-deleted.

**Why this priority**: This is the only transactional output of the public site, and the lead pipeline of the future CRM. The pattern set here (paginated list + detail view + status workflow + soft-delete + optimistic updates) is the template for Contacts (US3) and any future lead-shaped entity.

**Independent Test**: An admin opens `/admin/orders`, sees a paginated list of submitted order requests, opens a request, sees the full requester + product + options + quantity + notes, advances status from New to Contacted to Confirmed in two clicks, soft-deletes a stale request and confirms it disappears from the list.

**Acceptance Scenarios**:

1. **Given** the admin opens `/admin/orders`, **When** the list loads, **Then** they see a paginated list (server pagination via `page`/`pageSize`) of order requests with columns: requester name, phone, product name (snapshot at submission), quantity in tons, status, created date — newest first.
2. **Given** the list is loaded, **When** the admin filters by status (e.g., New only), **Then** only matching rows remain and the URL or filter UI clearly reflects the active filter.
3. **Given** the list spans multiple pages, **When** the admin navigates to the next page, **Then** the next page loads and the page state is recoverable.
4. **Given** the admin clicks an order request row, **When** the detail opens, **Then** they see the full requester info (name, phone), product reference (with link to the product detail in `/admin/products`), all selected option values for varieties / packaging / weight / size / grade, quantity in tons, special specifications, status, created date.
5. **Given** the admin clicks the "Mark Contacted" action on a New request, **When** the action is confirmed, **Then** the status changes optimistically to Contacted and the list pill updates immediately; if the server rejects, the status reverts and a banner explains.
6. **Given** the admin advances a request to Confirmed and then Closed, **When** the workflow completes, **Then** the request is visible in the list with the final status and is filterable as Closed.
7. **Given** the admin chooses to delete an order request, **When** they confirm in a confirmation dialog, **Then** the request disappears from the list (soft-delete on the backend) and is not retrievable through the dashboard.
8. **Given** the admin returns to the list later, **When** the list reloads, **Then** the soft-deleted request remains hidden.

---

### User Story 3 — Process contact leads (Priority: P3)

An admin processes incoming contact form submissions. They review the lead (Local or Export, with company / country / crop / quantity / delivery window / notes when present), qualify it, and progress the status: InProgress → Contacted → SaleConfirmed.

**Why this priority**: Contact leads are the secondary inquiry funnel — typically broader interest, less specific than an order request. The interaction pattern is nearly identical to US2 (paginated list, detail view, status workflow, delete) so US3 inherits most of US2's components, making it cheap to ship after US2 is solid.

**Independent Test**: An admin opens `/admin/contacts`, sees a paginated list, filters by service type, opens a lead, sees all fields, advances status, and deletes a stale lead.

**Acceptance Scenarios**:

1. **Given** the admin opens `/admin/contacts`, **When** the list loads, **Then** they see a paginated list of contacts with columns: full name, phone, service type (Local/Export), country, status, created date.
2. **Given** the list is loaded, **When** the admin filters by status and service type, **Then** the visible rows match the filters.
3. **Given** the admin clicks a contact row, **When** the detail opens, **Then** they see all fields: full name, phone, service type, company, country (Export only), crop, quantity in tons (if any), delivery window, notes, created date.
4. **Given** the admin advances status from InProgress to Contacted to SaleConfirmed, **When** each transition completes, **Then** the list reflects the new status with optimistic update and rollback on error.
5. **Given** the admin chooses to delete a contact, **When** they confirm, **Then** the contact is removed from the list permanently (no soft-delete on contacts) and a confirmation toast appears.
6. **Given** an Export-type contact has empty company / country / crop fields, **When** the detail renders, **Then** missing fields are clearly marked as "—" rather than blank gaps.

---

### User Story 4 — Configure the public site's social links (Priority: P4)

An admin manages the social media links shown on the public site without touching code. They add platforms, edit URLs and labels, enable/disable links, drag-drop to reorder, and upload custom icon images for platforms not covered by the default icon set.

**Why this priority**: The public site references social links live; configuring them through the dashboard removes a developer dependency. Drag-drop reordering is the most novel interaction in the dashboard and validates that the UI library can host non-trivial UX without bringing in heavy dependencies.

**Independent Test**: An admin opens `/admin/social`, creates a new link, edits an existing link, toggles an existing link off and on, drags-drops to reorder, uploads a custom icon, deletes the custom icon, and reloads the public homepage to confirm the new order is reflected.

**Acceptance Scenarios**:

1. **Given** the admin opens `/admin/social`, **When** the list loads, **Then** they see ALL social links (enabled and disabled), sorted by display order, each row showing platform, URL, label, enabled flag, custom icon (if any), and color hex.
2. **Given** the admin clicks "Add link", **When** the create form opens, **Then** they can choose a platform from the supported list, enter URL and label, optionally select an icon key, optionally set a color hex, and toggle the opens-in-new-tab flag, and save.
3. **Given** the admin edits an existing link's URL, **When** they save, **Then** the list reflects the new URL.
4. **Given** the admin toggles a link's enabled state, **When** the toggle completes, **Then** the change is optimistic and the public site no longer (or now does) include that link on next reload; on server error the toggle reverts and a banner appears.
5. **Given** the admin drags a link to a new position, **When** they release the drop, **Then** the new order is sent to the server, the list reflects the new order optimistically; on server error the order reverts and a banner appears.
6. **Given** the admin uploads a custom icon image to a link, **When** the upload completes, **Then** the icon preview appears in the row and the public site uses the custom icon.
7. **Given** the admin deletes a custom icon, **When** the deletion confirms, **Then** the row reverts to the platform's default icon (or the icon-key fallback).
8. **Given** the admin chooses to delete a link, **When** they confirm, **Then** the link is removed and the public site no longer shows it.

---

### User Story 5 — Get an at-a-glance overview after login (Priority: P5)

An admin signs in and immediately understands what needs attention today: how many products are in each status, how many new order requests and contact leads arrived in the last 7 days, how the contacts split between Local and Export, and what the most recent activity is across orders and contacts.

**Why this priority**: Overview is the landing page after login but depends on the other pages having data flowing through them. It also provides the entry point for the most common workflows (open orders, open contacts, add product). Without US1–US3 in place, Overview is empty; that's why it lands here in priority.

**Independent Test**: An admin signs in, lands on `/admin/overview` automatically, sees KPI tiles populated within seconds, sees the recent activity feed listing the latest 5 orders + contacts merged by date, and clicks a KPI to navigate to the relevant filtered list.

**Acceptance Scenarios**:

1. **Given** the admin signs in successfully, **When** the redirect completes, **Then** they land on `/admin/overview` automatically.
2. **Given** the Overview is loading, **When** KPI tiles are still computing, **Then** skeleton placeholders are visible; once data arrives, tiles render with their counts.
3. **Given** the KPI tiles are populated, **When** the admin clicks the "New order requests (7 days)" tile, **Then** they navigate to `/admin/orders` filtered to the relevant subset (e.g., status=New).
4. **Given** the recent activity feed is populated, **When** the admin clicks an activity row, **Then** they navigate to that record's detail in the appropriate section.
5. **Given** there are no orders or contacts yet, **When** Overview renders, **Then** KPI tiles show zero counts and the activity feed shows a friendly "no recent activity" empty state.
6. **Given** quick-action shortcuts are visible, **When** the admin clicks "Add product", **Then** they navigate to `/admin/products` with the create form open.

---

### User Story 6 — View profile and sign out (Priority: P6)

An admin verifies which account they're signed in with (email, role, token expiry) and signs out when finished.

**Why this priority**: Lowest-priority because the existing JWT login already works and signing out is a single-action need. This story closes the loop on the auth flow but adds little daily-use value once the higher stories ship.

**Independent Test**: An admin opens `/admin/settings`, sees their email, role, and token expiry from the auth-me endpoint, clicks Logout, and is returned to `/admin/login`.

**Acceptance Scenarios**:

1. **Given** the admin opens `/admin/settings`, **When** the page renders, **Then** they see their email, role label, and token expiry timestamp.
2. **Given** the admin clicks Logout, **When** the logout completes, **Then** they are redirected to `/admin/login` and the JWT is cleared.
3. **Given** the admin is logged out, **When** they attempt to navigate to `/admin/products` directly, **Then** they are redirected to `/admin/login`.

---

### Edge Cases

- **Backend unreachable on a list**: skeleton renders, then a non-blocking error banner with retry; previously-loaded data remains visible.
- **Status transition rejected by server**: optimistic UI rolls back to the previous status, banner explains the rejection.
- **Delete a category that has products attached**: server rejects; UI surfaces the error and the category remains.
- **Image upload partial failure (some files fail)**: per-file feedback; successful uploads stay; failed files offer per-file retry.
- **Oversized image upload**: client pre-checks size; clear error; no upload attempted.
- **Long bilingual content overflow in lists**: cells truncate with ellipsis; full content visible on detail/edit.
- **Two admins act on the same record**: last-write-wins; no merge UI (single-role assumption).
- **JWT expires mid-session**: auth interceptor catches 401, signs the admin out, and redirects to `/admin/login` with a flash message.
- **Empty backend lists (first launch with no orders/contacts)**: per-page friendly empty states with quick-action shortcuts.
- **Non-image file uploaded as social-link icon**: client validates file type before upload; clear error.
- **Drag-drop reorder rejected by server**: order rolls back to the previous arrangement, banner explains.
- **Pagination beyond last page**: "Next" disabled; total count visible.
- **Admin cancels mid-form (unsaved changes)**: dirty-state warning before navigation away (basic browser dialog acceptable; no in-app confirm needed for v1).
- **Admin clicks "Save" twice rapidly**: second click is suppressed while the first is in flight.
- **Status workflow control offers an invalid transition**: only valid next steps are surfaced; backwards moves are explicitly allowed and clearly labeled.

## Requirements *(mandatory)*

### Functional Requirements

#### Auth, shell, and cross-cutting

- **FR-001**: All `/admin/*` routes MUST require an authenticated admin session; unauthenticated access redirects to `/admin/login`.
- **FR-002**: Any admin API call returning HTTP 401 MUST sign the admin out and redirect to `/admin/login` with a notice.
- **FR-003**: Every dashboard page MUST render inside the existing admin shell (sidebar, topbar, breadcrumbs, user menu); no admin page bypasses the shell.
- **FR-004**: A language toggle MUST be reachable from the admin shell on every page; switching MUST swap the document direction (LTR/RTL) and translate all visible text.
- **FR-005**: Every list and form MUST show skeleton placeholders during loading; never blank screens.
- **FR-006**: API failures on any admin page MUST surface as a non-blocking error banner with a retry action; data already loaded MUST remain visible while the banner is shown.
- **FR-007**: All destructive actions (delete product, delete category, delete order request, delete contact, delete social link, delete custom icon) MUST require explicit confirmation before executing.
- **FR-008**: All forms MUST validate inputs client-side before submission with inline messages; invalid forms MUST NOT submit.
- **FR-009**: All visible text MUST come from the translation system (Transloco); no hard-coded language strings.
- **FR-010**: All interactive elements MUST meet a minimum 44×44px touch target on mobile and have visible focus rings on keyboard navigation.

#### Products & Categories management (US1)

- **FR-011**: Categories list MUST display all categories with bilingual name (EN+AR), type (Fruit/Vegetable/Frozen), and season (Summer/Winter/AllYear).
- **FR-012**: Admin MUST be able to create a category with bilingual name, type, and season; submission persists and the list refreshes.
- **FR-013**: Admin MUST be able to edit any category's fields; saved changes are visible immediately.
- **FR-014**: Admin MUST be able to delete a category (with confirmation); when the backend rejects deletion (e.g., category has products), the UI surfaces the error and the category remains.
- **FR-015**: Categories list MUST support filtering by type and by season.
- **FR-016**: Products list MUST display all products (Valid + Coming Soon + Invalid) with thumbnail, bilingual name, SKU, status, type, state, season, stock quantity, and price.
- **FR-017**: Products list MUST support filtering by status, type, state, and season, and searching by name (EN and AR) and SKU.
- **FR-018**: Products list interface MUST be designed paginated-ready (UI affords pagination controls and the data layer accepts page/pageSize parameters), even if the current backend returns the full list.
- **FR-019**: Admin MUST be able to create a product on a dedicated full-page route at `/admin/products/new` with required fields: name (EN+AR), SKU, price, opening stock, description (EN+AR), type, state, season; option groups (varieties, packaging, weight, size, grade) are optional during create. On successful create, the route MUST replace itself with `/admin/products/:id/edit` so the admin can immediately add images.
- **FR-020**: Admin MUST be able to edit any field of an existing product on a dedicated full-page route at `/admin/products/:id/edit`; the route MUST be deep-linkable and survive a browser refresh. SKU is treated as immutable per backend conventions and rendered read-only on edit.
- **FR-021**: Admin MUST be able to manage the five option groups: add a new option, edit an existing option's bilingual label, remove an option. The frontend MUST render option labels bilingually using a delimiter convention (`"<EN> | <AR>"`) compatible with the backend's flat `string[]` storage. Existing single-language option strings (no `|` delimiter) MUST render as-is in both languages without forcing an admin to re-encode them; the dashboard MUST NOT block save on legacy single-language options.
- **FR-022**: Admin MUST be able to upload one or multiple images to a product **from the edit view only** (the create form has no image upload section); each upload provides progress feedback and the gallery refreshes after upload completes. After a successful product create, the dashboard MUST automatically transition to the edit view so the admin can add images without re-navigating.
- **FR-023**: Admin MUST be able to delete an individual image from a product gallery; deletion is instant from UI with confirmation.
- **FR-024**: The first image (DisplayOrder=0) of a product MUST be visually marked as the primary image used in public-site lists.
- **FR-025**: Admin MUST be able to change a product's status (Valid / Coming Soon / Invalid) with a single action; the change is optimistic — UI updates immediately, reverts on error with a banner.
- **FR-026**: Status changes MUST be visible in the products list via a status pill/badge.

#### Order Requests inbox (US2)

- **FR-027**: Order requests list MUST be paginated using server-side `page`/`pageSize` parameters; list defaults to newest-first by created date.
- **FR-028**: List columns MUST include: requester name, phone, product name (snapshot at submission), quantity in tons, status, created date.
- **FR-029**: List MUST support filtering by status (New, InReview, Contacted, Confirmed, Closed).
- **FR-030**: Pagination state MUST be preserved when the admin navigates into a detail view and back (returns to the same page with the same filters).
- **FR-031**: Admin MUST be able to open a row to see the full request detail: requester name and phone, product reference (linking to `/admin/products`), all selected option values for varieties/packaging/weight/size/grade, quantity in tons, special specifications, status, created date.
- **FR-032**: Admin MUST be able to transition an order's status through the workflow: New → InReview → Contacted → Confirmed → Closed; backwards transitions MUST be explicitly allowed with clear UI affordance.
- **FR-033**: Status transitions MUST be optimistic; UI updates immediately, reverts on server error with a banner.
- **FR-034**: Admin MUST be able to soft-delete an order request from the detail view; deleted requests MUST NOT appear in any list view.
- **FR-035**: The order request detail view layout MUST reserve space for additional sections (activity timeline, notes, assignments) without restructuring — additions are slot-based.

#### Contact Leads inbox (US3)

- **FR-036**: Contacts list MUST be paginated using server-side `page`/`pageSize`; defaults to newest-first.
- **FR-037**: List columns MUST include: full name, phone, service type (Local/Export), country, status, created date.
- **FR-038**: List MUST support filtering by status (InProgress, Contacted, SaleConfirmed) and service type (Local, Export).
- **FR-039**: Admin MUST be able to open a row to see all fields: full name, phone, service type, company, country (when Export), crop, quantity in tons, delivery window, notes, created date.
- **FR-040**: Empty optional fields in the detail view MUST render as a clear "—" placeholder, not blank space.
- **FR-041**: Admin MUST be able to transition status: InProgress → Contacted → SaleConfirmed (with optimistic update + rollback).
- **FR-042**: Admin MUST be able to delete a contact (hard delete on the backend); deletion requires confirmation.

#### Social Links manager (US4)

- **FR-043**: Social links list MUST display ALL links (enabled + disabled), sorted by display order; each row shows platform, URL, label, enabled flag, custom icon (if any), and color hex.
- **FR-044**: Admin MUST be able to create a social link with platform, URL, label, optional icon key, optional color hex, opens-in-new-tab flag.
- **FR-045**: Admin MUST be able to edit any field of an existing social link.
- **FR-046**: Admin MUST be able to delete a social link (with confirmation).
- **FR-047**: Admin MUST be able to toggle a link's enabled state with a single action; change is optimistic + rollback.
- **FR-048**: Admin MUST be able to drag-and-drop links to reorder them; the new order is persisted to the server immediately and rolled back on server error.
- **FR-049**: Admin MUST be able to upload a custom icon image to a social link; the icon preview appears in the row immediately.
- **FR-050**: Admin MUST be able to delete a custom icon, reverting the row to the platform's default icon or the icon-key fallback.
- **FR-051**: The frontend MUST validate that custom icon uploads are image files of acceptable size before sending to the server.

#### Overview dashboard (US5)

- **FR-052**: Overview MUST be the default landing route after a successful admin login.
- **FR-053**: Overview MUST display KPI tiles for: total products by status (Valid, Coming Soon, Invalid), order requests in the last 7 days, contact leads in the last 7 days, breakdown of contacts by service type (Local vs. Export), breakdown of order requests by status. The "last 7 days" tiles MUST be computed by iteratively fetching pages of the relevant list endpoint, stopping when the oldest item on the current page is older than 7 days OR a hard ceiling of 5 pages is reached. When the ceiling is hit before crossing the 7-day threshold, the tile MUST show the count plus a clear "+more" indicator so the admin knows the number is a lower bound.
- **FR-054**: Overview MUST display a "recent activity" feed showing the latest 5 order requests and latest 5 contacts, merged and sorted by created date.
- **FR-055**: KPI tiles MUST be clickable; clicking navigates to the relevant section with appropriate filters pre-applied (e.g., "Order requests last 7 days" → orders list filtered to the last 7 days where the filter is supported).
- **FR-056**: Activity feed rows MUST be clickable; clicking opens the relevant record's detail in the appropriate section.
- **FR-057**: Overview MUST provide quick-action shortcuts: "Add product" → opens products with create form, "Open orders" → orders list, "Open contacts" → contacts list.
- **FR-058**: Empty state for KPI tiles (zero records) MUST render zeros without errors; empty activity feed MUST render a friendly "no recent activity" message.

#### Settings & Profile (US6)

- **FR-059**: Settings page MUST display the admin's email, role, and token expiry timestamp.
- **FR-060**: Admin MUST be able to log out via a clearly visible action; logout clears the JWT and redirects to `/admin/login`.

#### Architectural future-readiness (observable constraints)

- **FR-061**: Adding a new admin section (e.g., Reports, Users, Audit Log, Sales Reps) MUST require only a new lazy route + page module; no edits to existing admin pages.
- **FR-062**: Adding a new column to any list view (e.g., "assigned to" on order requests) MUST require only a column-definition change; the data table is column-extensible.
- **FR-063**: The status workflow definitions on order requests and contacts MUST be centralized so adding a new status or transition is one location to edit, not every page that renders status.
- **FR-064**: The lead detail views (order request detail, contact detail) MUST be slot-based so adding sections like activity timeline, notes, sales-rep assignment, follow-up date is additive — no detail-view rewrite.

### Key Entities

- **Admin User** *(read-only on the dashboard)*: signed-in identity. Carries email, role label, and token expiry. Sourced from `GET /api/auth/me`. There is one role; multi-role permissions are not modeled in v1.
- **Product** *(full CRUD on the dashboard)*: bilingual name and description, SKU, price, stock quantity, status (Valid / Coming Soon / Invalid), type (Fruit/Vegetable), state (Fresh/Frozen), season, the five option groups, and an image gallery.
- **Category** *(full CRUD)*: bilingual name, type, season. Used by products (today implicitly via type+state, longer-term as a real foreign key when the backend exposes it).
- **Order Request** *(read + status transition + soft-delete)*: requester name and phone, product reference (with name snapshot), selected options (varieties/packaging/weight/size/grade), quantity in tons, special specifications, status (5 states), created date, soft-deleted flag.
- **Contact Lead** *(read + status transition + delete)*: full name, phone, service type (Local/Export), company, country (Export only), crop, quantity in tons (optional), delivery window, notes, status (3 states), created date.
- **Social Link** *(full CRUD + toggle + reorder + custom icon)*: platform (from supported list), URL, label, icon key, custom icon URL, color hex, display order, enabled flag, opens-in-new-tab flag.
- **List view state** *(client-side, per page)*: current pagination page, page size, active filters, active search term. Persisted across navigation within the same dashboard session.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An admin can find and open any specific product within 30 seconds of signing in (measured from login submit to product detail visible).
- **SC-002**: 95% of status transitions on orders / contacts / social links complete (UI confirmed) within 1 second on a typical office network.
- **SC-003**: An admin can complete the full "create new product, upload at least one image, set option groups, set status, save" flow in under 5 minutes.
- **SC-004**: An admin can paginate through at least 1000 order requests without UI lag (no dropped frames, no full-list re-renders).
- **SC-005**: 100% of dashboard text is available in both Arabic and English; switching language updates the full visible page within 1 second.
- **SC-006**: From clicking "Sign in" to seeing the populated Overview KPI tiles takes ≤ 5 seconds on a typical office network.
- **SC-007**: An admin can transition an order request from New to Confirmed in 2 clicks (open detail → click status action).
- **SC-008**: An admin can drag-drop reorder social links and verify the new order on the public homepage within one reload.
- **SC-009**: 100% of destructive actions require explicit confirmation; no destructive action executes from a single accidental click.
- **SC-010**: Adding a new admin section (e.g., a "Reports" page) requires no edits to any of the six existing admin section pages.
- **SC-011**: Adding a new field to the order requests list (e.g., "Assigned To") requires no rework of the order detail view layout.
- **SC-012**: 95% of optimistic actions that succeed on the server stay applied; 100% of optimistic actions that fail on the server roll back to the previous state with a visible banner.
- **SC-013**: 100% of admin pages load to a usable state (skeleton or content) within 2 seconds; non-blocking error banners appear within 5 seconds when the backend is unreachable.

## Assumptions

- **Single admin role**: the backend has only one admin role (per Spec 001 dashboard analysis); the dashboard does not model multi-role access. Sales-rep assignment, role-based permissions, and team management are explicit non-goals for v1.
- **JWT auth is sufficient**: the existing login + 401-handling interceptor covers the auth flow; no password reset, no 2FA, no SSO in v1.
- **Soft-delete on orders, hard-delete on contacts and other entities**: matches the backend's existing semantics. No "trash" / "restore" UI.
- **Default landing**: Overview is the post-login landing.
- **Default language**: AR is the default for the dashboard (matches Spec 001 site-wide behavior); the admin can toggle.
- **Bilingual product name / description / category name**: stored as separate fields on the entity (`name` + `nameAr`, `descriptionEn` + `descriptionAr`, `name` + `nameAr`).
- **Bilingual option labels**: the backend's `string[]` shape is used as-is; the frontend treats option strings as potentially bilingual using a `"<EN> | <AR>"` delimiter convention per Spec 001's `LocalizedTextPipe` tolerant mode. **No migration of existing seeded options is performed**; legacy single-language strings continue to render as-is in both languages, and admins re-encode them lazily as they edit each product.
- **Image upload**: multipart, with backend-defined size limit; frontend pre-checks file size and type before sending.
- **Optimistic UI**: applied to status transitions, enable/disable toggles, drag-drop reorder. Not applied to deletes (deletes wait for server confirmation before removing from UI).
- **KPI tile counts**: computed from existing list endpoints. No dedicated stats endpoint exists; "last 7 days" is computed by iteratively fetching paginated list pages until the oldest item exceeds 7 days OR a hard 5-page ceiling is reached. When the ceiling is hit, the tile shows a "+more" indicator. Default page size for KPI scans is 50.
- **Recent activity feed**: computed by merging the latest paginated results from `GET /api/order-requests` and `GET /api/contacts` and sorting by `createdAtUtc`.
- **Pagination defaults**: 25 rows per page on lists; admin may change page size in v1.5+.
- **Confirmation UI**: a modal dialog (or equivalent inline confirm); exact widget choice deferred to plan.
- **Form widget choice**: Reactive Forms with typed FormGroup is the expected pattern (consistent with existing admin login). Exact validation library is a plan-phase decision.
- **Drag-drop library**: deferred to plan; preference is for a lightweight HTML5 drag-and-drop or signal-based custom solution rather than introducing `@angular/cdk`.
- **Modal pattern**: deferred to plan.
- **No analytics charting**: KPI tiles are simple count numbers and small breakdowns. Recharts/D3/etc. are not in scope.
- **No real-time updates**: all data is fetched on-demand or on page focus; no WebSocket / SignalR / push subscriptions in v1.
- **Existing admin shell + layout primitives**: the dashboard reuses `admin/layout/` components and the existing shell — no parallel layout system.
- **Spec 001 foundational layer**: this dashboard reuses `core/i18n/`, `shared/format/`, `shared/ui/` primitives, and translation patterns built in Spec 001.
- **Existing core services**: `ProductService`, `CategoryService`, `OrderRequestService`, `ContactService`, `SocialLinkService`, and the auth services in `core/auth/` are the data layer; the dashboard layers stores and components on top of them, not replacements.
- **Performance baseline**: targets in Success Criteria assume a typical office-grade network (≥ 5 Mbps) and a modern desktop browser.
- **Existing public pages**: Spec 001 covers them; this dashboard does not modify any public-facing route.

## Dependencies

- **.NET backend** at `alatar-dotnet/` — products, categories, order-requests, contacts, social-links, and auth endpoints. Currently wired to LocalDB in development; production pointing remains as configured.
- **Angular SPA** at `alatar-angular/` — host application. Existing admin shell, sidebar, topbar, breadcrumbs, user-menu, auth guards, login page, and `admin/layout/` primitives are the foundation.
- **Spec 001** (`specs/001-public-home-products/`) foundational layer — `core/i18n/` (current-lang signal, LocalizedTextPipe, LanguagePreferenceService), `shared/format/` (pickLocalized), `shared/ui/` (Card, Button, Badge, Skeleton, EmptyState, ErrorState, ImageWithFallback, Input, Select).
- **Existing core services** in `alatar-angular/src/app/core/` — `ProductService`, `OrderRequestService`, `ContactService`, `SocialLinkService`, `CategoryService` (added in Spec 001).
- **StyleSeed** rules from `.claude/CLAUDE.md` — applied as design discipline, not a v4 skin migration.
