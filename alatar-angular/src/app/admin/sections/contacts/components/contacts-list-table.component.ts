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
  ContactListItem,
  ContactService,
} from '../../../../core/contacts/contact.service';
import {
  AdminDataTableComponent,
  AdminDataTableColumn,
} from '../../../shared/ui/data-table.component';
import {
  AdminStatusPillComponent,
  AdminStatusTone,
} from '../../../layout/admin-status-pill/admin-status-pill.component';
import { isExportContact } from '../contacts.store';

function statusTone(status: string): AdminStatusTone {
  switch (status) {
    case 'in_progress':
      return 'warning';
    case 'contacted':
      return 'info';
    case 'sale_confirmed':
      return 'success';
    default:
      return 'neutral';
  }
}

function statusIcon(status: string): string {
  switch (status) {
    case 'in_progress':
      return 'pending';
    case 'contacted':
      return 'call_made';
    case 'sale_confirmed':
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
  selector: 'app-contacts-list-table',
  standalone: true,
  imports: [TranslocoPipe, AdminDataTableComponent, AdminStatusPillComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Cell templates -->
    <ng-template #statusCell let-row>
      <admin-status-pill
        [label]="'admin.contacts.status.' + contactService.normalizeStatus(row.status) | transloco"
        [tone]="getTone(row.status)"
        [icon]="getIcon(row.status)"
      ></admin-status-pill>
    </ng-template>

    <ng-template #requesterCell let-row>
      <div class="contacts-table__requester">
        <span class="contacts-table__requester-name">{{ row.fullName }}</span>
        <span class="contacts-table__requester-phone">{{ row.phoneNumber }}</span>
        @if (isReturning(row.phoneNumber)) {
          <span class="contacts-table__returning-badge">
            <span class="material-symbols-outlined" style="font-size:0.75rem">repeat</span>
            {{ 'admin.contacts.list.returning' | transloco }}
          </span>
        }
      </div>
    </ng-template>

    <ng-template #companyCell let-row>
      <span class="contacts-table__company" [title]="displayValue(row.companyName)">
        {{ displayValue(row.companyName) }}
      </span>
    </ng-template>

    <ng-template #cropCell let-row>
      <div class="contacts-table__crop">
        <span class="contacts-table__crop-name">{{ displayValue(row.crop) }}</span>
        @if (row.country) {
          <span class="contacts-table__country">
            <span class="material-symbols-outlined" style="font-size:0.75rem">public</span>
            {{ row.country }}
          </span>
        }
      </div>
    </ng-template>

    <ng-template #qtyCell let-row>
      @if (row.quantityTons) {
        <span class="contacts-table__qty">
          <span class="contacts-table__qty-value">{{ formatQty(row.quantityTons) }}</span>
          <span class="contacts-table__qty-unit">{{ 'admin.contacts.list.unit_tons' | transloco }}</span>
        </span>
      } @else {
        <span class="contacts-table__muted">—</span>
      }
    </ng-template>

    <ng-template #serviceCell let-row>
      <span class="contacts-table__service" [attr.data-type]="serviceTypeKey(row)">
        <span class="material-symbols-outlined" style="font-size:0.875rem">
          {{ isExport(row) ? 'public' : 'storefront' }}
        </span>
        {{ 'admin.contacts.service_type.' + serviceTypeKey(row) | transloco }}
      </span>
    </ng-template>

    <ng-template #dateCell let-row>
      <span class="contacts-table__date" [title]="absoluteTime(row.createdAtUtc)">
        {{ relativeTime(row.createdAtUtc) }}
      </span>
    </ng-template>

    <ng-template #actionsCell let-row>
      <button
        type="button"
        class="contacts-table__open-btn"
        (click)="$event.stopPropagation(); rowClick.emit(row)"
        [attr.aria-label]="'admin.contacts.list.view_detail' | transloco"
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
      <div class="contacts-table__pagination">
        <div class="contacts-table__pagination-info">
          {{ rangeStart }}–{{ rangeEnd }}
          {{ 'admin.contacts.pagination.of' | transloco }}
          {{ totalFilteredCount }}
        </div>
        <div class="contacts-table__pagination-controls">
          <button
            type="button"
            class="contacts-table__page-btn"
            [disabled]="page <= 1"
            (click)="pageChange.emit(page - 1)"
            [attr.aria-label]="'admin.contacts.pagination.prev' | transloco"
          >
            <span class="material-symbols-outlined">chevron_left</span>
          </button>
          <span class="contacts-table__page-indicator">{{ page }} / {{ totalPages }}</span>
          <button
            type="button"
            class="contacts-table__page-btn"
            [disabled]="page >= totalPages"
            (click)="pageChange.emit(page + 1)"
            [attr.aria-label]="'admin.contacts.pagination.next' | transloco"
          >
            <span class="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
        <div class="contacts-table__page-size">
          <label class="contacts-table__page-size-label" for="contacts-page-size">
            {{ 'admin.contacts.pagination.per_page' | transloco }}
          </label>
          <select
            id="contacts-page-size"
            class="contacts-table__page-size-select"
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
      .contacts-table__requester {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
        white-space: nowrap;
      }
      .contacts-table__requester-name {
        font-weight: 600;
        color: var(--color-text-primary, #0f172a);
        font-size: 0.875rem;
        white-space: nowrap;
      }
      .contacts-table__requester-phone {
        font-size: 0.8125rem;
        color: var(--color-text-secondary, #64748b);
        white-space: nowrap;
      }
      .contacts-table__returning-badge {
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
      .contacts-table__company {
        font-size: 0.875rem;
        color: var(--color-text-primary, #0f172a);
        max-width: 180px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        display: block;
      }
      .contacts-table__crop {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }
      .contacts-table__crop-name {
        font-size: 0.875rem;
        color: var(--color-text-primary, #0f172a);
        font-weight: 500;
      }
      .contacts-table__country {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.75rem;
        color: var(--color-text-secondary, #64748b);
      }
      .contacts-table__qty {
        display: inline-flex;
        align-items: baseline;
        gap: 0.25rem;
      }
      .contacts-table__qty-value {
        font-size: 1.0625rem;
        font-weight: 700;
        color: var(--color-text-primary, #0f172a);
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }
      .contacts-table__qty-unit {
        font-size: 0.6875rem;
        font-weight: 600;
        color: var(--color-text-secondary, #64748b);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .contacts-table__muted {
        color: var(--color-text-tertiary, #94a3b8);
      }
      .contacts-table__service {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.25rem 0.625rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 600;
        background: var(--color-surface-subtle, #f1f5f9);
        color: var(--color-text-primary, #0f172a);
        border: 1px solid var(--color-border, #e2e8f0);
      }
      .contacts-table__service[data-type='export'] {
        background: #fef3c7;
        color: #b45309;
        border-color: #fde68a;
      }
      .contacts-table__service[data-type='local'] {
        background: #e0e7ff;
        color: #3730a3;
        border-color: #c7d2fe;
      }
      .contacts-table__date {
        font-size: 0.8125rem;
        color: var(--color-text-secondary, #64748b);
        white-space: nowrap;
      }
      .contacts-table__open-btn {
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
      .contacts-table__open-btn:hover {
        background: var(--color-surface-subtle, #f1f5f9);
        color: var(--color-text-primary, #0f172a);
      }
      .contacts-table__open-btn .material-symbols-outlined {
        font-size: 1.125rem;
      }
      /* Pagination */
      .contacts-table__pagination {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 0.75rem;
        padding: 0.875rem 1rem;
        border-top: 1px solid var(--color-border, #e2e8f0);
      }
      .contacts-table__pagination-info {
        font-size: 0.8125rem;
        color: var(--color-text-secondary, #64748b);
      }
      .contacts-table__pagination-controls {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .contacts-table__page-btn {
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
      .contacts-table__page-btn:hover:not(:disabled) {
        background: var(--color-surface-subtle, #f1f5f9);
      }
      .contacts-table__page-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .contacts-table__page-btn .material-symbols-outlined {
        font-size: 1.25rem;
      }
      .contacts-table__page-indicator {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--color-text-primary, #0f172a);
      }
      .contacts-table__page-size {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .contacts-table__page-size-label {
        font-size: 0.8125rem;
        color: var(--color-text-secondary, #64748b);
      }
      .contacts-table__page-size-select {
        height: 36px;
        padding: 0 0.5rem;
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: 0.5rem;
        background: #ffffff;
        font-size: 0.875rem;
        cursor: pointer;
      }
      @media (max-width: 767px) {
        .contacts-table__page-size {
          display: none;
        }
        .contacts-table__pagination {
          justify-content: center;
        }
      }
    `,
  ],
})
export class ContactsListTableComponent implements AfterViewInit {
  @ViewChild('statusCell', { static: true }) private statusCellTpl!: TemplateRef<{
    $implicit: ContactListItem;
  }>;
  @ViewChild('requesterCell', { static: true }) private requesterCellTpl!: TemplateRef<{
    $implicit: ContactListItem;
  }>;
  @ViewChild('companyCell', { static: true }) private companyCellTpl!: TemplateRef<{
    $implicit: ContactListItem;
  }>;
  @ViewChild('cropCell', { static: true }) private cropCellTpl!: TemplateRef<{
    $implicit: ContactListItem;
  }>;
  @ViewChild('qtyCell', { static: true }) private qtyCellTpl!: TemplateRef<{
    $implicit: ContactListItem;
  }>;
  @ViewChild('serviceCell', { static: true }) private serviceCellTpl!: TemplateRef<{
    $implicit: ContactListItem;
  }>;
  @ViewChild('dateCell', { static: true }) private dateCellTpl!: TemplateRef<{
    $implicit: ContactListItem;
  }>;
  @ViewChild('actionsCell', { static: true }) private actionsCellTpl!: TemplateRef<{
    $implicit: ContactListItem;
  }>;

  @Input() items: ContactListItem[] = [];
  @Input() isLoading = false;
  @Input() hasError = false;
  @Input() errorMessage = '';
  @Input() emptyMessage = '';
  @Input() customerRequestCounts: Map<string, number> = new Map();
  @Input() page = 1;
  @Input() pageSize = 20;
  @Input() totalPages = 1;
  @Input() totalFilteredCount = 0;

  @Output() readonly rowClick = new EventEmitter<ContactListItem>();
  @Output() readonly retry = new EventEmitter<void>();
  @Output() readonly pageChange = new EventEmitter<number>();
  @Output() readonly pageSizeChange = new EventEmitter<number>();

  columns: AdminDataTableColumn<ContactListItem>[] = [];

  readonly contactService = inject(ContactService);
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
        headerKey: this.transloco.translate('admin.contacts.list.col_status'),
        cell: this.statusCellTpl,
      },
      {
        key: 'requester',
        headerKey: this.transloco.translate('admin.contacts.list.col_requester'),
        cell: this.requesterCellTpl,
      },
      {
        key: 'company',
        headerKey: this.transloco.translate('admin.contacts.list.col_company'),
        cell: this.companyCellTpl,
      },
      {
        key: 'crop',
        headerKey: this.transloco.translate('admin.contacts.list.col_crop'),
        cell: this.cropCellTpl,
      },
      {
        key: 'quantity',
        headerKey: this.transloco.translate('admin.contacts.list.col_quantity'),
        cell: this.qtyCellTpl,
        align: 'end',
      },
      {
        key: 'service',
        headerKey: this.transloco.translate('admin.contacts.list.col_service'),
        cell: this.serviceCellTpl,
      },
      {
        key: 'date',
        headerKey: this.transloco.translate('admin.contacts.list.col_date'),
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

  readonly trackBy = (row: ContactListItem) => row.id;

  getTone(status: string): AdminStatusTone {
    return statusTone(this.contactService.normalizeStatus(status));
  }
  getIcon(status: string): string {
    return statusIcon(this.contactService.normalizeStatus(status));
  }
  isReturning(phone: string): boolean {
    return (this.customerRequestCounts.get((phone ?? '').trim()) ?? 0) > 1;
  }
  isExport(row: ContactListItem): boolean {
    return isExportContact(row);
  }
  serviceTypeKey(row: ContactListItem): 'export' | 'local' {
    return isExportContact(row) ? 'export' : 'local';
  }
  displayValue(value: string | null | undefined): string {
    return value && value.trim() !== '' ? value : '—';
  }

  readonly relativeTime = relativeTime;
  readonly absoluteTime = absoluteTime;

  formatQty(qty: number | null): string {
    if (qty === null || qty === undefined) return '';
    return Number.isInteger(qty) ? qty.toString() : qty.toFixed(2).replace(/\.?0+$/, '');
  }

  onPageSizeChange(event: Event): void {
    const size = Number((event.target as HTMLSelectElement).value);
    if (!isNaN(size) && size > 0) this.pageSizeChange.emit(size);
  }
}
