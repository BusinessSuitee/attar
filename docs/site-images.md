# Site image management

The dashboard at `/admin/site-images` manages the gallery and stations/lands pages. Each placement is independent, including when two records initially reference the same original file.

## Initial content and persistence

`SiteImageSeed.json` embeds 35 published image uses and three hidden farm photos, with the existing paths, ordering and Arabic/English/Russian text. Existing `assets` files and external background URLs remain in place.

API startup creates `SiteImages` and `SiteImageImports` on existing databases using the application's SQL Server initialization pattern. A SQL transaction and application lock serialize the first import. The `site-images-v1` history row prevents a subsequent restart from restoring deleted records, including when the entire image table is empty. Do not delete this history row during routine maintenance.

## Placements

Albums accepting multiple images:

- `gallery` (categories: `farms`, `stations`, `crops`, `legacy`)
- `station-qtc`, `station-mha`, `station-attar`
- `lands-album` (rendered beneath the lands section)

Single-image placements, including hidden records:

- `gallery-hero`, `stations-hero`, `lands-background`
- `sorting`, `washing`, `packing`, `shipping`

Occupied single-image placements return HTTP 409 on an attempted additional image. Replace the existing file or delete its record first.

## API

Public reads expose enabled images. All other endpoints require the existing Admin JWT policy.

| Method | Endpoint | Body |
|---|---|---|
| GET | `/api/site-images?page=gallery` or `?page=stations` | — |
| GET | `/api/site-images/all` | — |
| POST | `/api/site-images` | Multipart: `file` and JSON string `metadata` |
| PUT | `/api/site-images/{id}` | Metadata JSON |
| POST | `/api/site-images/{id}/file` | Multipart: `file` |
| PUT | `/api/site-images/reorder` | `{ "placement": "gallery", "orderedIds": ["..."] }` |
| DELETE | `/api/site-images/{id}` | — |

Metadata example:

```json
{
  "placement": "gallery",
  "category": "farms",
  "isEnabled": true,
  "ar": { "title": "مزرعة", "description": "", "alt": "أشجار المزرعة" },
  "en": { "title": "Farm", "description": "", "alt": "Orchard" },
  "ru": { "title": "", "description": "", "alt": "" }
}
```

Arabic title is required. Other translations fall back to Arabic. Titles allow 220 characters, descriptions 2000, and alternative text 300. Reordering must include every record of that placement exactly once, including hidden records.

New files accept JPG/JPEG/PNG/WebP up to 5 MiB, with server-side extension and signature checks. They are stored under `wwwroot/uploads/site-images`. A replacement uses a new filename and commits its database update before cleaning up the previous upload. Failed database writes clean up the new file and preserve the old source. Referenced uploads and original `assets` files are not removed by deleting another placement.

## Verification and deployment

From `alatar-angular`:

```powershell
node node_modules/@angular/cli/bin/ng.js test --watch=false
node node_modules/@angular/cli/bin/ng.js build
```

From the repository root:

```powershell
dotnet test alatar-dotnet/tests/Alatar.SiteImages.Tests/Alatar.SiteImages.Tests.csproj
dotnet build alatar-dotnet/Alatar.slnx
```

Backend integration tests create and remove isolated SQL Server databases prefixed `AlatarSiteImagesTests_`; they never use the application's configured database. They default to Windows `(localdb)\MSSQLLocalDB`. An alternate integrated-authentication SQL Server can be selected through `ALATAR_TEST_SQL_SERVER`.

Deploy the API first and preserve its existing `wwwroot/uploads` files. Check that the public reads return 20 gallery records (19 photos and one background) and 15 station-page records before any administrator changes, and that authenticated `/all` returns 38. Then deploy Angular. Server hosting renders the two public pages on request rather than using prerendered image snapshots. The existing static Vercel configuration routes `/gallery`, `/stations`, and `/admin/site-images` to `index.csr.html`, allowing them to fetch current data without hydrating the prerendered homepage. Public image requests disable transfer caching so reloads retrieve current content. Failed reads show retry controls; empty successful reads never restore hardcoded photos.

A release API package can be generated from the repository root with:

```powershell
dotnet publish alatar-dotnet/src/Alatar.Api/Alatar.Api.csproj --configuration Release --output alatar-dotnet/artifacts/site-images-api
```
