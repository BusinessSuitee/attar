import { ChangeDetectionStrategy, Component, Input, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';

import { InSeasonBadgeComponent } from '../../products/components/in-season-badge.component';

export interface ProductInfo {
  id: string;
  name: string;
  nameAr: string;
  status: 'Valid' | 'Invalid' | 'ComingSoon';
  productType: 'Fruit' | 'Vegetable';
  productState: 'Fresh' | 'Frozen';
  season: 'Summer' | 'Winter' | 'AllYear';
  varieties: string[];
  packagingOptions: string[];
  weightOptions: string[];
  sizeOptions: string[];
  gradeOptions: string[];
  isInSeasonNow: boolean;
}

interface ChipGroup {
  labelKey: string;
  values: string[];
}

@Component({
  selector: 'app-product-info-panel',
  standalone: true,
  imports: [RouterLink, TranslocoPipe, InSeasonBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col h-full p-8 lg:p-12">
      
      <!-- Title Area -->
      <div class="mb-6">
        @if (isArabic()) {
          <h1 class="text-4xl sm:text-5xl font-black text-slate-900 leading-tight mb-2 tracking-tight" dir="rtl">{{ product.nameAr || product.name }}</h1>
          @if (product.name && product.name !== product.nameAr) {
            <p class="text-xl sm:text-2xl font-bold text-slate-400" dir="ltr">{{ product.name }}</p>
          }
        } @else {
          <h1 class="text-4xl sm:text-5xl font-black text-slate-900 leading-tight mb-2 tracking-tight">{{ product.name || product.nameAr }}</h1>
          @if (product.nameAr && product.nameAr !== product.name) {
            <p class="text-xl sm:text-2xl font-bold text-slate-400" dir="rtl">{{ product.nameAr }}</p>
          }
        }
      </div>

      <!-- Badges & Chips -->
      <div class="flex flex-wrap gap-3 mb-10 items-center">
        <app-in-season-badge
          [status]="product.status"
          [isInSeason]="product.isInSeasonNow"
        />
        
        <span class="inline-flex items-center px-4 py-2 rounded-full bg-slate-100 text-slate-700 text-sm font-bold shadow-sm border border-slate-200/50">
          {{ seasonLabelKey() | transloco }}
        </span>
        <span class="inline-flex items-center px-4 py-2 rounded-full bg-slate-100 text-slate-700 text-sm font-bold shadow-sm border border-slate-200/50">
          {{ categoryLabelKey() | transloco }}
        </span>
        
        @if (product.productState === 'Frozen') {
          <span class="inline-flex items-center px-4 py-2 rounded-full bg-sky-100 text-sky-700 text-sm font-bold shadow-sm border border-sky-200/50">
            <span class="material-symbols-outlined text-[1.1rem] me-1.5">ac_unit</span>
            {{ 'products_page.filters.frozen' | transloco }}
          </span>
        }
      </div>

      <!-- CTA -->
      @if (product.status !== 'ComingSoon') {
        <div class="mt-auto pt-6 border-t border-slate-100">
          <button
            class="inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 bg-[#2D6A4F] text-white rounded-2xl font-bold text-lg hover:bg-[#1f4a37] transition-all shadow-xl shadow-[#2D6A4F]/20 group cursor-pointer border-0"
            (click)="scrollToOrder()"
          >
            <span>{{ 'products_v2.detail.contact_cta' | transloco }}</span>
            <span class="material-symbols-outlined ms-2 group-hover:translate-y-1 transition-transform">arrow_downward</span>
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
    `,
  ],
})
export class ProductInfoPanelComponent {
  private readonly transloco = inject(TranslocoService);

  @Input({ required: true }) product!: ProductInfo;

  private readonly activeLang = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  scrollToOrder() {
    const el = document.getElementById('order-form');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  isArabic(): boolean {
    return (this.activeLang() || 'ar').toLowerCase().startsWith('ar');
  }

  ctaName(): string {
    return this.isArabic() ? this.product.nameAr || this.product.name : this.product.name || this.product.nameAr;
  }

  seasonLabelKey(): string {
    const map: Record<string, string> = {
      Summer: 'products_page.seasons.summer',
      Winter: 'products_page.seasons.winter',
      AllYear: 'products_page.seasons.all_year',
    };
    return map[this.product.season] ?? 'products_page.seasons.all_year';
  }

  categoryLabelKey(): string {
    if (this.product.productState === 'Frozen') return 'products_page.filters.frozen';
    if (this.product.productType === 'Fruit') return 'products_page.filters.fruits';
    return 'products_page.filters.vegetables';
  }
}
