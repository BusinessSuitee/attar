import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  Output,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  OrderRequestListItem,
  OrderRequestService,
} from '../../../../core/orders/order-request.service';
import {
  AdminDataTableComponent,
  AdminDataTableColumn,
} from '../../../shared/ui/data-table.component';
import {
  AdminStatusPillComponent,
  AdminStatusTone,
} from '../../../layout/admin-status-pill/admin-status-pill.component';

function statusTone(status: string): AdminStatusTone {
  switch (status) {
    case 'new':
      return 'danger';
    case 'in_review':
      return 'warning';
    case 'contacted':
      return 'info';
    case 'confirmed':
      return 'success';
    default:
      return 'neutral';
  }
}

function statusIcon(status: string): string {
  switch (status) {
    case 'new':
      return 'fiber_new';
    case 'in_review':
      return 'pending';
    case 'contacted':
      return 'call_made';
    case 'confirmed':
      return 'check_circle';
    default:
      return 'check';
  }
}

function relativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoDate).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function absoluteTime(isoDate: string): string {
  return new Date(isoDate).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

@Component({
  selector: 'app-orders-list-table',
  standalone: true,
  imports: [TranslocoPipe, AdminDataTableComponent, AdminStatusPillComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Cell templates -->
    <ng-template #statusCell let-row>
      <admin-status-pill
        [label]="'admin.orders.status.' + orderService.normalizeStatus(row.status) | transloco"
        [tone]="getTone(row.status)"
        [icon]="getIcon(row.status)"
      ></admin-status-pill>
    </ng-template>

    <ng-template #requesterCell let-row>
      <div class="orders-table__requester">
        <span class="orders-table__requester-name">{{ row.requesterName }}</span>
        <span class="orders-table__requester-phone">{{ row.phoneNumber }}</span>
        @if (isReturning(row.phoneNumber)) {
          <span class="orders-table__returning-badge">
            <span class="material-symbols-outlined" style="font-size:0.75rem">repeat</span>
            {{ 'admin.orders.list.returning' | transloco }}
          </span>
        }
      </div>
    </ng-template>

    <ng-template #productCell let-row>
      <span class="orders-table__product-name" [title]="row.productNameSnapshot">
        {{ row.productNameSnapshot }}
      </span>
    </ng-template>

    <ng-template #quantityCell let-row>
      <span class="orders-table__qty">
        <span class="orders-table__qty-value">{{ formatQty(row.quantityTons) }}</span>
        <span class="orders-table__qty-unit">{{ 'admin.orders.list.unit_tons' | transloco }}</span>
      </span>
    </ng-template>

    <ng-template #dateCell let-row>
      <span class="orders-table__date" [title]="absoluteTime(row.createdAtUtc)">
        {{ relativeTime(row.createdAtUtc) }}
      </span>
    </ng-template>

    <ng-template #actionsCell let-row>
      <button
        type="button"
        class="orders-table__open-btn"
        (click)="$event.stopPropagation(); rowClick.emit(row)"
        [attr.aria-label]="'admin.orders.list.view_detail' | transloco"
      >
        <span class="material-symbols-outlined">open_in_new</span>
      </button>
    </ng-template>

    <!-- Table -->
    <admin-data-table
      [items]="items"
      [columns]="columns"
      [isLoading]="isLoading"
      [hasError]="hasError"
      [errorMessage]="errorMessage"
      [emptyMessage]="emptyMessage"
      [retryLabel]="'common.retry' | transloco"
      [rowClickable]="true"
      [skeletonRowCount]="8"
      [trackBy]="trackBy"
      (rowClick)="rowClick.emit($event)"
      (retry)="retry.emit()"
    ></admin-data-table>

    <!-- Pagination footer -->
    @if (!isLoading && !hasError && totalFilteredCount > pageSize) {
      <div class="orders-table__pagination">
        <div class="orders-table__pagination-info">
          {{ rangeStart }}–{{ rangeEnd }}
          {{ 'admin.orders.pagination.of' | transloco }}
          {{ totalFilteredCount }}
        </div>
        <div class="orders-table__pagination-controls">
          <button
            type="button"
            class="orders-table__page-btn"
            [disabled]="page <= 1"
            (click)="pageChange.emit(page - 1)"
            [attr.aria-label]="'admin.orders.pagination.prev' | transloco"
          >
            <span class="material-symbols-outlined">chevron_left</span>
          </button>
          <span class="orders-table__page-indicator">{{ page }} / {{ totalPages }}</span>
          <button
            type="button"
            class="orders-table__page-btn"
            [disabled]="page >= totalPages"
            (click)="pageChange.emit(page + 1)"
            [attr.aria-label]="'admin.orders.pagination.next' | transloco"
          >
            <span class="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
        <div class="orders-table__page-size">
          <label class="orders-table__page-size-label" for="orders-page-size">
            {{ 'admin.orders.pagination.per_page' | transloco }}
          </label>
          <select
            id="orders-page-size"
            class="orders-table__page-size-select"
            [value]="pageSize"
            (change)="onPageSizeChange($event)"
          >
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        overflow-x: auto;
        width: 100%;
      }
      .orders-table__requester {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
        white-space: nowrap;
      }
      .orders-table__requester-name {
        font-weight: 600;
        color: var(--color-text-primary, #0f172a);
        font-size: 0.875rem;
        white-space: nowrap;
      }
      .orders-table__requester-phone {
        font-size: 0.8125rem;
        color: var(--color-text-secondary, #64748b);
        white-space: nowrap;
      }
      .orders-table__returning-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.6875rem;
        font-weight: 700;
        color: #1d4ed8;
        background: #dbeafe;
        border-radius: 9999px;
        padding: 0.125rem 0.5rem;
        margin-top: 0.125rem;
        width: fit-content;
      }
      .orders-table__product-name {
        font-size: 0.875rem;
        color: var(--color-text-primary, #0f172a);
        max-width: 180px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        display: block;
      }
      .orders-table__qty {
        display: inline-flex;
        align-items: baseline;
        gap: 0.25rem;
      }
      .orders-table__qty-value {
        font-size: 1.0625rem;
        font-weight: 700;
        color: var(--color-text-primary, #0f172a);
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }
      .orders-table__qty-unit {
        font-size: 0.6875rem;
        font-weight: 600;
        color: var(--color-text-secondary, #64748b);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .orders-table__date {
        font-size: 0.8125rem;
        color: var(--color-text-secondary, #64748b);
        white-space: nowrap;
      }
      .orders-table__open-btn {
        background: transparent;
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: 0.5rem;
        color: var(--color-text-secondary, #64748b);
        cursor: pointer;
        min-height: 44px;
        min-width: 44px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition:
          background 0.15s ease,
          color 0.15s ease;
      }
      .orders-table__open-btn:hover {
        background: var(--color-surface-subtle, #f1f5f9);
        color: var(--color-text-primary, #0f172a);
      }
      .orders-table__open-btn .material-symbols-outlined {
        font-size: 1.125rem;
      }
      /* Pagination */
      .orders-table__pagination {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 0.75rem;
        padding: 0.875rem 1rem;
        border-top: 1px solid var(--color-border, #e2e8f0);
      }
      .orders-table__pagination-info {
        font-size: 0.8125rem;
        color: var(--color-text-secondary, #64748b);
      }
      .orders-table__pagination-controls {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .orders-table__page-btn {
        background: transparent;
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: 0.5rem;
        cursor: pointer;
        min-height: 44px;
        min-width: 44px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--color-text-primary, #0f172a);
        transition: background 0.15s ease;
      }
      .orders-table__page-btn:hover:not(:disabled) {
        background: var(--color-surface-subtle, #f1f5f9);
      }
      .orders-table__page-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .orders-table__page-btn .material-symbols-outlined {
        font-size: 1.25rem;
      }
      .orders-table__page-indicator {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--color-text-primary, #0f172a);
      }
      .orders-table__page-size {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .orders-table__page-size-label {
        font-size: 0.8125rem;
        color: var(--color-text-secondary, #64748b);
      }
      .orders-table__page-size-select {
        height: 36px;
        padding: 0 0.5rem;
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: 0.5rem;
        background: #ffffff;
        font-size: 0.875rem;
        cursor: pointer;
      }
      @media (max-width: 767px) {
        .orders-table__page-size {
          display: none;
        }
        .orders-table__pagination {
          justify-content: center;
        }
      }
    `,
  ],
})
export class OrdersListTableComponent implements AfterViewInit {
  @ViewChild('statusCell', { static: true }) private statusCellTpl!: TemplateRef<{
    $implicit: OrderRequestListItem;
  }>;
  @ViewChild('requesterCell', { static: true }) private requesterCellTpl!: TemplateRef<{
    $implicit: OrderRequestListItem;
  }>;
  @ViewChild('productCell', { static: true }) private productCellTpl!: TemplateRef<{
    $implicit: OrderRequestListItem;
  }>;
  @ViewChild('quantityCell', { static: true }) private quantityCellTpl!: TemplateRef<{
    $implicit: OrderRequestListItem;
  }>;
  @ViewChild('dateCell', { static: true }) private dateCellTpl!: TemplateRef<{
    $implicit: OrderRequestListItem;
  }>;
  @ViewChild('actionsCell', { static: true }) private actionsCellTpl!: TemplateRef<{
    $implicit: OrderRequestListItem;
  }>;

  @Input() items: OrderRequestListItem[] = [];
  @Input() isLoading = false;
  @Input() hasError = false;
  @Input() errorMessage = '';
  @Input() emptyMessage = '';
  @Input() customerRequestCounts: Map<string, number> = new Map();
  @Input() page = 1;
  @Input() pageSize = 20;
  @Input() totalPages = 1;
  @Input() totalFilteredCount = 0;

  @Output() readonly rowClick = new EventEmitter<OrderRequestListItem>();
  @Output() readonly retry = new EventEmitter<void>();
  @Output() readonly pageChange = new EventEmitter<number>();
  @Output() readonly pageSizeChange = new EventEmitter<number>();

  columns: AdminDataTableColumn<OrderRequestListItem>[] = [];

  readonly orderService = inject(OrderRequestService);
  private readonly transloco = inject(TranslocoService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  ngAfterViewInit(): void {
    this.buildColumns();
    this.transloco.langChanges$
      .pipe(
        switchMap((lang) => this.transloco.load(lang)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.buildColumns());
  }

  private buildColumns(): void {
    this.columns = [
      {
        key: 'status',
        headerKey: this.transloco.translate('admin.orders.list.col_status'),
        cell: this.statusCellTpl,
      },
      {
        key: 'requester',
        headerKey: this.transloco.translate('admin.orders.list.col_requester'),
        cell: this.requesterCellTpl,
      },
      {
        key: 'product',
        headerKey: this.transloco.translate('admin.orders.list.col_product'),
        cell: this.productCellTpl,
      },
      {
        key: 'quantity',
        headerKey: this.transloco.translate('admin.orders.list.col_quantity'),
        cell: this.quantityCellTpl,
        align: 'end',
      },
      {
        key: 'date',
        headerKey: this.transloco.translate('admin.orders.list.col_date'),
        cell: this.dateCellTpl,
      },
      { key: 'actions', headerKey: '', cell: this.actionsCellTpl, align: 'end' },
    ];
    this.cdr.markForCheck();
  }

  get rangeStart(): number {
    return (this.page - 1) * this.pageSize + 1;
  }
  get rangeEnd(): number {
    return Math.min(this.page * this.pageSize, this.totalFilteredCount);
  }

  readonly trackBy = (row: OrderRequestListItem) => row.id;

  getTone(status: string): AdminStatusTone {
    return statusTone(this.orderService.normalizeStatus(status));
  }
  getIcon(status: string): string {
    return statusIcon(this.orderService.normalizeStatus(status));
  }
  isReturning(phone: string): boolean {
    return (this.customerRequestCounts.get((phone ?? '').trim()) ?? 0) > 1;
  }

  readonly relativeTime = relativeTime;
  readonly absoluteTime = absoluteTime;

  formatQty(qty: number): string {
    return Number.isInteger(qty) ? qty.toString() : qty.toFixed(2).replace(/\.?0+$/, '');
  }

  onPageSizeChange(event: Event): void {
    const size = Number((event.target as HTMLSelectElement).value);
    if (!isNaN(size) && size > 0) this.pageSizeChange.emit(size);
  }
}
