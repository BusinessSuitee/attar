import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import { PublicProductCard } from '../public-catalog.store';
import { InSeasonBadgeComponent } from './in-season-badge.component';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [NgTemplateOutlet, RouterLink, TranslocoPipe, InSeasonBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (card.status === 'ComingSoon') {
      <article
        class="card card--coming-soon"
        [style.--card-accent]="card.accentColor"
      >
        <ng-container *ngTemplateOutlet="cardBody"></ng-container>
        <div class="card__coming-overlay" aria-hidden="true">
          <span class="card__coming-text">
            {{ 'products_v2.catalog.coming_soon_badge' | transloco }}
          </span>
        </div>
      </article>
    } @else {
      <a
        class="card"
        [routerLink]="['/products', card.id]"
        [style.--card-accent]="card.accentColor"
        [attr.aria-label]="primaryName()"
      >
        <ng-container *ngTemplateOutlet="cardBody"></ng-container>
      </a>
    }

    <ng-template #cardBody>
      <div class="card__media">
        @if (card.thumbnailUrl && !imageBroken) {
          <img
            class="card__img"
            [src]="resolvedThumbnail()"
            [alt]="primaryName()"
            loading="lazy"
            decoding="async"
            (error)="onImageError()"
          />
        } @else {
          <div class="card__placeholder" aria-hidden="true">
            <span class="material-symbols-outlined">image</span>
          </div>
        }
        <div class="card__badge">
          <app-in-season-badge
            [status]="card.status"
            [isInSeason]="card.isInSeasonNow"
          />
        </div>
      </div>
      <div class="card__info">
        <p class="card__name">{{ primaryName() }}</p>
        @if (secondaryName()) {
          <p class="card__name-alt" [attr.dir]="isArabic() ? 'ltr' : 'rtl'">
            {{ secondaryName() }}
          </p>
        }
      </div>
    </ng-template>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .card {
        position: relative;
        display: block;
        overflow: hidden;
        border-radius: 1rem;
        background-color: #ffffff;
        border: 1px solid rgba(15, 23, 42, 0.06);
        text-decoration: none;
        color: inherit;
        transition:
          transform 200ms ease,
          box-shadow 200ms ease,
          border-color 200ms ease;
      }
      .card:hover,
      .card:focus-visible {
        transform: translateY(-2px);
        border-color: var(--card-accent, rgba(15, 189, 102, 0.4));
        box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
      }
      .card:focus-visible {
        outline: 2px solid var(--card-accent, #0fbd66);
        outline-offset: 3px;
      }
      .card--coming-soon {
        cursor: default;
      }
      .card__media {
        position: relative;
        aspect-ratio: var(--card-aspect-ratio, 3 / 4);
        background-color: #f1f5f9;
        overflow: hidden;
      }
      .card__img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 350ms ease;
      }
      .card:hover .card__img,
      .card:focus-visible .card__img {
        transform: scale(1.05);
      }
      .card__placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        color: rgba(100, 116, 139, 0.6);
      }
      .card__placeholder .material-symbols-outlined {
        font-size: 4rem;
      }
      .card__badge {
        position: absolute;
        inset-block-start: 0.75rem;
        inset-inline-start: 0.75rem;
        z-index: 2;
      }
      .card__info {
        padding: 0.875rem 1rem 1rem;
      }
      .card__name {
        margin: 0;
        font-size: 1rem;
        font-weight: 700;
        line-height: 1.35;
        color: #0f172a;
      }
      .card__name-alt {
        margin: 0.25rem 0 0;
        font-size: 0.8125rem;
        font-weight: 500;
        color: rgba(15, 23, 42, 0.7);
      }
      .card__coming-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.65);
        backdrop-filter: blur(2px);
      }
      .card__coming-text {
        padding: 0.5rem 1rem;
        border-radius: 9999px;
        background-color: rgba(15, 23, 42, 0.85);
        color: #ffffff;
        font-size: 0.8125rem;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }
      @media (prefers-reduced-motion: reduce) {
        .card,
        .card__img {
          transition: none;
        }
      }
    `,
  ],
})
export class ProductCardComponent {
  private readonly transloco = inject(TranslocoService);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  @Input({ required: true }) card!: PublicProductCard;

  imageBroken = false;

  resolvedThumbnail(): string {
    const url = this.card.thumbnailUrl;
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${this.apiBaseUrl}/${url.replace(/^\//, '')}`;
  }

  isArabic(): boolean {
    const lang = (this.transloco.getActiveLang() || 'ar').toLowerCase();
    return lang.startsWith('ar');
  }

  primaryName(): string {
    if (this.isArabic()) {
      return (this.card.nameAr || this.card.name).trim();
    }
    return (this.card.name || this.card.nameAr).trim();
  }

  secondaryName(): string | null {
    if (this.isArabic()) {
      const en = (this.card.name || '').trim();
      return en && en !== this.primaryName() ? en : null;
    }
    return null;
  }

  onImageError(): void {
    this.imageBroken = true;
  }
}
