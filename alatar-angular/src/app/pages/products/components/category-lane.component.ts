import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import { CategoryLane, CatalogCategoryKey } from '../public-catalog.store';

@Component({
  selector: 'app-category-lane',
  standalone: true,
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lane-strip" role="list" [attr.aria-label]="'products_v2.catalog.category_all' | transloco">
      @for (lane of lanes; track lane.key) {
        <button
          type="button"
          role="listitem"
          class="lane"
          [class.lane--active]="lane.key === activeKey"
          [style.--lane-accent]="lane.accentColor"
          (click)="categorySelected.emit(lane.key)"
          [attr.aria-pressed]="lane.key === activeKey"
        >
          <div class="lane__media">
            @if (lane.coverImageUrl) {
              <img
                class="lane__img"
                [src]="resolveUrl(lane.coverImageUrl)"
                [alt]="lane.labelKey | transloco"
                loading="lazy"
                decoding="async"
              />
            } @else {
              <div class="lane__placeholder" aria-hidden="true"></div>
            }
            <div class="lane__overlay" aria-hidden="true"></div>
          </div>
          <div class="lane__label">
            <span class="lane__name">{{ lane.labelKey | transloco }}</span>
            <span class="lane__count">{{ lane.productCount }}</span>
          </div>
        </button>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .lane-strip {
        display: flex;
        gap: 0.75rem;
        overflow-x: auto;
        scroll-snap-type: x mandatory;
        -webkit-overflow-scrolling: touch;
        padding: 0.25rem 1rem 0.5rem;
        scrollbar-width: thin;
      }
      .lane-strip::-webkit-scrollbar {
        height: 6px;
      }
      .lane-strip::-webkit-scrollbar-thumb {
        background-color: rgba(15, 23, 42, 0.15);
        border-radius: 9999px;
      }
      .lane {
        position: relative;
        flex: 0 0 auto;
        width: 140px;
        min-height: 44px;
        padding: 0;
        scroll-snap-align: start;
        background: transparent;
        border: 2px solid transparent;
        border-radius: 1rem;
        overflow: hidden;
        cursor: pointer;
        transition: border-color 200ms ease, transform 200ms ease;
      }
      @media (min-width: 768px) {
        .lane {
          width: 180px;
        }
      }
      .lane--active {
        border-color: var(--lane-accent);
      }
      .lane:hover,
      .lane:focus-visible {
        transform: translateY(-2px);
      }
      .lane:focus-visible {
        outline: 2px solid var(--lane-accent);
        outline-offset: 2px;
      }
      .lane__media {
        position: relative;
        aspect-ratio: 4 / 3;
        background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
      }
      .lane__img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .lane__placeholder {
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, var(--lane-accent), rgba(0, 0, 0, 0.05));
        opacity: 0.35;
      }
      .lane__overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg, transparent 50%, rgba(15, 23, 42, 0.55));
      }
      .lane__label {
        position: absolute;
        inset-inline-start: 0.75rem;
        inset-inline-end: 0.75rem;
        inset-block-end: 0.625rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        color: #ffffff;
      }
      .lane__name {
        font-weight: 700;
        font-size: 0.9375rem;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      }
      .lane__count {
        padding: 0.125rem 0.5rem;
        background-color: rgba(255, 255, 255, 0.85);
        color: #0f172a;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 700;
      }
      @media (prefers-reduced-motion: reduce) {
        .lane {
          transition: none;
        }
      }
    `,
  ],
})
export class CategoryLaneComponent {
  private readonly apiBaseUrl = inject(API_BASE_URL);

  @Input({ required: true }) lanes: CategoryLane[] = [];
  @Input() activeKey: CatalogCategoryKey = 'all';
  @Output() readonly categorySelected = new EventEmitter<CatalogCategoryKey>();

  resolveUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${this.apiBaseUrl}/${url.replace(/^\//, '')}`;
  }
}
