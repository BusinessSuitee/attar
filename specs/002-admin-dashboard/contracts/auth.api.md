# Contract: Auth API (admin perspective)

**Endpoints**:
- `POST {API_BASE_URL}/api/auth/login`
- `GET {API_BASE_URL}/api/auth/me`

**Source of truth (frontend)**: existing services in `alatar-angular/src/app/core/auth/`. Already wired with the auth interceptor that attaches `Authorization: Bearer <token>` and the auth-error interceptor that catches HTTP 401 and redirects to `/admin/login`.

This dashboard does NOT modify the auth flow. The contract is documented here for completeness.

## POST /api/auth/login

### Request

```http
POST /api/auth/login HTTP/1.1
Content-Type: application/json

{ "email": "string", "password": "string" }
```

### Response 200

```json
{
  "accessToken": "string (JWT)",
  "expiresAtUtc": "string (ISO 8601)",
  "email": "string",
  "role": "Admin"
}
```

### Errors

| Status | Frontend behavior |
|--------|-------------------|
| 400 / 401 | Login form shows "Invalid credentials"; form values preserved (password cleared). |
| 5xx, network | Generic "Something went wrong" banner with retry. |

## GET /api/auth/me

### Request

```http
GET /api/auth/me HTTP/1.1
Authorization: Bearer <token>
```

### Response 200

```json
{ "email": "string", "role": "Admin", "tokenExpiresAt": "string (ISO 8601)" }
```

### Errors

| Status | Frontend behavior |
|--------|-------------------|
| 401 | Auth-error interceptor signs the admin out and redirects to `/admin/login`. |
| 5xx | Settings page shows the cached-from-login values plus a non-blocking error banner. |

### Frontend usage

- Login page: calls `POST /api/auth/login`, stores the token, navigates to `/admin/overview`.
- Admin shell: on mount, calls `GET /api/auth/me` to populate the user menu and verify the token is still valid.
- Settings page (US6): calls `GET /api/auth/me` to display email, role, expiry.
- Logout (US6): clears the token client-side; no backend call needed.
