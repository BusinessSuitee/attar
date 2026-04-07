import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api-base-url.token';

export type OrderRequestStatus = 'new' | 'in_review' | 'contacted' | 'confirmed' | 'closed';

export interface CreateOrderRequestPayload {
  productId: string;
  selectedVarieties: string[];
  selectedPackagingOptions: string[];
  selectedWeightOptions: string[];
  selectedSizeOptions: string[];
  selectedGradeOptions: string[];
  specialSpecification: string | null;
  requesterName: string;
  phoneNumber: string;
  quantityTons: number;
}

export interface OrderRequestListItem {
  id: string;
  productId: string;
  productNameSnapshot: string;
  requesterName: string;
  phoneNumber: string;
  quantityTons: number;
  selectedVarieties: string[];
  selectedPackagingOptions: string[];
  selectedWeightOptions: string[];
  selectedSizeOptions: string[];
  selectedGradeOptions: string[];
  specialSpecification: string | null;
  status: string;
  createdAtUtc: string;
}

export interface OrderRequestsPageResponse {
  items: OrderRequestListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface CreateOrderRequestBody {
  productId: string;
  selectedVarieties: string[];
  selectedPackagingOptions: string[];
  selectedWeightOptions: string[];
  selectedSizeOptions: string[];
  selectedGradeOptions: string[];
  specialSpecification: string | null;
  requesterName: string;
  phoneNumber: string;
  quantityTons: number;
}

interface OrderRequestIdResponse {
  orderRequestId: string;
}

interface UpdateOrderRequestStatusBody {
  status: number;
}

@Injectable({ providedIn: 'root' })
export class OrderRequestService {
  private readonly httpClient = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  createOrderRequest(payload: CreateOrderRequestPayload): Observable<OrderRequestIdResponse> {
    const request: CreateOrderRequestBody = {
      productId: payload.productId,
      selectedVarieties: this.sanitizeSelections(payload.selectedVarieties),
      selectedPackagingOptions: this.sanitizeSelections(payload.selectedPackagingOptions),
      selectedWeightOptions: this.sanitizeSelections(payload.selectedWeightOptions),
      selectedSizeOptions: this.sanitizeSelections(payload.selectedSizeOptions),
      selectedGradeOptions: this.sanitizeSelections(payload.selectedGradeOptions),
      specialSpecification: this.normalizeOptionalText(payload.specialSpecification),
      requesterName: payload.requesterName.trim(),
      phoneNumber: payload.phoneNumber.trim(),
      quantityTons: payload.quantityTons,
    };

    return this.httpClient.post<OrderRequestIdResponse>(
      `${this.apiBaseUrl}/api/order-requests`,
      request,
    );
  }

  getOrderRequests(page = 1, pageSize = 50): Observable<OrderRequestsPageResponse> {
    return this.httpClient.get<OrderRequestsPageResponse>(
      `${this.apiBaseUrl}/api/order-requests?page=${page}&pageSize=${pageSize}`,
    );
  }

  updateOrderRequestStatus(orderRequestId: string, status: OrderRequestStatus): Observable<void> {
    const request: UpdateOrderRequestStatusBody = {
      status: this.toStatusValue(status),
    };

    return this.httpClient.put<void>(
      `${this.apiBaseUrl}/api/order-requests/${orderRequestId}/status`,
      request,
    );
  }

  deleteOrderRequest(orderRequestId: string): Observable<void> {
    return this.httpClient.delete<void>(`${this.apiBaseUrl}/api/order-requests/${orderRequestId}`);
  }

  normalizeStatus(status: string): OrderRequestStatus {
    switch (status.trim().toLowerCase()) {
      case 'inreview':
        return 'in_review';
      case 'contacted':
        return 'contacted';
      case 'confirmed':
        return 'confirmed';
      case 'closed':
        return 'closed';
      default:
        return 'new';
    }
  }

  private toStatusValue(status: OrderRequestStatus): number {
    switch (status) {
      case 'in_review':
        return 1;
      case 'contacted':
        return 2;
      case 'confirmed':
        return 3;
      case 'closed':
        return 4;
      default:
        return 0;
    }
  }

  private sanitizeSelections(values: readonly string[] | null | undefined): string[] {
    if (!Array.isArray(values) || values.length === 0) {
      return [];
    }

    const seen = new Set<string>();
    const normalized: string[] = [];

    for (const rawValue of values) {
      const value = (rawValue ?? '').trim();

      if (!value) {
        continue;
      }

      const key = value.toLowerCase();

      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      normalized.push(value);
    }

    return normalized;
  }

  private normalizeOptionalText(value: string | null | undefined): string | null {
    const normalized = (value ?? '').trim();
    return normalized === '' ? null : normalized;
  }
}
