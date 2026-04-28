import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  PLATFORM_ID,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-season-chart',
  standalone: true,
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="chart" aria-labelledby="season-chart-title">
      <h3 id="season-chart-title" class="chart__title">
        {{ 'products_v2.detail.availability_title' | transloco }}
      </h3>
      <div class="chart__row" role="list">
        @for (month of months; track month) {
          <div
            class="chart__cell"
            role="listitem"
            [class.chart__cell--available]="isAvailable(month)"
            [class.chart__cell--current]="month === currentMonth()"
            [style.--chart-accent]="accentColor"
            [attr.aria-label]="(monthKey(month) | transloco) + (isAvailable(month) ? ' ✓' : '')"
          >
            <span class="chart__month-label">
              {{ monthKey(month) | transloco }}
            </span>
          </div>
        }
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .chart {
        padding: 1.25rem 0;
      }
      .chart__title {
        margin: 0 0 0.875rem;
        font-size: 1rem;
        font-weight: 700;
        color: #0f172a;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .chart__row {
        display: grid;
        grid-template-columns: repeat(12, 1fr);
        gap: 0.25rem;
        direction: ltr;
      }
      .chart__cell {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 40px;
        background-color: #f1f5f9;
        border-radius: 0.375rem;
        font-size: 0.6875rem;
        font-weight: 700;
        color: rgba(15, 23, 42, 0.55);
        text-transform: uppercase;
        transition: background-color 200ms ease;
      }
      @media (min-width: 768px) {
        .chart__cell {
          min-height: 48px;
          font-size: 0.75rem;
        }
      }
      .chart__cell--available {
        background-color: var(--chart-accent, #0fbd66);
        color: #ffffff;
        opacity: 0.85;
      }
      .chart__cell--current {
        outline: 2px solid var(--chart-accent, #0fbd66);
        outline-offset: -2px;
        opacity: 1;
      }
      .chart__cell--current:not(.chart__cell--available) {
        background-color: rgba(15, 23, 42, 0.05);
      }
      .chart__month-label {
        pointer-events: none;
      }
    `,
  ],
})
export class SeasonChartComponent {
  private readonly platformId = inject(PLATFORM_ID);

  @Input({ required: true }) availableMonths: number[] = [];
  @Input({ required: true }) accentColor = '#0fbd66';

  readonly months: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  readonly currentMonth = signal<number | null>(null);

  constructor() {
    afterNextRender(() => {
      if (isPlatformBrowser(this.platformId)) {
        this.currentMonth.set(new Date().getMonth() + 1);
      }
    });
  }

  isAvailable(month: number): boolean {
    return this.availableMonths.includes(month);
  }

  monthKey(month: number): string {
    return `products_v2.seasons.month_${month}`;
  }
}
