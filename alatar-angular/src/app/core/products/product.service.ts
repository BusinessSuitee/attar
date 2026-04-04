import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api-base-url.token';

export interface ProductListItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  stockQuantity: number;
  status: string;
}

export interface CreateProductPayload {
  name: string;
  sku: string;
  price: number;
  openingStock: number;
}

interface ProductIdResponse {
  productId: string;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly httpClient = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  getProducts(): Observable<ProductListItem[]> {
    return this.httpClient.get<ProductListItem[]>(`${this.apiBaseUrl}/api/products`);
  }

  createProduct(payload: CreateProductPayload): Observable<ProductIdResponse> {
    const request: CreateProductPayload = {
      name: payload.name.trim(),
      sku: payload.sku.trim().toUpperCase(),
      price: payload.price,
      openingStock: payload.openingStock
    };

    return this.httpClient.post<ProductIdResponse>(`${this.apiBaseUrl}/api/products`, request);
  }
}
