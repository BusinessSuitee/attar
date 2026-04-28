import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ParamMap, Params } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';

import {
  ProductListItem,
  ProductService,
  ProductSeason,
  ProductState,
  ProductStatus,
  ProductType,
} from '../../../core/products/product.service';
import { ProductsStore } from '../../../core/products/products.store';
import { BackendErrorTranslator } from '../../../core/api/backend-error-translator.service';
import { optimistic } from '../../shared/stores/optimistic.helper';
import { ToastService } from '../../shared/toasts/toast.service';

export interface AdminCatalogFilterState {
  search: string | null;
  status: ProductStatus | null;
  type: ProductType | null;
  state: ProductState | null;
  season: ProductSeason | null;
}

const EMPTY_FILTER: AdminCatalogFilterState = {
  search: null,
  status: null,
  type: null,
  state: null,
  season: null,
};

const PRODUCT_STATUSES: ProductStatus[] = ['Valid', 'Invalid', 'ComingSoon'];
const PRODUCT_TYPES: ProductType[] = ['Fruit', 'Vegetable'];
const PRODUCT_STATES: ProductState[] = ['Fresh', 'Frozen'];
const PRODUCT_SEASONS: ProductSeason[] = ['Summer', 'Winter', 'AllYear'];

export function parseFilterState(params: ParamMap): AdminCatalogFilterState {
  return {
    search: nonEmpty(params.get('q')),
    status: pickEnum(params.get('status'), PRODUCT_STATUSES),
    type: pickEnum(params.get('type'), PRODUCT_TYPES),
    state: pickEnum(params.get('state'), PRODUCT_STATES),
    season: pickEnum(params.get('season'), PRODUCT_SEASONS),
  };
}

export function serializeFilterState(state: AdminCatalogFilterState): Params {
  return {
    q: state.search ?? null,
    status: state.status ?? null,
    type: state.type ?? null,
    state: state.state ?? null,
    season: state.season ?? null,
  };
}

@Injectable({ providedIn: 'root' })
export class AdminCatalogStore {
  private readonly productService = inject(ProductService);
  private readonly productsStore = inject(ProductsStore);
  private readonly toast = inject(ToastService);
  private readonly errors = inject(BackendErrorTranslator);
  private readonly transloco = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _all = signal<ProductListItem[]>([]);
  private readonly _deletingIds = signal<Set<string>>(new Set());
  private readonly _isLoading = signal(false);
  private readonly _hasLoaded = signal(false);
  private readonly _hasError = signal(false);
  private readonly _errorMessage = signal<string | null>(null);
  private readonly _filter = signal<AdminCatalogFilterState>({ ...EMPTY_FILTER });

  readonly all = this._all.asReadonly();
  readonly deletingIds = this._deletingIds.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly hasLoaded = this._hasLoaded.asReadonly();
  readonly hasError = this._hasError.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();
  readonly filter = this._filter.asReadonly();

  readonly visibleItems = computed(() => {
    const f = this._filter();
    const all = this._all();
    const search = (f.search ?? '').trim().toLowerCase();

    return all.filter((product) => {
      if (f.status && product.status !== f.status) return false;
      if (f.type && product.productType !== f.type) return false;
      if (f.state && product.productState !== f.state) return false;
      if (f.season && product.season !== f.season) return false;
      if (search) {
        const hay = [
          product.name?.toLowerCase() ?? '',
          product.nameAr?.toLowerCase() ?? '',
          product.sku?.toLowerCase() ?? '',
        ];
        if (!hay.some((field) => field.includes(search))) return false;
      }
      return true;
    });
  });

  readonly hasActiveFilters = computed(() => {
    const f = this._filter();
    return Boolean(f.search || f.status || f.type || f.state || f.season);
  });

  ensureLoaded(): void {
    if (this._hasLoaded() || this._isLoading()) return;
    this.fetch();
  }

  reload(): void {
    if (this._isLoading()) return;
    this.fetch();
  }

  setFilter(updater: (prev: AdminCatalogFilterState) => AdminCatalogFilterState): void {
    this._filter.update(updater);
  }

  replaceFilter(state: AdminCatalogFilterState): void {
    this._filter.set(state);
  }

  clearFilters(): void {
    this._filter.set({ ...EMPTY_FILTER });
  }

  applyOptimisticStatus(productId: string, newStatus: ProductStatus): void {
    const product = this._all().find((p) => p.id === productId);
    if (!product) return;
    const previous = product.status;

    optimistic({
      applyLocally: () => this.patchStatus(productId, newStatus),
      callServer: () => this.productService.changeProductStatus(productId, newStatus),
      rollback: () => this.patchStatus(productId, previous),
      toastService: this.toast,
      successMessage: this.transloco.translate('admin.products.list.toast_status_updated'),
      failureMessage: this.transloco.translate('admin.products.list.toast_status_failed'),
      retryLabel: this.transloco.translate('common.retry'),
    });
  }

  patchStatus(productId: string, status: ProductStatus): void {
    this._all.update((items) =>
      items.map((p) => (p.id === productId ? { ...p, status } : p)),
    );
    this.productsStore.applyStatusUpdate(productId, status);
  }

  upsertProduct(product: ProductListItem): void {
    this._all.update((items) => {
      const idx = items.findIndex((p) => p.id === product.id);
      if (idx === -1) return [product, ...items];
      const next = [...items];
      next[idx] = product;
      return next;
    });
    this.productsStore.upsertProduct(product);
  }

  deleteProduct(productId: string): void {
    if (this._deletingIds().has(productId)) return;
    this._deletingIds.update((s) => new Set([...s, productId]));

    this.productService
      .deleteProduct(productId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.removeFromDeletingSet(productId);
          this.removeProduct(productId);
          this.toast.success(this.transloco.translate('admin.products.list.toast_deleted'));
        },
        error: () => {
          this.removeFromDeletingSet(productId);
          this.toast.error(this.transloco.translate('admin.products.list.toast_delete_failed'));
        },
      });
  }

  private removeFromDeletingSet(productId: string): void {
    this._deletingIds.update((s) => {
      const next = new Set(s);
      next.delete(productId);
      return next;
    });
  }

  removeProduct(productId: string): void {
    this._all.update((items) => items.filter((p) => p.id !== productId));
    this.productsStore.removeProduct(productId);
  }

  private fetch(): void {
    this._isLoading.set(true);
    this._hasError.set(false);
    this._errorMessage.set(null);

    this.productService
      .getProducts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (products) => {
          this._all.set(products);
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

function nonEmpty(value: string | null): string | null {
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function pickEnum<T extends string>(value: string | null, allowed: readonly T[]): T | null {
  if (value === null) return null;
  return (allowed as readonly string[]).includes(value) ? (value as T) : null;
}
