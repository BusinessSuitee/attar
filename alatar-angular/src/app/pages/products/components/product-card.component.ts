import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import { PublicProductCard } from '../public-catalog.store';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [NgTemplateOutlet, RouterLink, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (card.status === 'ComingSoon') {
      <article
        class="product-card product-card--coming-soon"
      >
        <ng-container *ngTemplateOutlet="cardBody"></ng-container>
      </article>
    } @else {
      <article
        class="product-card"
      >
        <ng-container *ngTemplateOutlet="cardBody"></ng-container>
      </article>
    }

    <ng-template #cardBody>
      <a
        class="product-card-img"
        [routerLink]="['/products', card.id]"
      >
        @if (card.thumbnailUrl && !imageBroken) {
          <img
            [src]="resolvedThumbnail()"
            [alt]="primaryName()"
            [class.product-card-img--grayscale]="card.status === 'ComingSoon'"
            loading="lazy"
            decoding="async"
            (error)="onImageError()"
          />
        } @else {
          <div class="product-card-placeholder">
            <span class="material-symbols-outlined">agriculture</span>
          </div>
        }
        <span class="product-card-cat" [class.product-card-cat--coming]="card.status === 'ComingSoon'">
          {{ categoryLabelKey() | transloco }}
        </span>
      </a>

      <div class="product-card-body">
        <h3>
          <a [routerLink]="['/products', card.id]" class="hover:text-[var(--cleo-gold-deep)] transition-colors text-inherit no-underline block">
            {{ primaryName() }}
          </a>
        </h3>
        
        <p class="product-card-season">
          <span class="material-symbols-outlined">calendar_month</span>
          {{ seasonLabelKey(card.season) | transloco }}
        </p>

        <div class="product-card-cta">
          <a
            class="btn btn-outline btn-sm"
            [routerLink]="['/products', card.id]"
          >
            {{ 'products_page.buttons.view_details' | transloco }}
          </a>
        </div>
      </div>
    </ng-template>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
      .product-card {
        background: #ffffff;
        border: 1px solid var(--cleo-border, #e2e8f0);
        border-radius: 12px;
        overflow: hidden;
        transition: all 0.3s ease;
        display: flex;
        flex-direction: column;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        height: 100%;
      }
      .product-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
        border-color: var(--cleo-gold-soft, #fef08a);
      }
      .product-card--coming-soon {
        border-style: dashed;
      }
      .product-card-img {
        position: relative;
        aspect-ratio: 4 / 3;
        overflow: hidden;
        background: var(--cleo-cream, #fefce8);
        cursor: pointer;
        display: block;
      }
      .product-card-img img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.5s ease;
      }
      .product-card:hover .product-card-img img {
        transform: scale(1.06);
      }
      .product-card-img--grayscale {
        filter: grayscale(0.85);
      }
      .product-card-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        color: #cbd5e1;
        background: var(--cleo-cream, #fefce8);
      }
      .product-card-placeholder .material-symbols-outlined {
        font-size: 3.5rem;
      }
      .product-card-cat {
        position: absolute;
        top: 14px;
        inset-inline-start: 14px;
        background: rgba(255, 255, 255, 0.96);
        color: var(--cleo-green, #1f4d3a);
        font-size: 0.72rem;
        padding: 5px 12px;
        border-radius: 4px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      }
      .product-card-cat--coming {
        background: var(--cleo-gold, #eab308);
        color: #ffffff;
      }
      .product-card-body {
        padding: 22px 22px 24px;
        flex: 1;
        display: flex;
        flex-direction: column;
      }
      .product-card h3 {
        font-size: 1.3rem;
        font-weight: 700;
        color: var(--cleo-green-dark, #064e3b);
        margin: 0 0 6px;
        cursor: pointer;
        transition: color 0.3s ease;
        line-height: 1.3;
      }
      .product-card h3 a {
        color: inherit;
        text-decoration: none;
        display: block;
      }
      .product-card h3:hover, .product-card h3 a:hover {
        color: var(--cleo-gold-deep, #ca8a04);
      }
      .product-card-season {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.82rem;
        color: var(--cleo-gold-deep, #ca8a04);
        margin-bottom: 12px;
        font-weight: 600;
      }
      .product-card-season .material-symbols-outlined {
        font-size: 1rem;
        color: var(--cleo-gold, #eab308);
      }
      .product-card-cta {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: auto;
      }
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.35rem;
        padding: 0.75rem 1.5rem;
        font-size: 0.9375rem;
        font-weight: 700;
        font-family: inherit;
        line-height: 1.25;
        border-radius: 9999px;
        border: 2px solid transparent;
        cursor: pointer;
        transition: all 0.2s ease-in-out;
        text-decoration: none;
        text-align: center;
      }
      .btn-outline {
        background-color: transparent;
        color: var(--cleo-green-dark, #064e3b);
        border-color: var(--cleo-green-dark, #064e3b);
      }
      .btn-outline:hover {
        background-color: var(--cleo-green-dark, #064e3b);
        color: #ffffff;
      }
      .btn-sm {
        padding: 0.5rem 1rem;
        font-size: 0.8125rem;
      }
    `
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

  categoryLabelKey(): string {
    if (this.card.status === 'ComingSoon') return 'products_page.filters.coming_soon';
    if (this.card.productType === 'Vegetable') return 'products_page.filters.vegetables';
    return 'products_page.filters.fruits';
  }

  seasonLabelKey(season: string): string {
    switch (season) {
      case 'Summer': return 'products_page.filters.summer';
      case 'Winter': return 'products_page.filters.winter';
      case 'AllYear': return 'products_page.filters.all_year';
      default: return 'products_page.filters.all_year';
    }
  }

  onImageError(): void {
    this.imageBroken = true;
  }
}
