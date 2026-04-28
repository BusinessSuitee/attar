import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api-base-url.token';

export type CategoryType = 'Fruit' | 'Vegetable' | 'Frozen';
export type CategorySeason = 'Summer' | 'Winter' | 'AllYear';

export interface CategoryDto {
  id: string;
  name: string;
  nameAr: string;
  type: CategoryType;
  season: CategorySeason;
}

export interface CreateCategoryPayload {
  name: string;
  nameAr: string;
  type: CategoryType;
  season: CategorySeason;
}

export type UpdateCategoryPayload = CreateCategoryPayload;

export interface CategoryIdResponse {
  categoryId: string;
}

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly httpClient = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private get baseUrl(): string {
    return `${this.apiBaseUrl}/api/categories`;
  }

  getAll(): Observable<CategoryDto[]> {
    return this.httpClient.get<CategoryDto[]>(this.baseUrl);
  }

  create(payload: CreateCategoryPayload): Observable<CategoryIdResponse> {
    return this.httpClient.post<CategoryIdResponse>(this.baseUrl, this.normalize(payload));
  }

  update(id: string, payload: UpdateCategoryPayload): Observable<CategoryIdResponse> {
    return this.httpClient.put<CategoryIdResponse>(
      `${this.baseUrl}/${id}`,
      this.normalize(payload),
    );
  }

  delete(id: string): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseUrl}/${id}`);
  }

  private normalize(payload: CreateCategoryPayload): CreateCategoryPayload {
    return {
      name: payload.name.trim(),
      nameAr: payload.nameAr.trim(),
      type: payload.type,
      season: payload.season,
    };
  }
}
