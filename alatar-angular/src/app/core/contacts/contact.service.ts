import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api-base-url.token';

export type ContactUiServiceType = 'local' | 'export';

export interface CreateContactPayload {
  fullName: string;
  phoneNumber: string;
  serviceType: ContactUiServiceType;
  companyName: string | null;
  country: string | null;
  crop: string | null;
  quantityTons: number | null;
  deliveryWindow: string | null;
  notes: string | null;
}

export interface ContactListItem {
  id: string;
  fullName: string;
  phoneNumber: string;
  serviceType: string;
  status: string;
  companyName: string | null;
  country: string | null;
  crop: string | null;
  quantityTons: number | null;
  deliveryWindow: string | null;
  notes: string | null;
  createdAtUtc: string;
}

export type ContactStatus = 'in_progress' | 'contacted' | 'sale_confirmed';

export interface ContactsPageResponse {
  items: ContactListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface CreateContactRequest {
  fullName: string;
  phoneNumber: string;
  serviceType: number;
  companyName: string | null;
  country: string | null;
  crop: string | null;
  quantityTons: number | null;
  deliveryWindow: string | null;
  notes: string | null;
}

interface ContactIdResponse {
  id: string;
}

interface UpdateContactStatusRequest {
  status: number;
}

@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly httpClient = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  createContact(payload: CreateContactPayload): Observable<ContactIdResponse> {
    const request: CreateContactRequest = {
      fullName: payload.fullName.trim(),
      phoneNumber: payload.phoneNumber.trim(),
      serviceType: payload.serviceType === 'export' ? 1 : 0,
      companyName: payload.companyName,
      country: payload.country,
      crop: payload.crop,
      quantityTons: payload.quantityTons,
      deliveryWindow: payload.deliveryWindow,
      notes: payload.notes
    };

    return this.httpClient.post<ContactIdResponse>(`${this.apiBaseUrl}/api/contacts`, request);
  }

  getContacts(page = 1, pageSize = 50): Observable<ContactsPageResponse> {
    return this.httpClient.get<ContactsPageResponse>(
      `${this.apiBaseUrl}/api/contacts?page=${page}&pageSize=${pageSize}`
    );
  }

  updateContactStatus(contactId: string, status: ContactStatus): Observable<void> {
    const request: UpdateContactStatusRequest = {
      status: this.toStatusValue(status)
    };

    return this.httpClient.put<void>(`${this.apiBaseUrl}/api/contacts/${contactId}/status`, request);
  }

  deleteContact(contactId: string): Observable<void> {
    return this.httpClient.delete<void>(`${this.apiBaseUrl}/api/contacts/${contactId}`);
  }

  normalizeStatus(status: string): ContactStatus {
    switch (status.trim().toLowerCase()) {
      case 'contacted':
        return 'contacted';
      case 'saleconfirmed':
        return 'sale_confirmed';
      default:
        return 'in_progress';
    }
  }

  private toStatusValue(status: ContactStatus): number {
    switch (status) {
      case 'contacted':
        return 1;
      case 'sale_confirmed':
        return 2;
      default:
        return 0;
    }
  }
}
