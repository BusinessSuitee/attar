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
      <section aria-labelledby="related-title">
        <div class="flex items-center gap-3 mb-8">
          <span class="material-symbols-outlined text-[#E8871E] text-3xl">category</span>
          <h3 id="related-title" class="text-2xl sm:text-3xl font-black text-slate-900 m-0">
            {{ 'products_v2.detail.related_title' | transloco }}
          </h3>
        </div>
        
        <div class="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-8 pt-2 hide-scrollbar" role="list">
          @for (card of products; track card.id) {
            <div class="flex-none w-[260px] sm:w-[300px] snap-start" role="listitem">
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
      .hide-scrollbar {
        -ms-overflow-style: none;  /* IE and Edge */
        scrollbar-width: none;  /* Firefox */
      }
      .hide-scrollbar::-webkit-scrollbar {
        display: none;
      }
    `,
  ],
})
export class RelatedProductsComponent {
  @Input({ required: true }) products: PublicProductCard[] = [];
}
