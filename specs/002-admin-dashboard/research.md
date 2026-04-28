# Phase 0 Research — Admin Dashboard

**Date**: 2026-04-27
**Feature**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)

This document records the technical decisions made during Phase 0. Each section is a real ambiguity that surfaced when the spec met the existing codebase. The four spec-level clarifications already locked down (image-upload timing, KPI computation, edit surface, options migration) are referenced by name; this file covers the **plan-phase** decisions that flow from them.

---

## §1 — Status workflow widget shape

### Decision

Render status transitions as **horizontal action buttons for next-allowed forward transitions**, plus a **kebab (`⋯`) menu for backward / off-path moves**. The currently-active status is a non-clickable pill at the start of the row.

Example for an order with status `InReview`:

```text
[●  InReview]    [→ Mark Contacted]    [→ Skip to Confirmed]    [⋯]
                                                                   └─ Back to New
```

### Rationale

- SC-007 requires "transition New to Confirmed in 2 clicks (open detail → click status action)". Action buttons hit this directly. A dropdown adds an open+select pair; a stepper takes more screen space than the pattern earns.
- Backwards moves are rare and de-emphasizing them in a kebab menu prevents accidental clicks.
- Single declarative `statusWorkflow` configuration powers both the buttons and the kebab — adding a new status (FR-063) is a one-file change.

### Alternatives considered

- **Dropdown with all valid transitions**: 2 clicks for every move (open + select); regresses SC-007 for the common forward case.
- **Stepper / breadcrumb-style timeline**: visually appealing but takes ~3× the screen space and forward moves still require a click on a small target.
- **Inline editable pill**: clicking the current status pill opens a popover with options. Hides intent ("is this clickable?") behind a discovery problem.

### Implication for tasks

`<admin-status-workflow [config]="orderStatusWorkflow" [current]="status" (transition)="onTransition($event)" />` is the single component used by both the orders detail drawer and the orders list inline. Same component is used in contacts with a different config.

---

## §2 — Detail surface choice for non-product entities

### Decision

- **Order Requests, Contact Leads** → **side drawer** (`<admin-side-drawer>`) sliding in from the document end edge. Width 480px on desktop; full-screen overlay on mobile.
- **Social Links** create/edit → **modal dialog** (`<admin-confirm-dialog>` shape, repurposed). Width 560px on desktop.
- **Products** create/edit → **full-page route** (per Q3 clarification, locked in spec).

### Rationale

- Order/contact details are *consumption-heavy*: read the requester's info, click a status action, maybe leave the drawer open while scrolling the list. The drawer pattern keeps the list visible behind it so the admin can scan the queue while working a single item.
- Social link forms are simple (5–6 fields) and don't benefit from list visibility — a modal is sufficient.
- Products' rich content already drove the spec-level decision toward full-page routes.

### Alternatives considered

- **Modal for orders/contacts**: loses the "queue context" — the admin can't see the next item waiting.
- **Full-page for orders/contacts**: needs back-and-forth navigation; slows the queue-working workflow.
- **Inline-expand row for orders/contacts**: looked attractive but rich data (selected options, special specifications, full contact detail) crowds the row visually.

### Implication for tasks

Two reusable surfaces:

- `<admin-side-drawer [open]="..." (close)="...">` for orders, contacts (and any future inbox-style page).
- `<admin-confirm-dialog [open]="..." [title]="..." (close)="...">` reused both as a confirmation pattern AND as a small form host for social-link create/edit.

Both use a backdrop element rendered into a portal-host attached to the admin shell. No CDK.

---

## §3 — Drag-drop implementation for social links reorder

### Decision

Implement a **standalone Angular directive `[adminDragDropList]`** using **HTML5 native drag-and-drop API** (`draggable`, `dragstart`, `dragover`, `drop`) with a signal-based reactive list state. Persist the new order via `SocialLinkService.reorder(orderedIds)`. Optimistic UI: reorder client-side immediately, rollback on server error.

### Rationale

- Reordering social links is the **only** drag-drop interaction in this dashboard. Adding `@angular/cdk` (~250KB minified) for one screen is not justified.
- HTML5 drag-drop is supported in every target browser. The accessibility gap (HTML5 DnD is keyboard-hostile) is mitigated by adding "Move up / Move down" buttons in the row's kebab menu — same a11y story as drag without the keyboard penalty.
- Encapsulating it as a directive keeps the social-links page free of drag-drop concerns.

### Alternatives considered

- **`@angular/cdk/drag-drop`**: most ergonomic API but adds CDK as a peer dep, peer dep on Angular animations, and starts a chain of "we already have CDK, why not CDK Overlay too?" decisions. Rejected.
- **Sortable.js / dragula** wrapper: same dependency-cost argument; plus marshalling between vanilla DOM and Angular signals adds friction.
- **Pure-button reorder (move up / move down only, no drag)**: works but feels regressive for an "obvious drag-drop" interaction. Keep buttons as the keyboard a11y path; drag is the primary affordance.

### Implication for tasks

`admin/shared/ui/drag-drop-list.directive.ts` exposes inputs `[items]` (signal of array) and outputs `(reorder)` emitting the new array order. Consumer (social-links page) handles the HTTP round-trip with optimistic UI.

---

## §4 — Modal / dialog primitive without CDK

### Decision

A custom **`<admin-confirm-dialog>`** standalone component:

- Renders a backdrop + centered card via `<dialog>` element (native HTML5 `<dialog>` + `showModal()` for accessibility-correct focus trap and ESC-to-close, with a `polyfill` fallback only if needed — current target browsers all support it).
- Inputs: `[open]: boolean`, `[title]: string`, `[description]: string`, `[confirmLabel]`, `[cancelLabel]`, `[tone]: 'neutral' | 'danger'`.
- Outputs: `(confirm)`, `(cancel)`.
- Content projection slot for custom body (used by social-link create/edit form).

### Rationale

- Native `<dialog>` is widely supported and built for this exact purpose. Browsers handle focus trap, modality, ESC-to-close, and backdrop dismissal.
- Avoids reinventing focus management.
- Composable: a "confirm delete" use case and a "social-link form" use case share the same shell.

### Alternatives considered

- **CDK Overlay**: rejected per §3 dependency policy.
- **Custom `<div>` overlay with manual focus trap**: doable but ~150 lines of focus-trap and a11y plumbing that native `<dialog>` gives free.
- **Window.confirm()** for confirmations: accessibility floor too low; cannot translate; cannot style.

### Implication for tasks

One file: `admin/shared/ui/confirm-dialog.component.ts`. Used everywhere a destructive action needs confirmation (FR-007: delete product / category / order / contact / social link / custom icon — six call sites) and as the form host for social-link create/edit.

---

## §5 — Toast / notification pattern

### Decision

A **signal-based `ToastService`** with a top-mounted `<admin-toast-host>` outlet placed once inside `admin-shell`.

- API: `toast.success(message)`, `toast.error(message, action?)`, `toast.info(message)`.
- Auto-dismiss after 4s (success), 8s (error). User can click X to dismiss earlier.
- Toasts stack top-end of the admin viewport (top-right in LTR, top-left in RTL).
- Optional `action` callback shown as a button inside the toast (used for "Retry" on optimistic-update rollback).

### Rationale

- Optimistic updates fail loud: every rollback fires a toast (per spec FR-006 / SC-012). Silent rollbacks would confuse admins.
- Signals make the host component a thin reactive listener: `toasts = inject(ToastService).toasts` (a signal); `@for (t of toasts(); track t.id)`.
- No third-party toast library means no peer-dep churn.

### Alternatives considered

- **`ngx-toastr` / similar**: works but adds a dependency for ~50 lines of functionality.
- **Reuse `<ui-error-state>` from Spec 001 inline**: too heavy for transient feedback; designed for non-blocking section-level errors.
- **`alert()` for errors**: accessibility floor, no styling, no action button.

### Implication for tasks

`admin/shared/toasts/toast.service.ts` and `admin/shared/toasts/toast-host.component.ts`. Mounted once in `admin-shell.component.ts`.

---

## §6 — Optimistic update helper

### Decision

A **single small helper** `optimistic<T, R>(opts)` consumed by all three optimistic call sites (status transition, enabled toggle, drag-drop reorder).

```ts
optimistic<T, R>({
  applyLocally: () => void,            // signal mutation that updates UI immediately
  callServer: () => Observable<R>,     // the HTTP call
  rollback: () => void,                // signal mutation that reverts to previous state
  successMessage?: string,             // toast.success on success
  failureMessage?: string,             // toast.error on failure with retry action
});
```

The helper:
1. Calls `applyLocally()` first (UI updates instantly).
2. Subscribes to `callServer()`.
3. On success → `toast.success` (if message provided).
4. On error → `rollback()`, `toast.error` with a "Retry" action that re-runs the same operation.

### Rationale

- Three call sites, one shape — encoded once.
- The `rollback` is *explicit*: the call site captures the previous state in a closure and the rollback restores it. No magic.
- Retry is built in; the spec calls out retry for failed status transitions.

### Alternatives considered

- **Custom RxJS operator**: same idea but harder to compose with signal mutations.
- **Per-store ad-hoc try/catch**: works but copies the pattern three times and risks one site forgetting to roll back.

### Implication for tasks

`admin/shared/stores/optimistic.helper.ts`. Pure function, dependency-injects `ToastService` only when `successMessage` or `failureMessage` is set.

---

## §7 — Iterative-fetch helper for KPI "last 7 days"

### Decision

An **async generator** `iterativeFetchUntil<T>(opts)` that yields pages from a paginated endpoint until either:

1. The oldest item in the page is older than the cutoff date, OR
2. A hard ceiling of 5 pages is reached, OR
3. The endpoint returns an empty page.

The consumer accumulates results and a `cappedAtCeiling: boolean` flag. When `cappedAtCeiling === true`, the KPI tile shows the count plus a "+more" indicator (per FR-053 and Q2 clarification).

```ts
function iterativeFetchUntil<T>(opts: {
  fetchPage: (page: number, pageSize: number) => Observable<{ items: T[]; totalPages?: number }>;
  pageSize: number;                                  // default 50
  maxPages: number;                                  // default 5
  shouldStop: (items: T[]) => boolean;               // e.g., oldest < 7-days-ago
}): { items: T[]; cappedAtCeiling: boolean };
```

### Rationale

- Per Q2 clarification: bounded, accurate at expected volumes, predictable cost.
- Reused by multiple KPI tiles (orders last 7 days, contacts last 7 days, possibly more later).
- Composes naturally with `OverviewStore.refresh()` which fans out parallel scans.

### Alternatives considered

- **Recursive observable chain**: works but the stop predicate becomes harder to read inside `expand()`.
- **Just fetch one page**: rejected by Q2 (silently undercounts).
- **Add a backend stats endpoint**: rejected — backend is fixed in this feature.

### Implication for tasks

`admin/shared/stores/iterative-fetch-recent.ts`. Consumed by `overview.store.ts` for both order requests and contacts.

---

## §8 — Bilingual options editor UX

### Decision

The option-groups editor renders each option as a **single row with two side-by-side inputs (EN | AR)**. The persisted string is `"<EN> | <AR>"` if AR is non-empty, else just `"<EN>"` (or vice versa). On render, legacy single-language strings (no `|`) display in both inputs as "EN: <value>" and "AR: <empty>" — non-blocking per Q4 clarification.

### Rationale

- Two inputs side-by-side makes bilingual entry obvious and visible.
- The `|` delimiter encoding is invisible to the admin; they see two inputs, not a delimiter.
- Legacy data renders without forcing edits.

### Alternatives considered

- **Single input with delimiter visible**: leaks implementation detail; admins forget the convention; data quality degrades.
- **Modal per option for "richer" editing**: heavy for a 5-character label.
- **Separate `enLabels[]` / `arLabels[]` arrays on the entity**: would require backend changes (out of scope).

### Implication for tasks

`option-groups-editor.component.ts` exposes 5 sub-groups (Varieties, Packaging, Weight, Size, Grade). Each row: two inputs + a remove button. Add-row button per group. Save serializes back to `string[]` with the delimiter convention.

---

## §9 — Image gallery editor UX

### Decision

The image-gallery editor on the product edit page renders:

- A **grid of thumbnails** (3 columns desktop, 2 mobile).
- The first thumbnail (DisplayOrder=0) carries a **"Primary" badge**.
- Each thumbnail has an **X** button (delete with confirm).
- A **drop zone / "Add images" button** below the grid that accepts multiple files via standard `<input type="file" multiple accept="image/*">` or drag-drop onto the zone.
- Per-file upload progress shown as an overlay on a "pending" thumbnail.
- File-by-file error feedback (one bad file doesn't block the others).

Reordering / changing primary image is **out of scope for this iteration** (would require a backend reorder endpoint that doesn't exist today).

### Rationale

- Admins primarily add images; reordering is rare and the backend doesn't expose it.
- Per-file progress + error feedback prevents the "one bad file killed all my uploads" failure mode.
- Drag-drop is a quality-of-life enhancement on top of the standard file-input — both work.

### Alternatives considered

- **Single-file upload**: too slow for a typical product with 5–10 images.
- **Reorder via drag**: blocked by the absent backend endpoint; if added later, retrofit using the same `[adminDragDropList]` directive.
- **Cropping / image editing**: out of scope.

### Implication for tasks

`image-gallery-editor.component.ts` reuses Spec 001's `<ui-image>` for thumbnails, reuses `<admin-confirm-dialog>` for delete confirmation. Multipart upload uses the existing `ProductService.uploadProductImages()`.

---

## §10 — Pagination control shape

### Decision

A **simple `<admin-pagination>`** showing: "Page X of Y · `<` Prev `>` Next" with the current and total visible. No "first / last" buttons in v1. Page size is fixed at 25 for orders and contacts (server pageSize default).

### Rationale

- Adequate for the immediate need (per spec assumption: 25 rows per page in v1).
- Simple reduces edge cases (page-out-of-bounds handling, etc.).
- Adding "first / last" or page-number jumps is a one-line config change later.

### Alternatives considered

- **Numbered page links (1 2 3 … 47 48)**: nice UX but more complex; defer.
- **Infinite scroll**: doesn't fit a "queue triage" workflow where admins want stable scroll position when returning to the list after closing a drawer.

### Implication for tasks

One small component reused across orders, contacts, and (future) products lists. Inputs: `[page]`, `[pageSize]`, `[total]`. Outputs: `(pageChange)`.

---

## Summary of plan-phase decisions

| Area | Decision |
|---|---|
| §1 Status workflow widget | Action buttons for forward + kebab for backward |
| §2 Detail surface (orders/contacts/social-links) | Side drawer (orders/contacts), modal (social-link form) |
| §3 Drag-drop | HTML5 native via custom directive; no CDK |
| §4 Modal primitive | Native `<dialog>` element; no CDK |
| §5 Toast | Signal-based service + host outlet; no library |
| §6 Optimistic helper | Single `optimistic()` function; explicit rollback |
| §7 KPI iterative-fetch | Async generator with 5-page ceiling |
| §8 Bilingual option editor | Two side-by-side inputs per row, `|` delimiter on persistence |
| §9 Image gallery editor | Multi-file upload, per-file progress, no reorder yet |
| §10 Pagination | Prev/Next with X-of-Y; numbered links deferred |

All Phase 0 decisions resolved. Proceed to Phase 1.
