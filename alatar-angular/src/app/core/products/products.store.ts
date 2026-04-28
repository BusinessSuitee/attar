import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { retry, throwError, timer } from 'rxjs';

import { ProductListItem, ProductService, ProductStatus } from './product.service';

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

  readonly validProductsByCategory = computed<Record<ProductCategoryKey, ProductListItem[]>>(() => {
    const grouped = this.productsByCategory();
    return {
      all: grouped.all.filter((p) => p.status === 'Valid'),
      Fruit: grouped.Fruit.filter((p) => p.status === 'Valid'),
      Vegetable: grouped.Vegetable.filter((p) => p.status === 'Valid'),
      Frozen: grouped.Frozen.filter((p) => p.status === 'Valid'),
    };
  });

  productById(id: string): ProductListItem | undefined {
    return this.products().find((p) => p.id === id);
  }

  upsertProduct(product: ProductListItem): void {
    this.products.update((items) => {
      const idx = items.findIndex((p) => p.id === product.id);
      if (idx === -1) return [product, ...items];
      const next = [...items];
      next[idx] = product;
      return next;
    });
  }

  removeProduct(productId: string): void {
    this.products.update((items) => items.filter((p) => p.id !== productId));
  }

  applyStatusUpdate(productId: string, status: ProductStatus): void {
    this.products.update((items) =>
      items.map((p) => (p.id === productId ? { ...p, status } : p)),
    );
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
