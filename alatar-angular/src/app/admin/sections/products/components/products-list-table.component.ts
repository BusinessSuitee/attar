import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  Output,
  TemplateRef,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { ProductListItem, ProductStatus } from '../../../../core/products/product.service';
import { LocalizedTextPipe } from '../../../../core/i18n/localized-text.pipe';
import {
  AdminDataTableColumn,
  AdminDataTableComponent,
} from '../../../shared/ui/data-table.component';
import { ImageWithFallbackComponent } from '../../../../shared/ui/image-with-fallback.component';

@Component({
  selector: 'app-products-list-table',
  standalone: true,
  imports: [
    CommonModule,
    DecimalPipe,
    TranslocoPipe,
    LocalizedTextPipe,
    AdminDataTableComponent,
    ImageWithFallbackComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Desktop / tablet: data table (≥768px) -->
    <div class="products-table-view">
      <admin-data-table
        [items]="items"
        [columns]="columns"
        [isLoading]="isLoading"
        [hasError]="hasError"
        [errorMessage]="errorMessage"
        [emptyMessage]="emptyMessage"
        [retryLabel]="'common.retry' | transloco"
        [trackBy]="trackById"
        [rowClickable]="true"
        (rowClick)="rowClick.emit($event)"
        (retry)="retry.emit()"
      ></admin-data-table>
    </div>

    <!-- Mobile: card list (≤767px) -->
    <div class="products-cards-view">
      @if (isLoading && items.length === 0) {
        <div class="products-card-list__skeleton" role="status" aria-busy="true">
          @for (i of [0,1,2,3,4]; track i) {
            <div class="products-card-list__skeleton-row"></div>
          }
        </div>
      } @else if (hasError) {
        <div class="products-card-list__error" role="alert">
          <span>{{ errorMessage || ('common.error.generic' | transloco) }}</span>
          <button type="button" class="products-card-list__retry" (click)="retry.emit()">
            {{ 'common.retry' | transloco }}
          </button>
        </div>
      } @else if (items.length === 0) {
        <div class="products-card-list__empty">
          <p>{{ emptyMessage || ('common.noResults' | transloco) }}</p>
        </div>
      } @else {
        <div role="list">
          @for (row of items; track trackById(row)) {
            <button type="button" class="products-card" role="listitem" (click)="rowClick.emit(row)">
              <span class="products-card__thumb">
                <ui-image
                  [src]="firstImage(row)"
                  [alt]="displayName(row)"
                  aspectRatio="1 / 1"
                  radius="0.5rem"
                ></ui-image>
              </span>
              <span class="products-card__body">
                <span class="products-card__top">
                  <strong class="products-card__name">{{ { en: row.name, ar: row.nameAr } | localizedText }}</strong>
                  <span class="products-table__status" [attr.data-status]="row.status">
                    {{ 'admin.products.statuses.' + statusKey(row.status) | transloco }}
                  </span>
                </span>
                <small class="products-card__sku">{{ row.sku }}</small>
                <span class="products-card__badges">
                  <span class="products-card__badge">{{ 'admin.products.types.' + row.productType.toLowerCase() | transloco }}</span>
                  <span class="products-card__badge">{{ 'admin.products.states.' + row.productState.toLowerCase() | transloco }}</span>
                  <span class="products-card__badge">{{ 'admin.products.seasons.' + seasonKey(row.season) | transloco }}</span>
                </span>
                <span class="products-card__footer">
                  <span class="products-card__price">{{ row.price | number: '1.2-2' }}</span>
                  <span class="products-card__stock">{{ row.stockQuantity | number: '1.0-0' }}</span>
                </span>
              </span>
            </button>
          }
        </div>
      }
    </div>

    <ng-template #thumbCell let-row>
      <span class="products-table__thumb-wrap">
        <ui-image
          [src]="firstImage(row)"
          [alt]="displayName(row)"
          aspectRatio="1 / 1"
          radius="0.5rem"
        ></ui-image>
      </span>
    </ng-template>

    <ng-template #nameCell let-row>
      <div class="products-table__name">
        <strong>{{ { en: row.name, ar: row.nameAr } | localizedText }}</strong>
        <small>{{ row.sku }}</small>
      </div>
    </ng-template>

    <ng-template #statusCell let-row>
      <span class="products-table__status" [attr.data-status]="row.status">
        {{ 'admin.products.statuses.' + statusKey(row.status) | transloco }}
      </span>
    </ng-template>

    <ng-template #typeCell let-row>
      {{ 'admin.products.types.' + row.productType.toLowerCase() | transloco }}
    </ng-template>

    <ng-template #stateCell let-row>
      {{ 'admin.products.states.' + row.productState.toLowerCase() | transloco }}
    </ng-template>

    <ng-template #seasonCell let-row>
      {{ 'admin.products.seasons.' + seasonKey(row.season) | transloco }}
    </ng-template>

    <ng-template #stockCell let-row>
      <span class="products-table__numeric">{{ row.stockQuantity | number: '1.0-0' }}</span>
    </ng-template>

    <ng-template #priceCell let-row>
      <span class="products-table__numeric">{{ row.price | number: '1.2-2' }}</span>
    </ng-template>

    <ng-template #actionsCell let-row>
      <div class="products-table__actions" (click)="$event.stopPropagation()">
        <select
          class="products-table__status-select"
          [value]="row.status"
          [attr.aria-label]="'admin.products.list.status_change_label' | transloco"
          (change)="statusChange.emit({ productId: row.id, status: $any($event.target).value })"
        >
          <option value="Valid">{{ 'admin.products.statuses.valid' | transloco }}</option>
          <option value="ComingSoon">{{ 'admin.products.statuses.coming_soon' | transloco }}</option>
          <option value="Invalid">{{ 'admin.products.statuses.invalid' | transloco }}</option>
        </select>
        <button
          type="button"
          class="products-table__delete-btn"
          [disabled]="deletingIds.has(row.id)"
          [attr.aria-label]="'admin.products.list.delete_label' | transloco"
          (click)="deleteRequest.emit(row)"
        >
          @if (deletingIds.has(row.id)) {
            <span class="material-symbols-outlined products-table__action-spin">progress_activity</span>
          } @else {
            <span class="material-symbols-outlined">delete</span>
          }
        </button>
      </div>
    </ng-template>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      /* show/hide by breakpoint */
      .products-table-view { display: block; }
      .products-cards-view { display: none; }
      @media (max-width: 767px) {
        .products-table-view { display: none; }
        .products-cards-view { display: block; }
      }

      /* ── shared table pieces ─────────────────── */
      .products-table__thumb-wrap {
        display: inline-block;
        width: 44px;
        height: 44px;
      }
      .products-table__name {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }
      .products-table__name strong {
        font-weight: 700;
        font-size: 0.875rem;
        color: var(--color-text-primary, #0f172a);
      }
      .products-table__name small {
        font-size: 0.75rem;
        color: var(--color-text-tertiary, #94a3b8);
        font-family: ui-monospace, SFMono-Regular, monospace;
      }
      .products-table__status {
        display: inline-flex;
        align-items: center;
        padding: 0.25rem 0.625rem;
        border-radius: 9999px;
        font-size: 0.6875rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        white-space: nowrap;          /* P2-F: prevent "Coming Soon" wrap */
        flex-shrink: 0;
      }
      .products-table__status[data-status='Valid'] {
        background: #dcfce7;
        color: #15803d;
      }
      .products-table__status[data-status='ComingSoon'] {
        background: #fef3c7;
        color: #92400e;
      }
      .products-table__status[data-status='Invalid'] {
        background: #fee2e2;
        color: #991b1b;
      }
      .products-table__numeric {
        font-variant-numeric: tabular-nums;
        text-align: end;
        display: inline-block;
      }

      /* ── mobile card list ────────────────────── */
      .products-card {
        display: flex;
        align-items: flex-start;
        gap: 0.875rem;
        width: 100%;
        padding: 0.875rem 1rem;
        background: var(--color-surface-card, #ffffff);
        border: none;
        border-bottom: 1px solid var(--color-border, #e2e8f0);
        text-align: start;
        cursor: pointer;
        min-height: 72px;
        transition: background 0.1s ease;
      }
      .products-card:last-child {
        border-bottom: none;
      }
      .products-card:active {
        background: var(--color-surface-subtle, #f8fafc);
      }
      .products-card__thumb {
        display: block;
        width: 48px;
        height: 48px;
        flex-shrink: 0;
        border-radius: 0.5rem;
        overflow: hidden;
      }
      .products-card__body {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .products-card__top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 0.5rem;
      }
      .products-card__name {
        font-size: 0.875rem;
        font-weight: 700;
        color: var(--color-text-primary, #0f172a);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex: 1;
        min-width: 0;
      }
      .products-card__sku {
        font-size: 0.6875rem;
        color: var(--color-text-tertiary, #94a3b8);
        font-family: ui-monospace, SFMono-Regular, monospace;
      }
      .products-card__badges {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;
        margin-top: 0.125rem;
      }
      .products-card__badge {
        font-size: 0.6875rem;
        font-weight: 500;
        padding: 0.125rem 0.5rem;
        border-radius: 9999px;
        background: var(--color-surface-subtle, #f1f5f9);
        color: var(--color-text-secondary, #64748b);
        white-space: nowrap;
      }
      .products-card__footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 0.25rem;
      }
      .products-card__price {
        font-size: 0.9375rem;
        font-weight: 700;
        color: var(--color-text-primary, #0f172a);
        font-variant-numeric: tabular-nums;
      }
      .products-card__stock {
        font-size: 0.75rem;
        color: var(--color-text-secondary, #64748b);
        font-variant-numeric: tabular-nums;
      }

      /* ── actions cell ─────────────────────── */
      .products-table__actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .products-table__status-select {
        min-height: 36px;
        padding: 0 0.5rem;
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: 0.5rem;
        background: #ffffff;
        color: var(--color-text-primary, #0f172a);
        font-size: 0.8125rem;
        font-weight: 500;
        cursor: pointer;
        max-width: 140px;
      }
      .products-table__status-select:focus {
        outline: none;
        border-color: #0fbd66;
        box-shadow: 0 0 0 2px rgba(15, 189, 102, 0.15);
      }
      .products-table__delete-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border: 1px solid #fecaca;
        border-radius: 0.5rem;
        background: #fff1f2;
        color: #dc2626;
        cursor: pointer;
        flex-shrink: 0;
        transition: background-color 150ms ease;
      }
      .products-table__delete-btn:hover:not(:disabled) {
        background: #fee2e2;
      }
      .products-table__delete-btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }
      .products-table__delete-btn .material-symbols-outlined {
        font-size: 1.125rem;
      }
      .products-table__action-spin {
        animation: action-spin 0.9s linear infinite;
        display: inline-block;
      }
      @keyframes action-spin {
        to { transform: rotate(360deg); }
      }

      /* card list skeleton / error / empty */
      .products-card-list__skeleton {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 0.5rem;
      }
      .products-card-list__skeleton-row {
        height: 72px;
        border-radius: 0.75rem;
        background: var(--color-surface-subtle, #f1f5f9);
      }
      @media (prefers-reduced-motion: no-preference) {
        .products-card-list__skeleton-row {
          animation: card-list-pulse 1.5s ease-in-out infinite;
        }
      }
      @keyframes card-list-pulse {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }
      .products-card-list__error {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 1rem 1.25rem;
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 0.75rem;
        color: #7f1d1d;
        font-size: 0.875rem;
        margin: 0.5rem;
      }
      .products-card-list__retry {
        background: transparent;
        border: 1px solid currentColor;
        color: inherit;
        padding: 0.5rem 0.875rem;
        border-radius: 0.5rem;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.8125rem;
        min-height: 44px;
        white-space: nowrap;
      }
      .products-card-list__empty {
        text-align: center;
        padding: 3rem 1.5rem;
        color: var(--color-text-secondary, #64748b);
        font-size: 0.875rem;
      }
    `,
  ],
})
export class ProductsListTableComponent implements AfterViewInit {
  private readonly transloco = inject(TranslocoService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('thumbCell', { static: true }) private thumbCell!: TemplateRef<{ $implicit: ProductListItem }>;
  @ViewChild('nameCell', { static: true }) private nameCell!: TemplateRef<{ $implicit: ProductListItem }>;
  @ViewChild('statusCell', { static: true }) private statusCell!: TemplateRef<{ $implicit: ProductListItem }>;
  @ViewChild('typeCell', { static: true }) private typeCell!: TemplateRef<{ $implicit: ProductListItem }>;
  @ViewChild('stateCell', { static: true }) private stateCell!: TemplateRef<{ $implicit: ProductListItem }>;
  @ViewChild('seasonCell', { static: true }) private seasonCell!: TemplateRef<{ $implicit: ProductListItem }>;
  @ViewChild('stockCell', { static: true }) private stockCell!: TemplateRef<{ $implicit: ProductListItem }>;
  @ViewChild('priceCell', { static: true }) private priceCell!: TemplateRef<{ $implicit: ProductListItem }>;
  @ViewChild('actionsCell', { static: true }) private actionsCell!: TemplateRef<{ $implicit: ProductListItem }>;

  @Input() items: ProductListItem[] = [];
  @Input() isLoading = false;
  @Input() hasError = false;
  @Input() errorMessage = '';
  @Input() emptyMessage = '';

  @Input() deletingIds: ReadonlySet<string> = new Set();

  @Output() readonly rowClick = new EventEmitter<ProductListItem>();
  @Output() readonly retry = new EventEmitter<void>();
  @Output() readonly statusChange = new EventEmitter<{ productId: string; status: ProductStatus }>();
  @Output() readonly deleteRequest = new EventEmitter<ProductListItem>();

  columns: AdminDataTableColumn<ProductListItem>[] = [];

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
      { key: 'thumb', headerKey: '', cell: this.thumbCell, widthClass: '' },
      {
        key: 'name',
        headerKey: this.transloco.translate('admin.products.list.col_name'),
        cell: this.nameCell,
      },
      {
        key: 'status',
        headerKey: this.transloco.translate('admin.products.list.col_status'),
        cell: this.statusCell,
      },
      {
        key: 'type',
        headerKey: this.transloco.translate('admin.products.list.col_type'),
        cell: this.typeCell,
      },
      {
        key: 'state',
        headerKey: this.transloco.translate('admin.products.list.col_state'),
        cell: this.stateCell,
      },
      {
        key: 'season',
        headerKey: this.transloco.translate('admin.products.list.col_season'),
        cell: this.seasonCell,
      },
      {
        key: 'stock',
        headerKey: this.transloco.translate('admin.products.list.col_stock'),
        cell: this.stockCell,
        align: 'end',
      },
      {
        key: 'price',
        headerKey: this.transloco.translate('admin.products.list.col_price'),
        cell: this.priceCell,
        align: 'end',
      },
      {
        key: 'actions',
        headerKey: this.transloco.translate('admin.products.list.col_actions'),
        cell: this.actionsCell,
        align: 'end',
      },
    ];
    this.cdr.markForCheck();
  }

  trackById = (row: ProductListItem): string => row.id;

  displayName(row: ProductListItem): string {
    return (row.nameAr || row.name || '').trim();
  }

  firstImage(row: ProductListItem): string | null {
    if (row.images && row.images.length > 0) return row.images[0]?.url ?? null;
    if (row.imageUrls && row.imageUrls.length > 0) return row.imageUrls[0] ?? null;
    return null;
  }

  statusKey(status: ProductStatus): string {
    return status === 'ComingSoon' ? 'coming_soon' : status.toLowerCase();
  }

  seasonKey(season: string): string {
    return season === 'AllYear' ? 'all_year' : season.toLowerCase();
  }
}
