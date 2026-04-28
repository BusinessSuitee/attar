import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  TemplateRef,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

export interface AdminDataTableColumn<TRow> {
  key: string;
  headerKey: string;
  cell: TemplateRef<{ $implicit: TRow }>;
  widthClass?: string;
  align?: 'start' | 'end' | 'center';
}

@Component({
  selector: 'admin-data-table',
  standalone: true,
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isLoading && items.length === 0) {
      <div class="admin-data-table__skeleton-grid" role="status" aria-busy="true">
        @for (i of skeletonRows; track i) {
          <div class="admin-data-table__skeleton-row"></div>
        }
      </div>
    } @else if (hasError) {
      <div class="admin-data-table__error" role="alert">
        <span class="admin-data-table__error-message">{{ errorMessage || 'Could not load data.' }}</span>
        @if (showRetry) {
          <button type="button" class="admin-data-table__retry" (click)="retry.emit()">
            {{ retryLabel }}
          </button>
        }
      </div>
    } @else if (items.length === 0) {
      <div class="admin-data-table__empty">
        <p>{{ emptyMessage || 'No data to show.' }}</p>
        <ng-content select="[slot=empty-action]"></ng-content>
      </div>
    } @else {
      <div class="admin-data-table__scroll">
        <table class="admin-data-table">
          <thead>
            <tr>
              @for (column of columns; track column.key) {
                <th
                  scope="col"
                  [class]="column.widthClass || ''"
                  [style.text-align]="column.align || 'start'"
                >
                  {{ column.headerKey }}
                </th>
              }
            </tr>
          </thead>
          <tbody>
            @for (row of items; track trackByFn(row); let idx = $index) {
              <tr
                [class.admin-data-table__row--clickable]="rowClickable"
                (click)="onRowClick(row)"
              >
                @for (column of columns; track column.key) {
                  <td [style.text-align]="column.align || 'start'">
                    <ng-container
                      *ngTemplateOutlet="column.cell; context: { $implicit: row }"
                    ></ng-container>
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .admin-data-table__scroll {
        overflow-x: auto;
      }
      .admin-data-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.875rem;
      }
      .admin-data-table thead th {
        text-align: start;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--color-text-secondary, #64748b);
        padding: 0.75rem 1rem;
        border-bottom: 1px solid var(--color-border, #e2e8f0);
        background: var(--color-surface-subtle, #f8fafc);
      }
      .admin-data-table tbody td {
        padding: 0.75rem 1rem;
        border-bottom: 1px solid var(--color-border, #e2e8f0);
        color: var(--color-text-primary, #0f172a);
        vertical-align: middle;
      }
      .admin-data-table tbody tr:last-child td {
        border-bottom: none;
      }
      .admin-data-table__row--clickable {
        cursor: pointer;
        transition: background 0.1s ease;
      }
      .admin-data-table__row--clickable:hover {
        background: var(--color-surface-subtle, #f8fafc);
      }
      .admin-data-table__skeleton-grid {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 0.5rem;
      }
      .admin-data-table__skeleton-row {
        height: 2.75rem;
        border-radius: 0.5rem;
        background: var(--color-surface-subtle, #f1f5f9);
      }
      @media (prefers-reduced-motion: no-preference) {
        .admin-data-table__skeleton-row {
          animation: admin-data-table-pulse 1.5s ease-in-out infinite;
        }
      }
      @keyframes admin-data-table-pulse {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }
      .admin-data-table__error {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 1rem 1.5rem;
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 0.75rem;
        color: #7f1d1d;
        font-size: 0.875rem;
      }
      .admin-data-table__retry {
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
      .admin-data-table__empty {
        text-align: center;
        padding: 3rem 1.5rem;
        color: var(--color-text-secondary, #64748b);
        font-size: 0.875rem;
      }
      .admin-data-table__empty p {
        margin: 0 0 0.75rem;
      }
    `,
  ],
})
export class AdminDataTableComponent<TRow> {
  @Input() items: TRow[] = [];
  @Input() columns: AdminDataTableColumn<TRow>[] = [];
  @Input() isLoading = false;
  @Input() hasError = false;
  @Input() errorMessage = '';
  @Input() emptyMessage = '';
  @Input() retryLabel = 'Retry';
  @Input() showRetry = true;
  @Input() rowClickable = false;
  @Input() skeletonRowCount = 6;
  @Input() trackBy: (row: TRow) => unknown = (row) => row;

  @Output() readonly rowClick = new EventEmitter<TRow>();
  @Output() readonly retry = new EventEmitter<void>();

  get skeletonRows(): number[] {
    return Array.from({ length: this.skeletonRowCount }, (_, i) => i);
  }

  trackByFn = (row: TRow): unknown => this.trackBy(row);

  onRowClick(row: TRow): void {
    if (!this.rowClickable) return;
    this.rowClick.emit(row);
  }
}
