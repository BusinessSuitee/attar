import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api-base-url.token';

export type OrderRequestStatus = 'new' | 'in_review' | 'contacted' | 'confirmed' | 'closed';

export interface CreateOrderRequestPayload {
  productId: string;
  selectedVariety: string | null;
  selectedPackaging: string | null;
  selectedWeight: string | null;
  selectedSize: string | null;
  selectedGrade: string | null;
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
  selectedVariety: string | null;
  selectedPackaging: string | null;
  selectedWeight: string | null;
  selectedSize: string | null;
  selectedGrade: string | null;
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
  selectedVariety: string | null;
  selectedPackaging: string | null;
  selectedWeight: string | null;
  selectedSize: string | null;
  selectedGrade: string | null;
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
      selectedVariety: payload.selectedVariety,
      selectedPackaging: payload.selectedPackaging,
      selectedWeight: payload.selectedWeight,
      selectedSize: payload.selectedSize,
      selectedGrade: payload.selectedGrade,
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
}
