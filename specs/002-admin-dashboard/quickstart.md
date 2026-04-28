# Quickstart — Admin Dashboard (Products focus)

**Feature**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)

This guide walks through running the admin dashboard locally and verifying the **Products & Categories management** user story (US1). Smoke checks for Orders / Contacts / Social Links / Overview / Settings will be added when those user stories ship.

---

## Prerequisites

- Node 20+ and npm 11.
- .NET 10 SDK.
- SQL Server LocalDB (`sqllocaldb info` should list `MSSQLLocalDB`).
- Local DB already wired and seeded (per the earlier setup): `appsettings.Development.json` points at `(localdb)\MSSQLLocalDB; Database=Alatar`. 7 categories, 34 products, and 8 social links are seeded by `DatabaseInitializer.cs` on first run.

## Run the backend

```bash
cd alatar-dotnet
dotnet run --project src/Alatar.Api
```

Default Development URLs (auto-resolved by `app.config.ts`):
- HTTPS: `https://localhost:7253`
- HTTP: `http://127.0.0.1:5070`

The API logs `Now listening on: ...` once ready. The `EnsureDatabaseCreatedAsync()` call ensures the schema and seeds.

## Run the frontend

```bash
cd alatar-angular
npm install      # first time only
npm start        # serves at http://localhost:4200
```

Open `http://localhost:4200/admin/login` in a fresh browser profile.

## Login

Default admin credentials (from `appsettings.Development.json`):

| Field | Value |
|---|---|
| Email | `admin@attar-eg.com` |
| Password | `a@Tt@ar#E=g1` |

After login you should land on `/admin/overview` (currently a placeholder; will be reworked in US5).

---

## Smoke test — User Story 1 (Products & Categories)

### Categories (FR-011..015)

1. Navigate to `/admin/products` and locate the Categories sub-pane.
2. Confirm the 7 seeded categories render with bilingual names, type, and season columns.
3. Click "+ Add category". Modal opens. Enter `name=Herbs Test`, `nameAr=أعشاب اختبار`, `type=Vegetable`, `season=AllYear`. Save.
4. The new category appears in the list immediately. Reload the page; it persists.
5. Edit the new category: change the season to `Summer`. Save. The list reflects the change.
6. Delete the new category: confirm in the dialog. The category disappears from the list.

Filter test: pick `type=Fruit` filter; only Fruit categories show. Clear filter; all return.

### Products list (FR-016..018, FR-026)

1. On `/admin/products`, confirm the list displays the 34 seeded products with thumbnail, bilingual name, SKU, status pill, type, state, season, stock, and price columns.
2. Combine filters: `status=Valid` + `type=Fruit` + `season=Winter`. List narrows; the URL updates with `?status=Valid&type=Fruit&season=Winter`.
3. Reload the URL with those query parameters; the same filtered view renders.
4. Type a search term ("orange"); list narrows to matches in EN or AR name and SKU.
5. Clear all filters via the "Clear all" action; full list returns.

### Product create (FR-019, Q1 two-step flow)

1. Click "+ New product". Route is now `/admin/products/new`.
2. Confirm there is **no image-gallery section** on the create form (per Q1).
3. Fill required fields: `name=Test Mango EN`, `nameAr=مانجو اختبار`, `sku=TEST-MNG-01`, `price=0`, `openingStock=0`, descriptions (any), `productType=Fruit`, `productState=Fresh`, `season=Summer`. Optionally add one entry to Varieties (e.g., EN=`Keitt`, AR=`كيت`).
4. Click Save.
5. The route auto-replaces with `/admin/products/<newId>/edit`. The page now shows an enabled image-gallery section.

### Product edit + status (FR-020, FR-025, FR-026)

1. On the edit page (continuing from above), change `descriptionEn` to "Sweet test mango". Save. Toast appears: "Product saved".
2. Click the "Coming Soon" status action. The status pill updates immediately to `Coming Soon` (optimistic).
3. (Optional sanity check) Reload the page; the saved status persists.
4. (Optional) To verify rollback: temporarily kill the API, click another status action. UI updates → server fails → status rolls back, error toast with Retry appears.

### Product images (FR-022..024)

1. On the edit page, drag-drop or use the file picker to upload 2 image files (JPEG/PNG, ≤5MB each).
2. Per-file progress overlays appear; on success each thumbnail joins the gallery.
3. The first uploaded image is marked with a "Primary" badge.
4. Click the X on one thumbnail; confirm the dialog. The thumbnail disappears.
5. Try uploading a `.txt` file: blocked client-side with a clear error.
6. Try uploading a 10MB image: blocked client-side.

### Bilingual & RTL (FR-009, FR-031..036 from Spec 001 + FR-004)

1. Toggle language to AR via the topbar. Confirm:
   - Document direction flips to RTL.
   - All admin shell labels (sidebar, topbar) translate.
   - Products list and form labels translate.
   - Form values are preserved during the toggle.
2. Toggle back to EN.

### Option groups bilingual editor (FR-021, Q4 legacy data)

1. Open the edit page for one of the seeded products with existing `varieties` (e.g., Egyptian Oranges).
2. Confirm legacy single-language entries render in the EN input with the AR input empty (per Q4).
3. Add an AR translation to one row, save. Verify the persisted value contains `" | "` delimiter on subsequent reload (no `|` if AR is blank).

---

## Verify the optimistic-update + toast loop

This is the safest place to confirm the UX glue works:

1. Open DevTools → Network; throttle to "Slow 3G".
2. Click a product's status action.
3. Observe: the status pill updates instantly (optimistic).
4. Once the request completes:
   - 2xx → success toast appears, pill stays in the new state.
   - 5xx (rare under throttle) → pill rolls back, error toast with Retry appears. Click Retry to re-run.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Login returns 401 with correct credentials | Backend pointing at remote DB instead of LocalDB | Confirm `appsettings.Development.json` has the LocalDB connection string; restart API. |
| `/admin/products` is empty even after seeded data | Auth interceptor not attaching token | Sign out and back in; check `localStorage` for `attar.lang` and the auth token entry. |
| Image upload returns 415 (Unsupported Media Type) | Frontend not setting multipart correctly | Ensure `FormData` append uses `'files'` as the field name (matches backend `IFormFileCollection` parameter). |
| Status change "looks stuck" | Slow network + no toast | Check `ToastService` is provided in root and `<admin-toast-host>` is mounted in the shell. |
| Form fields show English even after AR toggle | Translation key missing | Check `public/assets/i18n/ar.json` for the relevant `admin.*` key. |
| Console: `localStorage is not defined` | SSR running browser-only code | Wrap in `isPlatformBrowser(this.platformId)`. |

---

## Demo script (for stakeholders, ~3 minutes)

1. **0:00–0:30** Sign in as admin; show the dashboard shell with sidebar.
2. **0:30–1:30** Navigate to Products. Show the list, the filters, the URL updating. Filter to Winter Fruits, search "orange".
3. **1:30–2:30** Open a product → demonstrate bilingual fields, option group editor (legacy data), status change with optimistic update + toast.
4. **2:30–3:00** Create a new product (no images section) → save → page transitions to edit (with image upload now enabled). Upload an image. Done.

Close: "Orders, Contacts, Social Links, Overview, and Settings come next — same shell, same shared primitives, additive routing."

---

## What's NOT in this iteration (US1 only)

- Order Requests inbox (US2) — placeholder remains.
- Contact Leads inbox (US3) — placeholder remains.
- Social Links manager (US4) — placeholder remains.
- Overview dashboard with KPI tiles (US5) — placeholder remains.
- Settings page beyond the existing placeholder (US6).
- Image reordering / changing primary image — backend doesn't expose it; out of scope.
- Bulk operations, CSV export, audit log, sales-rep assignment — explicit non-goals.
