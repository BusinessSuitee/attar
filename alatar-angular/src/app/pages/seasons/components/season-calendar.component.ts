import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  PLATFORM_ID,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import { PublicProductCard } from '../../products/public-catalog.store';
import { SeasonCellSelection } from './season-cell-popover.component';

export interface SeasonCalendarRow {
  product: PublicProductCard;
  availableMonths: number[];
}

@Component({
  selector: 'app-season-calendar',
  standalone: true,
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="calendar-wrapper">
      <div class="grid-table">
        <div class="grid-table__header-row">
          <div class="grid-table__header-cell grid-table__header-cell--first">
            {{ 'products_page.filters.product_variety' | transloco : { defaultValue: 'Product / Variety' } }}
          </div>
          @for (month of months; track month) {
            <div class="grid-table__header-cell">
              {{ monthKey(month) | transloco }}
            </div>
          }
        </div>

        @for (row of rows; track row.product.id) {
          <div class="grid-table__row">
            <div class="grid-table__product-cell">
              {{ primaryName(row.product) }}
            </div>
            @for (month of months; track month) {
              <div
                class="grid-table__month-cell"
                [class.grid-table__month-cell--active]="row.availableMonths.includes(month)"
                (click)="row.availableMonths.includes(month) && onCellClick(row.product, month, $event)"
                [style.cursor]="row.availableMonths.includes(month) ? 'pointer' : 'default'"
              >
                @if (row.availableMonths.includes(month)) {
                  <div class="grid-table__pill" [style.--pill-color]="row.product.accentColor"></div>
                }
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .calendar-wrapper {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        padding: 1rem 0 2rem;
      }

      @media (min-width: 768px) {
        .calendar-wrapper {
          padding: 1rem 1.5rem 2rem;
        }
      }

      .grid-table {
        display: flex;
        flex-direction: column;
        border: 1px solid #e5e7eb;
        background: #ffffff;
        border-radius: 4px;
        min-width: 900px; /* Forces horizontal scroll on mobile */
      }
      .grid-table__header-row {
        display: grid;
        grid-template-columns: 200px repeat(12, 1fr);
        background-color: #17342b;
        color: #ffffff;
        position: sticky;
        top: 72px; /* Sticky below navbar */
        z-index: 10;
      }
      .grid-table__header-cell {
        padding: 1rem 0;
        text-align: center;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .grid-table__header-cell--first {
        padding: 1rem 1.5rem;
        justify-content: flex-start;
      }
      .grid-table__row {
        display: grid;
        grid-template-columns: 200px repeat(12, 1fr);
        border-bottom: 1px solid #e5e7eb;
      }
      .grid-table__row:last-child {
        border-bottom: none;
      }
      .grid-table__product-cell {
        padding: 1rem 1.5rem;
        font-size: 0.875rem;
        font-weight: 600;
        color: #1f2937;
        background-color: #fafafa;
        display: flex;
        align-items: center;
      }
      .grid-table__month-cell {
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #ffffff;
        padding: 0 4px; /* Creates the gap between pills */
      }
      .grid-table__month-cell--active {
        background-color: #fbf8ee;
      }
      .grid-table__pill {
        width: 100%;
        height: 12px;
        border-radius: 9999px;
        background-color: var(--pill-color, #d4b56a);
        transition: transform 0.2s;
      }
      .grid-table__month-cell:hover .grid-table__pill {
        transform: scaleY(1.2);
      }

      @media (prefers-reduced-motion: reduce) {
        .grid__cell, .grid-table__pill {
          transition: none !important;
        }
      }
    `,
  ],
})
export class SeasonCalendarComponent {
  private readonly transloco = inject(TranslocoService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  @Input({ required: true }) rows: SeasonCalendarRow[] = [];
  @Output() readonly cellClicked = new EventEmitter<SeasonCellSelection>();

  readonly months: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  readonly currentMonth = signal<number | null>(null);

  constructor() {
    afterNextRender(() => {
      if (isPlatformBrowser(this.platformId)) {
        this.currentMonth.set(new Date().getMonth() + 1);
      }
    });
  }

  monthKey(month: number): string {
    return `products_v2.seasons.month_${month}`;
  }

  onCellClick(product: PublicProductCard, monthIndex: number, event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement;
    const anchorRect = target.getBoundingClientRect();
    this.cellClicked.emit({ product, monthIndex, anchorRect });
  }

  primaryName(product: PublicProductCard): string {
    return product.name || product.nameAr;
  }

  secondaryName(product: PublicProductCard): string | null {
    return null;
  }

  productsForMonth(month: number): PublicProductCard[] {
    return this.rows
      .filter((r) => r.availableMonths.includes(month))
      .map((r) => r.product);
  }

  resolveUrl(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${this.apiBaseUrl}/${url.replace(/^\//, '')}`;
  }

  private isArabic(): boolean {
    return (this.transloco.getActiveLang() || 'ar').toLowerCase().startsWith('ar');
  }

  isSingleMonth(availableMonths: number[], month: number): boolean {
    if (!availableMonths.includes(month)) return false;
    const prev = month === 1 ? 12 : month - 1;
    const next = month === 12 ? 1 : month + 1;
    return !availableMonths.includes(prev) && !availableMonths.includes(next);
  }

  isStartMonth(availableMonths: number[], month: number): boolean {
    if (!availableMonths.includes(month)) return false;
    const prev = month === 1 ? 12 : month - 1;
    const next = month === 12 ? 1 : month + 1;
    return !availableMonths.includes(prev) && availableMonths.includes(next);
  }

  isEndMonth(availableMonths: number[], month: number): boolean {
    if (!availableMonths.includes(month)) return false;
    const prev = month === 1 ? 12 : month - 1;
    const next = month === 12 ? 1 : month + 1;
    return availableMonths.includes(prev) && !availableMonths.includes(next);
  }

  isMiddleMonth(availableMonths: number[], month: number): boolean {
    if (!availableMonths.includes(month)) return false;
    const prev = month === 1 ? 12 : month - 1;
    const next = month === 12 ? 1 : month + 1;
    return availableMonths.includes(prev) && availableMonths.includes(next);
  }
}
