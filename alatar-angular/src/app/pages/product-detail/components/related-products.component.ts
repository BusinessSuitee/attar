import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { ProductCardComponent } from '../../products/components/product-card.component';
import { PublicProductCard } from '../../products/public-catalog.store';

@Component({
  selector: 'app-related-products',
  standalone: true,
  imports: [ProductCardComponent, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (products.length > 0) {
      <section class="related" aria-labelledby="related-title">
        <h3 id="related-title" class="related__title">
          {{ 'products_v2.detail.related_title' | transloco }}
        </h3>
        <div class="related__strip" role="list">
          @for (card of products; track card.id) {
            <div class="related__cell" role="listitem">
              <app-product-card [card]="card"></app-product-card>
            </div>
          }
        </div>
      </section>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .related {
        padding: 1.5rem 0;
      }
      .related__title {
        margin: 0 1rem 1rem;
        font-size: 1.125rem;
        font-weight: 700;
        color: #0f172a;
      }
      @media (min-width: 768px) {
        .related__title {
          margin-inline: 2rem;
          font-size: 1.25rem;
        }
      }
      .related__strip {
        display: flex;
        gap: 1rem;
        overflow-x: auto;
        scroll-snap-type: x mandatory;
        -webkit-overflow-scrolling: touch;
        padding: 0.25rem 1rem 1rem;
        scrollbar-width: thin;
      }
      @media (min-width: 768px) {
        .related__strip {
          padding-inline: 2rem;
        }
      }
      .related__strip::-webkit-scrollbar {
        height: 6px;
      }
      .related__strip::-webkit-scrollbar-thumb {
        background-color: rgba(15, 23, 42, 0.15);
        border-radius: 9999px;
      }
      .related__cell {
        flex: 0 0 auto;
        width: 180px;
        scroll-snap-align: start;
      }
      @media (min-width: 768px) {
        .related__cell {
          width: 220px;
        }
      }
    `,
  ],
})
export class RelatedProductsComponent {
  @Input({ required: true }) products: PublicProductCard[] = [];
}
