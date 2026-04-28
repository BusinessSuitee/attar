import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import {
  CatalogAvailabilityKey,
  CatalogFilterState,
  CatalogSeasonKey,
} from '../public-catalog.store';

interface PillOption<T> {
  value: T;
  labelKey: string;
}

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="filter-bar-outer">
      <div class="filter-bar">
      <div class="filter-group">
        <span class="filter-group__label">
          {{ 'products_v2.catalog.filter_availability_all' | transloco }}
        </span>
        <div class="pill-row" role="group">
          @for (opt of availabilityOptions; track opt.value) {
            <button
              type="button"
              class="pill"
              [class.pill--active]="filter.availability === opt.value"
              [attr.aria-pressed]="filter.availability === opt.value"
              (click)="filterChange.emit({ availability: opt.value })"
            >
              {{ opt.labelKey | transloco }}
            </button>
          }
        </div>
      </div>
      <div class="filter-group">
        <span class="filter-group__label">
          {{ 'products_v2.catalog.filter_season_all' | transloco }}
        </span>
        <div class="pill-row" role="group">
          @for (opt of seasonOptions; track opt.value) {
            <button
              type="button"
              class="pill"
              [class.pill--active]="filter.season === opt.value"
              [attr.aria-pressed]="filter.season === opt.value"
              (click)="filterChange.emit({ season: opt.value })"
            >
              {{ opt.labelKey | transloco }}
            </button>
          }
        </div>
      </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        position: sticky;
        top: 0;
        z-index: 10;
        background-color: #ffffff;
        border-block-end: 1px solid rgba(15, 23, 42, 0.06);
      }
      .filter-bar-outer {
        max-width: 1400px;
        margin-inline: auto;
        padding-inline: 1rem;
      }
      @media (min-width: 768px)  { .filter-bar-outer { padding-inline: 2rem; } }
      @media (min-width: 1280px) { .filter-bar-outer { padding-inline: 3rem; } }
      .filter-bar {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding-block: 0.875rem;
      }
      @media (min-width: 768px) {
        .filter-bar {
          flex-direction: row;
          align-items: center;
          gap: 1.5rem;
        }
      }
      .filter-group {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
      }
      @media (min-width: 768px) {
        .filter-group {
          flex-direction: row;
          align-items: center;
          gap: 0.75rem;
        }
      }
      .filter-group__label {
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: rgba(15, 23, 42, 0.55);
      }
      .pill-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .pill {
        min-height: 44px;
        min-width: 44px;
        padding: 0 1rem;
        border: 1px solid rgba(15, 23, 42, 0.12);
        border-radius: 9999px;
        background-color: #ffffff;
        color: #0f172a;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        transition:
          background-color 150ms ease,
          color 150ms ease,
          border-color 150ms ease,
          transform 100ms ease;
      }
      .pill:hover {
        border-color: rgba(15, 189, 102, 0.4);
      }
      .pill:focus-visible {
        outline: 2px solid #0fbd66;
        outline-offset: 2px;
      }
      .pill--active {
        background-color: #0fbd66;
        color: #ffffff;
        border-color: #0fbd66;
      }
      .pill--active:hover {
        background-color: #0a8f4d;
      }
      @media (prefers-reduced-motion: reduce) {
        .pill {
          transition: none;
        }
      }
    `,
  ],
})
export class FilterBarComponent {
  @Input({ required: true }) filter!: CatalogFilterState;
  @Output() readonly filterChange = new EventEmitter<Partial<CatalogFilterState>>();

  readonly availabilityOptions: PillOption<CatalogAvailabilityKey>[] = [
    { value: 'all', labelKey: 'products_v2.catalog.filter_availability_all' },
    { value: 'in-season', labelKey: 'products_v2.catalog.filter_availability_in_season' },
    { value: 'coming-soon', labelKey: 'products_v2.catalog.filter_availability_coming_soon' },
  ];

  readonly seasonOptions: PillOption<CatalogSeasonKey>[] = [
    { value: 'all', labelKey: 'products_v2.catalog.filter_season_all' },
    { value: 'Summer', labelKey: 'products_v2.catalog.filter_season_summer' },
    { value: 'Winter', labelKey: 'products_v2.catalog.filter_season_winter' },
  ];
}
