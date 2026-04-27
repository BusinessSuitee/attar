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

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly httpClient = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  getAll(): Observable<CategoryDto[]> {
    return this.httpClient.get<CategoryDto[]>(`${this.apiBaseUrl}/api/categories`);
  }
}
