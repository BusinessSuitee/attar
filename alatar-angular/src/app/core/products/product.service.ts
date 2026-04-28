import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api-base-url.token';

export type ProductType = 'Fruit' | 'Vegetable';
export type ProductState = 'Fresh' | 'Frozen';
export type ProductSeason = 'Summer' | 'Winter' | 'AllYear';
export type ProductStatus = 'Valid' | 'Invalid' | 'ComingSoon';

export interface LocalizedProductOption {
  key: string;
  labelEn: string;
  labelAr: string;
}

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
  status: ProductStatus;
  descriptionEn: string;
  descriptionAr: string;
  productType: ProductType;
  productState: ProductState;
  season: ProductSeason;
  varieties: string[];
  varietiesLocalized: LocalizedProductOption[];
  packagingOptions: string[];
  packagingOptionsLocalized: LocalizedProductOption[];
  weightOptions: string[];
  weightOptionsLocalized: LocalizedProductOption[];
  sizeOptions: string[];
  sizeOptionsLocalized: LocalizedProductOption[];
  gradeOptions: string[];
  gradeOptionsLocalized: LocalizedProductOption[];
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
  varietiesLocalized?: LocalizedProductOption[];
  packagingOptions: string[];
  packagingOptionsLocalized?: LocalizedProductOption[];
  weightOptions: string[];
  weightOptionsLocalized?: LocalizedProductOption[];
  sizeOptions: string[];
  sizeOptionsLocalized?: LocalizedProductOption[];
  gradeOptions: string[];
  gradeOptionsLocalized?: LocalizedProductOption[];
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
  varietiesLocalized?: LocalizedProductOption[];
  packagingOptions: string[];
  packagingOptionsLocalized?: LocalizedProductOption[];
  weightOptions: string[];
  weightOptionsLocalized?: LocalizedProductOption[];
  sizeOptions: string[];
  sizeOptionsLocalized?: LocalizedProductOption[];
  gradeOptions: string[];
  gradeOptionsLocalized?: LocalizedProductOption[];
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
      varietiesLocalized: this.sanitizeLocalizedOptions(
        payload.varietiesLocalized,
        payload.varieties,
      ),
      packagingOptions: this.sanitizeArray(payload.packagingOptions),
      packagingOptionsLocalized: this.sanitizeLocalizedOptions(
        payload.packagingOptionsLocalized,
        payload.packagingOptions,
      ),
      weightOptions: this.sanitizeArray(payload.weightOptions),
      weightOptionsLocalized: this.sanitizeLocalizedOptions(
        payload.weightOptionsLocalized,
        payload.weightOptions,
      ),
      sizeOptions: this.sanitizeArray(payload.sizeOptions),
      sizeOptionsLocalized: this.sanitizeLocalizedOptions(
        payload.sizeOptionsLocalized,
        payload.sizeOptions,
      ),
      gradeOptions: this.sanitizeArray(payload.gradeOptions),
      gradeOptionsLocalized: this.sanitizeLocalizedOptions(
        payload.gradeOptionsLocalized,
        payload.gradeOptions,
      ),
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
      varietiesLocalized: this.sanitizeLocalizedOptions(
        payload.varietiesLocalized,
        payload.varieties,
      ),
      packagingOptions: this.sanitizeArray(payload.packagingOptions),
      packagingOptionsLocalized: this.sanitizeLocalizedOptions(
        payload.packagingOptionsLocalized,
        payload.packagingOptions,
      ),
      weightOptions: this.sanitizeArray(payload.weightOptions),
      weightOptionsLocalized: this.sanitizeLocalizedOptions(
        payload.weightOptionsLocalized,
        payload.weightOptions,
      ),
      sizeOptions: this.sanitizeArray(payload.sizeOptions),
      sizeOptionsLocalized: this.sanitizeLocalizedOptions(
        payload.sizeOptionsLocalized,
        payload.sizeOptions,
      ),
      gradeOptions: this.sanitizeArray(payload.gradeOptions),
      gradeOptionsLocalized: this.sanitizeLocalizedOptions(
        payload.gradeOptionsLocalized,
        payload.gradeOptions,
      ),
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

  deleteProduct(productId: string): Observable<void> {
    return this.httpClient.delete<void>(`${this.apiBaseUrl}/api/products/${productId}`);
  }

  changeProductStatus(productId: string, status: ProductStatus): Observable<ProductIdResponse> {
    return this.httpClient.patch<ProductIdResponse>(
      `${this.apiBaseUrl}/api/products/${productId}/status`,
      { status },
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

  private sanitizeLocalizedOptions(
    values: LocalizedProductOption[] | undefined,
    fallbackLegacy: string[],
  ): LocalizedProductOption[] {
    const unique = new Map<string, LocalizedProductOption>();

    for (const value of values ?? []) {
      const labelEn = value.labelEn.trim();
      const labelAr = value.labelAr.trim();
      const baseKey = (value.key ?? '').trim() || `${labelEn}-${labelAr}`.trim();

      if (!labelEn && !labelAr) {
        continue;
      }

      const key = this.makeUniqueKey(this.slugifyKey(baseKey), unique);
      unique.set(key, { key, labelEn, labelAr });
    }

    if (unique.size > 0) {
      return Array.from(unique.values());
    }

    for (const raw of fallbackLegacy) {
      const labelEn = raw.trim();
      if (!labelEn) {
        continue;
      }

      const key = this.makeUniqueKey(this.slugifyKey(labelEn), unique);
      unique.set(key, { key, labelEn, labelAr: '' });
    }

    return Array.from(unique.values());
  }

  private slugifyKey(value: string): string {
    const normalized = value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\u0600-\u06ff]+/gi, '-')
      .replace(/^-+|-+$/g, '');

    return normalized || 'option';
  }

  private makeUniqueKey(base: string, existing: Map<string, LocalizedProductOption>): string {
    let candidate = base;
    let index = 2;

    while (existing.has(candidate)) {
      candidate = `${base}-${index++}`;
    }

    return candidate;
  }
}
