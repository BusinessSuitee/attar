import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { retry, throwError, timer } from 'rxjs';

import { ProductListItem, ProductService } from './product.service';

export type ProductCategoryKey = 'all' | 'Fruit' | 'Vegetable' | 'Frozen';

@Injectable({ providedIn: 'root' })
export class ProductsStore {
  private readonly productService = inject(ProductService);
  private readonly destroyRef = inject(DestroyRef);

  readonly products = signal<ProductListItem[]>([]);
  readonly isLoading = signal(false);
  readonly hasLoaded = signal(false);
  readonly hasError = signal(false);

  readonly pendingCategoryFilter = signal<ProductCategoryKey | null>(null);

  readonly productsByCategory = computed<Record<ProductCategoryKey, ProductListItem[]>>(() => {
    const all = this.products();
    return {
      all,
      Fruit: all.filter((p) => p.productType === 'Fruit' && p.productState === 'Fresh'),
      Vegetable: all.filter((p) => p.productType === 'Vegetable' && p.productState === 'Fresh'),
      Frozen: all.filter((p) => p.productState === 'Frozen'),
    };
  });

  productById(id: string): ProductListItem | undefined {
    return this.products().find((p) => p.id === id);
  }

  ensureLoaded(): void {
    if (this.hasLoaded() || this.isLoading()) {
      return;
    }
    this.fetch();
  }

  reload(): void {
    if (this.isLoading()) {
      return;
    }
    this.fetch();
  }

  private fetch(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.productService
      .getProducts()
      .pipe(
        retry({
          count: 2,
          delay: (error, retryIndex) => {
            if (!this.shouldRetry(error)) {
              return throwError(() => error);
            }
            return timer(800 * retryIndex);
          },
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (products) => {
          this.products.set(products);
          this.hasLoaded.set(true);
          this.isLoading.set(false);
        },
        error: () => {
          this.hasError.set(true);
          this.isLoading.set(false);
        },
      });
  }

  private shouldRetry(error: unknown): boolean {
    if (!(error instanceof HttpErrorResponse)) {
      return true;
    }
    return [0, 408, 425, 429, 500, 502, 503, 504].includes(error.status);
  }
}
