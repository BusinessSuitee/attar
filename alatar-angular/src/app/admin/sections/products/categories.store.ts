import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  CategoryDto,
  CategoryService,
  CategorySeason,
  CategoryType,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from '../../../core/categories/category.service';
import { BackendErrorTranslator } from '../../../core/api/backend-error-translator.service';

export type CategoryTypeFilter = CategoryType | 'all';
export type CategorySeasonFilter = CategorySeason | 'all';

@Injectable({ providedIn: 'root' })
export class CategoriesStore {
  private readonly categoryService = inject(CategoryService);
  private readonly errors = inject(BackendErrorTranslator);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _items = signal<CategoryDto[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _hasLoaded = signal(false);
  private readonly _hasError = signal(false);
  private readonly _errorMessage = signal<string | null>(null);
  private readonly _typeFilter = signal<CategoryTypeFilter>('all');
  private readonly _seasonFilter = signal<CategorySeasonFilter>('all');

  readonly items = this._items.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly hasError = this._hasError.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();
  readonly typeFilter = this._typeFilter.asReadonly();
  readonly seasonFilter = this._seasonFilter.asReadonly();

  readonly visibleItems = computed(() => {
    const type = this._typeFilter();
    const season = this._seasonFilter();
    return this._items().filter((category) => {
      if (type !== 'all' && category.type !== type) return false;
      if (season !== 'all' && category.season !== season) return false;
      return true;
    });
  });

  ensureLoaded(): void {
    if (this._hasLoaded() || this._isLoading()) return;
    this.fetch();
  }

  reload(): void {
    if (this._isLoading()) return;
    this.fetch();
  }

  setTypeFilter(value: CategoryTypeFilter): void {
    this._typeFilter.set(value);
  }

  setSeasonFilter(value: CategorySeasonFilter): void {
    this._seasonFilter.set(value);
  }

  clearFilters(): void {
    this._typeFilter.set('all');
    this._seasonFilter.set('all');
  }

  create(payload: CreateCategoryPayload): Promise<CategoryDto> {
    return new Promise((resolve, reject) => {
      this.categoryService
        .create(payload)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            const newCategory: CategoryDto = {
              id: response.categoryId,
              name: payload.name.trim(),
              nameAr: payload.nameAr.trim(),
              type: payload.type,
              season: payload.season,
            };
            this._items.update((current) => [...current, newCategory]);
            resolve(newCategory);
          },
          error: (error: unknown) => reject(this.errors.translate(error)),
        });
    });
  }

  update(id: string, payload: UpdateCategoryPayload): Promise<CategoryDto> {
    return new Promise((resolve, reject) => {
      this.categoryService
        .update(id, payload)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            const updated: CategoryDto = {
              id,
              name: payload.name.trim(),
              nameAr: payload.nameAr.trim(),
              type: payload.type,
              season: payload.season,
            };
            this._items.update((current) =>
              current.map((category) => (category.id === id ? updated : category)),
            );
            resolve(updated);
          },
          error: (error: unknown) => reject(this.errors.translate(error)),
        });
    });
  }

  delete(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.categoryService
        .delete(id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this._items.update((current) => current.filter((category) => category.id !== id));
            resolve();
          },
          error: (error: unknown) => reject(this.errors.translate(error)),
        });
    });
  }

  private fetch(): void {
    this._isLoading.set(true);
    this._hasError.set(false);
    this._errorMessage.set(null);

    this.categoryService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => {
          this._items.set(categories);
          this._hasLoaded.set(true);
          this._isLoading.set(false);
        },
        error: (error: unknown) => {
          this._hasError.set(true);
          this._errorMessage.set(this.errors.translate(error));
          this._isLoading.set(false);
        },
      });
  }
}
