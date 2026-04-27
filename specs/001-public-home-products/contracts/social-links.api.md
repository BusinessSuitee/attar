# Contract: Social Links API (as consumed by the public site)

**Endpoint**: `GET {API_BASE_URL}/api/social-links`
**Source of truth**: `alatar-angular/src/app/core/social-links/social-link.service.ts` (`SocialLinkService.getPublic()`)

The public site only **reads** the enabled subset of social links. The `/all` variant and write operations are admin-only.

## Request

```http
GET /api/social-links HTTP/1.1
```

No authentication required.

## Response 200

```json
[
  {
    "id": "string (uuid)",
    "platform": "Facebook" | "WhatsApp" | "LinkedIn" | "Instagram" | "YouTube" | "X" | "TikTok" | "Telegram" | "Snapchat" | "Pinterest" | "Threads" | "Reddit" | "Discord" | "Skype" | "Viber" | "WeChat" | "Line" | "Messenger" | "Email" | "Phone" | "Website" | "Location" | "Custom",
    "url": "string",
    "label": "string",
    "iconKey": "string | null",
    "customIconUrl": "string | null",
    "colorHex": "string | null",
    "displayOrder": 0,
    "isEnabled": true,
    "opensInNewTab": true
  }
]
```

The list is expected to contain only enabled links (the backend filters `isEnabled === true` for the public endpoint). The frontend treats `isEnabled === false` defensively as a hidden item even if it leaks.

## Frontend handling

| Field | Public-site treatment |
|-------|----------------------|
| `displayOrder` | sort ascending |
| `customIconUrl` | preferred over `iconKey`; relative paths prefixed with `API_BASE_URL` |
| `iconKey` | if no custom icon, map to a known icon set (or fall back to a text label) |
| `colorHex` | optional accent color for the icon background; falls back to the brand neutral if missing |
| `opensInNewTab` | added as `target="_blank" rel="noopener noreferrer"` when true |
| `label` | accessible name (`aria-label`) and tooltip text |

## Errors

| Status | Frontend behavior |
|--------|-------------------|
| 5xx, network failure | The homepage social-strip and the global social-sidebar render nothing (no error banner — these are decorative). |
| Empty array | Same: no UI rendered. |

## Used by

- `pages/home/sections/social-strip.component.ts` (homepage)
- `components/social-sidebar/` (existing global chrome — already wired)

This endpoint is also referenced by the footer; that integration is pre-existing and not affected by this feature.
