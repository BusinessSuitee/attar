import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api-base-url.token';

export type ProductType = 'Fruit' | 'Vegetable';
export type ProductState = 'Fresh' | 'Frozen';
export type ProductSeason = 'Summer' | 'Winter' | 'AllYear';

export interface ProductImageInfo {
  id: string;
  url: string;
}

export interface ProductListItem {
  id: string;
  name: string;
  nameAr: string;
  sku: string;
  price: number;
  stockQuantity: number;
  status: string;
  descriptionEn: string;
  descriptionAr: string;
  productType: ProductType;
  productState: ProductState;
  season: ProductSeason;
  varieties: string[];
  packagingOptions: string[];
  weightOptions: string[];
  sizeOptions: string[];
  gradeOptions: string[];
  imageUrls?: string[];
  images?: ProductImageInfo[];
}

export interface CreateProductPayload {
  name: string;
  nameAr: string;
  sku: string;
  price: number;
  openingStock: number;
  descriptionEn: string;
  descriptionAr: string;
  productType: ProductType;
  productState: ProductState;
  season: ProductSeason;
  varieties: string[];
  packagingOptions: string[];
  weightOptions: string[];
  sizeOptions: string[];
  gradeOptions: string[];
}

export interface UpdateProductPayload {
  name: string;
  nameAr: string;
  price: number;
  stockQuantity: number;
  descriptionEn: string;
  descriptionAr: string;
  productType: ProductType;
  productState: ProductState;
  season: ProductSeason;
  varieties: string[];
  packagingOptions: string[];
  weightOptions: string[];
  sizeOptions: string[];
  gradeOptions: string[];
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
      nameAr: payload.nameAr.trim(),
      sku: payload.sku.trim().toUpperCase(),
      price: payload.price,
      openingStock: payload.openingStock,
      descriptionEn: payload.descriptionEn.trim(),
      descriptionAr: payload.descriptionAr.trim(),
      productType: payload.productType,
      productState: payload.productState,
      season: payload.season,
      varieties: this.sanitizeArray(payload.varieties),
      packagingOptions: this.sanitizeArray(payload.packagingOptions),
      weightOptions: this.sanitizeArray(payload.weightOptions),
      sizeOptions: this.sanitizeArray(payload.sizeOptions),
      gradeOptions: this.sanitizeArray(payload.gradeOptions),
    };

    return this.httpClient.post<ProductIdResponse>(`${this.apiBaseUrl}/api/products`, request);
  }

  updateProduct(productId: string, payload: UpdateProductPayload): Observable<ProductIdResponse> {
    const request: UpdateProductPayload = {
      name: payload.name.trim(),
      nameAr: payload.nameAr.trim(),
      price: payload.price,
      stockQuantity: payload.stockQuantity,
      descriptionEn: payload.descriptionEn.trim(),
      descriptionAr: payload.descriptionAr.trim(),
      productType: payload.productType,
      productState: payload.productState,
      season: payload.season,
      varieties: this.sanitizeArray(payload.varieties),
      packagingOptions: this.sanitizeArray(payload.packagingOptions),
      weightOptions: this.sanitizeArray(payload.weightOptions),
      sizeOptions: this.sanitizeArray(payload.sizeOptions),
      gradeOptions: this.sanitizeArray(payload.gradeOptions),
    };

    return this.httpClient.put<ProductIdResponse>(
      `${this.apiBaseUrl}/api/products/${productId}`,
      request,
    );
  }

  uploadProductImages(
    productId: string,
    files: File[],
  ): Observable<Array<{ id: string; relativePath: string; displayOrder: number }>> {
    const formData = new FormData();

    for (const file of files) {
      formData.append('files', file, file.name);
    }

    return this.httpClient.post<Array<{ id: string; relativePath: string; displayOrder: number }>>(
      `${this.apiBaseUrl}/api/products/${productId}/images`,
      formData,
    );
  }

  deleteProductImage(productId: string, imageId: string): Observable<void> {
    return this.httpClient.delete<void>(
      `${this.apiBaseUrl}/api/products/${productId}/images/${imageId}`,
    );
  }

  private sanitizeArray(values: string[]): string[] {
    const unique = new Set<string>();

    for (const raw of values) {
      const normalized = raw.trim();
      if (!normalized) {
        continue;
      }

      unique.add(normalized);
    }

    return Array.from(unique);
  }
}
