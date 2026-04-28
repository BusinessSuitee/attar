import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { AdminPageComponent } from '../../layout/admin-page/admin-page.component';
import { AdminPageHeaderComponent } from '../../layout/admin-page-header/admin-page-header.component';
import { AdminSectionCardComponent } from '../../layout/admin-section-card/admin-section-card.component';

import { OrderRequestListItem } from '../../../core/orders/order-request.service';
import {
  AdminOrdersStore,
  OrdersFilterState,
  parseOrdersFilterState,
  serializeOrdersFilterState,
} from './orders.store';

import { OrdersKpiStripComponent } from './components/orders-kpi-strip.component';
import { OrdersFiltersComponent } from './components/orders-filters.component';
import { OrdersListTableComponent } from './components/orders-list-table.component';
import { OrderDetailDrawerComponent } from './components/order-detail-drawer.component';

@Component({
  selector: 'app-admin-orders-page',
  standalone: true,
  imports: [
    TranslocoPipe,
    AdminPageComponent,
    AdminPageHeaderComponent,
    AdminSectionCardComponent,
    OrdersKpiStripComponent,
    OrdersFiltersComponent,
    OrdersListTableComponent,
    OrderDetailDrawerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <admin-page>
      <!-- Header -->
      <admin-page-header
        [title]="'admin.orders.title' | transloco"
        [subtitle]="'admin.orders.subtitle' | transloco"
      >
        <button slot="actions" type="button" class="admin-orders__refresh-btn" (click)="reload()">
          <span class="material-symbols-outlined" [class.spinning]="store.isLoading()">refresh</span>
          {{ 'admin.orders.refresh' | transloco }}
        </button>
      </admin-page-header>

      <!-- KPI strip -->
      <app-orders-kpi-strip [kpis]="store.kpis()"></app-orders-kpi-strip>

      <!-- Table card -->
      <admin-section-card>
        <app-orders-filters
          [filter]="store.filter()"
          [hasActiveFilters]="store.hasActiveFilters()"
          (filterChange)="onFilterChange($event)"
          (clearAll)="onClearFilters()"
        ></app-orders-filters>

        <div class="admin-orders__table-wrap">
          <app-orders-list-table
            [items]="store.pagedItems()"
            [isLoading]="store.isLoading()"
            [hasError]="store.hasError()"
            [errorMessage]="store.errorMessage() || ''"
            [emptyMessage]="emptyMessage()"
            [customerRequestCounts]="store.customerRequestCounts()"
            [page]="store.page()"
            [pageSize]="store.pageSize()"
            [totalPages]="store.totalPages()"
            [totalFilteredCount]="store.totalFilteredCount()"
            (rowClick)="openDrawer($event)"
            (retry)="store.reload()"
            (pageChange)="store.setPage($event)"
            (pageSizeChange)="store.setPageSize($event)"
          ></app-orders-list-table>
        </div>
      </admin-section-card>
    </admin-page>

    <!-- Detail drawer -->
    <app-order-detail-drawer
      [order]="selectedOrder()"
      [open]="drawerOpen()"
      [customerRequestCounts]="store.customerRequestCounts()"
      (closed)="onDrawerClosed()"
      (filterByPhone)="filterByPhone($event)"
    ></app-order-detail-drawer>
  `,
  styles: [
    `
      :host { display: block; }

      .admin-orders__refresh-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        background: transparent;
        border: 1px solid var(--color-border, #e2e8f0);
        color: var(--color-text-secondary, #64748b);
        padding: 0.5rem 0.875rem;
        border-radius: 0.625rem;
        font-weight: 600;
        font-size: 0.875rem;
        cursor: pointer;
        min-height: 44px;
        transition: background 0.15s ease, color 0.15s ease;
      }
      .admin-orders__refresh-btn:hover {
        background: var(--color-surface-subtle, #f1f5f9);
        color: var(--color-text-primary, #0f172a);
      }
      .admin-orders__refresh-btn .material-symbols-outlined { font-size: 1.125rem; }
      .spinning { animation: spin 1s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }
      @media (prefers-reduced-motion: reduce) { .spinning { animation: none; } }

      .admin-orders__table-wrap { margin-top: 1rem; }
    `,
  ],
})
export class AdminOrdersPageComponent implements OnInit {
  protected readonly store = inject(AdminOrdersStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly transloco = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);

  readonly selectedOrderId = signal<string | null>(null);
  readonly selectedOrder = computed(() => {
    const id = this.selectedOrderId();
    if (!id) return null;
    return this.store.all().find((o) => o.id === id) ?? null;
  });
  readonly drawerOpen = signal(false);

  private isApplyingFromUrl = false;

  constructor() {
    effect(() => {
      const filter = this.store.filter();
      if (this.isApplyingFromUrl) return;
      const queryParams = serializeOrdersFilterState(filter);
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams,
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    });
  }

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const next = parseOrdersFilterState(params);
        const current = this.store.filter();
        if (this.filterEquals(current, next)) return;
        this.isApplyingFromUrl = true;
        this.store.replaceFilter(next);
        queueMicrotask(() => (this.isApplyingFromUrl = false));
      });

    this.store.ensureLoaded();
  }

  emptyMessage(): string {
    return this.store.hasActiveFilters()
      ? this.transloco.translate('admin.orders.list.empty_filtered')
      : this.transloco.translate('admin.orders.list.empty');
  }

  onFilterChange(patch: Partial<OrdersFilterState>): void {
    this.store.setFilter((prev) => ({ ...prev, ...patch }));
  }

  onClearFilters(): void {
    this.store.clearFilters();
  }

  openDrawer(order: OrderRequestListItem): void {
    this.selectedOrderId.set(order.id);
    this.drawerOpen.set(true);
  }

  onDrawerClosed(): void {
    this.drawerOpen.set(false);
    this.selectedOrderId.set(null);
  }

  reload(): void {
    this.store.reload();
  }

  filterByPhone(phone: string): void {
    this.onDrawerClosed();
    this.store.setFilter((prev) => ({ ...prev, search: phone }));
  }

  private filterEquals(a: OrdersFilterState, b: OrdersFilterState): boolean {
    return a.search === b.search && a.status === b.status && a.range === b.range;
  }
}
