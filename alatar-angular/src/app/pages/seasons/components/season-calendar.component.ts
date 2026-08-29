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
    <div class="calendar calendar--desktop">
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
              @if (secondaryName(row.product); as secondary) {
                — {{ secondary }}
              }
            </div>
            @for (month of months; track month) {
              <div
                class="grid-table__month-cell"
                [class.grid-table__month-cell--active]="row.availableMonths.includes(month)"
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

    <div class="calendar calendar--mobile">
      @for (month of months; track month) {
        @if (productsForMonth(month).length > 0) {
          <section
            class="month-section"
            [class.month-section--current]="month === currentMonth()"
          >
            <h3 class="month-section__title">
              {{ monthKey(month) | transloco }}
            </h3>
            <div class="month-section__strip" role="list">
              @for (product of productsForMonth(month); track product.id) {
                <button
                  type="button"
                  class="mobile-cell"
                  [style.--cell-accent]="product.accentColor"
                  role="listitem"
                  [attr.aria-label]="primaryName(product) + ' — ' + (monthKey(month) | transloco)"
                  (click)="onCellClick(product, month, $event)"
                >
                  @if (product.thumbnailUrl) {
                    <img
                      class="mobile-cell__thumb"
                      [src]="resolveUrl(product.thumbnailUrl)"
                      [alt]="primaryName(product)"
                      loading="lazy"
                    />
                  } @else {
                    <div class="mobile-cell__thumb mobile-cell__thumb--empty" aria-hidden="true"></div>
                  }
                  <span class="mobile-cell__name">{{ primaryName(product) }}</span>
                </button>
              }
            </div>
          </section>
        }
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .calendar {
        display: none;
      }
      @media (min-width: 768px) {
        .calendar--desktop {
          display: block;
          padding: 1rem 1.5rem 2rem;
        }
        .calendar--mobile {
          display: none;
        }
      }
      @media (max-width: 767px) {
        .calendar--mobile {
          display: block;
          padding: 0.5rem 1rem 2rem;
        }
      }

      .grid-table {
        display: flex;
        flex-direction: column;
        border: 1px solid #e5e7eb;
        background: #ffffff;
        border-radius: 4px;
        overflow: hidden;
      }
      .grid-table__header-row {
        display: grid;
        grid-template-columns: 240px repeat(12, 1fr);
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
        grid-template-columns: 240px repeat(12, 1fr);
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
        height: 6px;
        border-radius: 9999px;
        background-color: var(--pill-color, #d4b56a);
      }

      .month-section {
        margin-block: 1rem;
      }
      .month-section--current .month-section__title {
        color: #0fbd66;
      }
      .month-section__title {
        margin: 0 0 0.625rem;
        font-size: 0.875rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: rgba(15, 23, 42, 0.65);
      }
      .month-section__strip {
        display: flex;
        gap: 0.625rem;
        overflow-x: auto;
        scroll-snap-type: x mandatory;
        -webkit-overflow-scrolling: touch;
        padding-bottom: 0.5rem;
      }
      .mobile-cell {
        flex: 0 0 auto;
        width: 96px;
        min-height: 44px;
        background: #ffffff;
        border: 1px solid rgba(15, 23, 42, 0.08);
        border-inline-start: 4px solid var(--cell-accent, #0fbd66);
        border-radius: 0.625rem;
        padding: 0.5rem;
        cursor: pointer;
        scroll-snap-align: start;
        text-align: start;
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
      }
      .mobile-cell__thumb {
        width: 100%;
        aspect-ratio: 4 / 3;
        border-radius: 0.375rem;
        object-fit: cover;
        background-color: #f1f5f9;
      }
      .mobile-cell__thumb--empty {
        background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
      }
      .mobile-cell__name {
        font-size: 0.75rem;
        font-weight: 600;
        color: #0f172a;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .mobile-cell:focus-visible {
        outline: 2px solid #0fbd66;
        outline-offset: 2px;
      }
      @media (prefers-reduced-motion: reduce) {
        .grid__cell {
          transition: none;
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
    return this.isArabic() ? product.nameAr || product.name : product.name || product.nameAr;
  }

  secondaryName(product: PublicProductCard): string | null {
    if (this.isArabic()) {
      return product.name && product.name !== product.nameAr ? product.name : null;
    }
    return product.nameAr && product.nameAr !== product.name ? product.nameAr : null;
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
