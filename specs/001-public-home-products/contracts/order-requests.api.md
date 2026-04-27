# Contract: Order Requests API (as consumed by the public site)

**Endpoint**: `POST {API_BASE_URL}/api/order-requests`
**Source of truth**: `alatar-angular/src/app/core/orders/order-request.service.ts` (`OrderRequestService.createOrderRequest()`)

The public site only **submits** order requests. Listing, status updates, and deletion are admin-only and out of scope for this feature.

## Request

```http
POST /api/order-requests HTTP/1.1
Content-Type: application/json

{
  "productId": "string (uuid)",
  "selectedVarieties":        ["string", "..."],
  "selectedPackagingOptions": ["string", "..."],
  "selectedWeightOptions":    ["string", "..."],
  "selectedSizeOptions":      ["string", "..."],
  "selectedGradeOptions":     ["string", "..."],
  "specialSpecification":     "string | null",
  "requesterName":            "string",
  "phoneNumber":              "string",
  "quantityTons":             0
}
```

No authentication required (public form).

### Field constraints (enforced client-side)

| Field | Constraint |
|-------|-----------|
| `productId` | non-empty UUID, sourced from the route param |
| `selected*` arrays | each entry trimmed and unique; empty arrays allowed |
| `specialSpecification` | trimmed; empty string normalized to `null` |
| `requesterName` | trimmed, length ≥ 2 |
| `phoneNumber` | trimmed, matches `/^[+\d][\d\s\-()]{5,19}$/` |
| `quantityTons` | finite number, > 0 |

The frontend submits arrays even when only one option per group is selected — the backend already accepts arrays for all option fields. This keeps the contract stable when the public form later allows multi-select.

## Response 200/201

```json
{
  "orderRequestId": "string (uuid)"
}
```

The frontend treats the presence of `orderRequestId` as confirmation. No further data is needed for the success state.

## Errors

| Status | Frontend behavior |
|--------|-------------------|
| 400 (validation) | Surface the server message in a non-blocking banner above the form; preserve all field values; re-enable submit. |
| 404 (product not found) | Banner: "This product is no longer available." Offer link back to catalog. |
| 5xx, network failure | Banner: "We couldn't send your request — please try again." Preserve values; re-enable submit. |

## Frontend bridge

The form's typed control values are mapped into `CreateOrderRequestPayload` (already typed at `core/orders/order-request.service.ts`) — see [data-model.md §5](../data-model.md#5-orderrequestform-form-model) for the exact mapping. The existing `OrderRequestService` already handles trim/uniqueness sanitization in `createOrderRequest()`, so the form does not double-sanitize.

## Telemetry expectations (informational, not implemented in this feature)

The future CRM consumes order requests via the existing admin endpoints (`GET /api/order-requests`, etc.). No additional frontend instrumentation is required for the CRM hand-off — the backend store is the single funnel.
