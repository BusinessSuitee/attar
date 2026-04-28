import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { ProductListItem } from '../../../core/products/product.service';

@Component({
  selector: 'app-in-season-badge',
  standalone: true,
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (status === 'ComingSoon') {
      <span class="badge badge--coming-soon">
        {{ 'products_v2.catalog.coming_soon_badge' | transloco }}
      </span>
    } @else if (isInSeason) {
      <span class="badge badge--in-season" aria-live="polite">
        <span class="badge__dot" aria-hidden="true"></span>
        {{ 'products_v2.catalog.in_season_badge' | transloco }}
      </span>
    }
  `,
  styles: [
    `
      :host {
        display: inline-flex;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.25rem 0.625rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 600;
        line-height: 1;
        white-space: nowrap;
      }
      .badge--in-season {
        background-color: rgba(15, 189, 102, 0.12);
        color: #0a8f4d;
      }
      .badge--coming-soon {
        background-color: rgba(100, 116, 139, 0.12);
        color: #475569;
      }
      .badge__dot {
        width: 0.5rem;
        height: 0.5rem;
        border-radius: 9999px;
        background-color: #0fbd66;
        box-shadow: 0 0 0 0 rgba(15, 189, 102, 0.6);
        animation: pulse-dot 1.6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }
      @keyframes pulse-dot {
        0% {
          box-shadow: 0 0 0 0 rgba(15, 189, 102, 0.6);
        }
        70% {
          box-shadow: 0 0 0 6px rgba(15, 189, 102, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(15, 189, 102, 0);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .badge__dot {
          animation: none;
        }
      }
    `,
  ],
})
export class InSeasonBadgeComponent {
  @Input({ required: true }) status: ProductListItem['status'] = 'Valid';
  @Input({ required: true }) isInSeason = false;
}
