import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ParamMap, Params } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';

import {
  OrderRequestListItem,
  OrderRequestService,
  OrderRequestStatus,
} from '../../../core/orders/order-request.service';
import { BackendErrorTranslator } from '../../../core/api/backend-error-translator.service';
import { optimistic } from '../../shared/stores/optimistic.helper';
import { ToastService } from '../../shared/toasts/toast.service';

export type DateRangeFilter = 'today' | '7d' | '30d' | null;

export interface OrdersFilterState {
  search: string | null;
  status: OrderRequestStatus | null;
  range: DateRangeFilter;
}

const EMPTY_FILTER: OrdersFilterState = { search: null, status: null, range: null };

const ORDER_STATUSES: OrderRequestStatus[] = ['new', 'in_review', 'contacted', 'confirmed', 'closed'];
const DATE_RANGES: DateRangeFilter[] = ['today', '7d', '30d'];

export function parseOrdersFilterState(params: ParamMap): OrdersFilterState {
  return {
    search: nonEmpty(params.get('q')),
    status: pickEnum(params.get('status'), ORDER_STATUSES),
    range: pickEnum(params.get('range'), DATE_RANGES as string[]) as DateRangeFilter,
  };
}

export function serializeOrdersFilterState(state: OrdersFilterState): Params {
  return {
    q: state.search ?? null,
    status: state.status ?? null,
    range: state.range ?? null,
  };
}

const LOAD_PAGE_SIZE = 100;
const MAX_PAGES = 50;

@Injectable({ providedIn: 'root' })
export class AdminOrdersStore {
  private readonly orderService = inject(OrderRequestService);
  private readonly toast = inject(ToastService);
  private readonly errors = inject(BackendErrorTranslator);
  private readonly transloco = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _all = signal<OrderRequestListItem[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _hasLoaded = signal(false);
  private readonly _hasError = signal(false);
  private readonly _errorMessage = signal<string | null>(null);
  private readonly _filter = signal<OrdersFilterState>({ ...EMPTY_FILTER });
  private readonly _page = signal(1);
  private readonly _pageSize = signal(20);

  readonly all = this._all.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly hasError = this._hasError.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();
  readonly filter = this._filter.asReadonly();
  readonly page = this._page.asReadonly();
  readonly pageSize = this._pageSize.asReadonly();

  readonly filteredItems = computed(() => {
    const f = this._filter();
    const all = this._all();
    const search = (f.search ?? '').trim().toLowerCase();
    const now = Date.now();

    return all.filter((item) => {
      const status = this.orderService.normalizeStatus(item.status);

      if (f.status && status !== f.status) return false;

      if (f.range) {
        const created = new Date(item.createdAtUtc).getTime();
        if (f.range === 'today') {
          const d = new Date();
          const todayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
          if (created < todayStart) return false;
        } else if (f.range === '7d') {
          if (created < now - 7 * 864e5) return false;
        } else if (f.range === '30d') {
          if (created < now - 30 * 864e5) return false;
        }
      }

      if (search) {
        const hay = [
          (item.requesterName ?? '').toLowerCase(),
          (item.phoneNumber ?? '').toLowerCase(),
          (item.productNameSnapshot ?? '').toLowerCase(),
        ];
        if (!hay.some((h) => h.includes(search))) return false;
      }

      return true;
    });
  });

  readonly totalFilteredCount = computed(() => this.filteredItems().length);

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredItems().length / this._pageSize())),
  );

  readonly pagedItems = computed(() => {
    const start = (this._page() - 1) * this._pageSize();
    return this.filteredItems().slice(start, start + this._pageSize());
  });

  readonly hasActiveFilters = computed(() => {
    const f = this._filter();
    return Boolean(f.search || f.status || f.range);
  });

  readonly kpis = computed(() => {
    const all = this._all();
    const cutoff7d = Date.now() - 7 * 864e5;
    let newCount = 0, inProgress = 0, confirmed7d = 0;

    for (const item of all) {
      const s = this.orderService.normalizeStatus(item.status);
      if (s === 'new') newCount++;
      if (s === 'in_review' || s === 'contacted') inProgress++;
      if (s === 'confirmed' && new Date(item.createdAtUtc).getTime() >= cutoff7d) confirmed7d++;
    }

    return { total: all.length, newCount, inProgress, confirmed7d };
  });

  readonly customerRequestCounts = computed(() => {
    const counts = new Map<string, number>();
    for (const item of this._all()) {
      const phone = (item.phoneNumber ?? '').trim();
      if (phone) counts.set(phone, (counts.get(phone) ?? 0) + 1);
    }
    return counts;
  });

  ensureLoaded(): void {
    if (this._hasLoaded() || this._isLoading()) return;
    this.loadNextPage(1, []);
  }

  reload(): void {
    if (this._isLoading()) return;
    this._hasLoaded.set(false);
    this.loadNextPage(1, []);
  }

  setFilter(updater: (prev: OrdersFilterState) => OrdersFilterState): void {
    this._filter.update(updater);
    this._page.set(1);
  }

  replaceFilter(state: OrdersFilterState): void {
    this._filter.set(state);
  }

  clearFilters(): void {
    this._filter.set({ ...EMPTY_FILTER });
    this._page.set(1);
  }

  setPage(page: number): void {
    this._page.set(page);
  }

  setPageSize(size: number): void {
    this._pageSize.set(size);
    this._page.set(1);
  }

  updateStatus(id: string, newStatus: OrderRequestStatus): void {
    const item = this._all().find((i) => i.id === id);
    if (!item) return;
    const previousStatus = item.status;

    optimistic({
      applyLocally: () => this.patchItemStatus(id, newStatus),
      callServer: () => this.orderService.updateOrderRequestStatus(id, newStatus),
      rollback: () =>
        this._all.update((items) =>
          items.map((i) => (i.id === id ? { ...i, status: previousStatus } : i)),
        ),
      toastService: this.toast,
      successMessage: this.transloco.translate('admin.orders.toast.status_updated'),
      failureMessage: this.transloco.translate('admin.orders.toast.status_failed'),
      retryLabel: this.transloco.translate('common.retry'),
    });
  }

  deleteOrder(id: string, onSuccess?: () => void): void {
    this.orderService.deleteOrderRequest(id).subscribe({
      next: () => {
        this._all.update((items) => items.filter((i) => i.id !== id));
        this.toast.success(this.transloco.translate('admin.orders.toast.deleted'));
        onSuccess?.();
      },
      error: () => {
        this.toast.error(this.transloco.translate('admin.orders.toast.delete_failed'));
      },
    });
  }

  private patchItemStatus(id: string, status: OrderRequestStatus): void {
    this._all.update((items) =>
      items.map((i) => (i.id === id ? { ...i, status } : i)),
    );
  }

  private loadNextPage(page: number, accumulated: OrderRequestListItem[]): void {
    this._isLoading.set(true);
    if (page === 1) {
      this._hasError.set(false);
      this._errorMessage.set(null);
    }

    this.orderService
      .getOrderRequests(page, LOAD_PAGE_SIZE)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const all = [...accumulated, ...response.items];
          if (page < Math.min(response.totalPages, MAX_PAGES)) {
            this.loadNextPage(page + 1, all);
          } else {
            this._all.set(all);
            this._hasLoaded.set(true);
            this._isLoading.set(false);
          }
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

function pickEnum<T extends string>(value: string | null, allowed: readonly string[]): T | null {
  if (value === null) return null;
  return allowed.includes(value) ? (value as T) : null;
}
