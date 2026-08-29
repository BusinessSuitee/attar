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

      <!-- Specs Accordion -->
      <div class="flex-grow flex flex-col justify-center">
        @if (chipGroups().length > 0) {
          <div class="bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-8">
            <button 
              type="button"
              class="w-full flex items-center justify-between text-left group"
              (click)="toggleSpecs()"
            >
              <span class="text-lg font-black text-slate-800">{{ 'products_v2.detail.specs_title' | transloco }}</span>
              <div class="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 transition-transform duration-300" [class.rotate-180]="isSpecsOpen()">
                <span class="material-symbols-outlined">expand_more</span>
              </div>
            </button>
            
            <div 
              class="grid transition-all duration-300 ease-in-out"
              [class.grid-rows-[1fr]]="isSpecsOpen()"
              [class.grid-rows-[0fr]]="!isSpecsOpen()"
              [class.mt-6]="isSpecsOpen()"
            >
              <div class="overflow-hidden">
                <div class="flex flex-col gap-6">
                  @for (group of chipGroups(); track group.labelKey) {
                    <div>
                      <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">{{ group.labelKey | transloco }}</p>
                      <div class="flex flex-wrap gap-2">
                        @for (value of group.values; track value) {
                          <span class="inline-flex items-center px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 text-sm font-semibold shadow-sm">{{ value }}</span>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- CTA -->
      @if (product.status !== 'ComingSoon') {
        <div class="mt-auto pt-6 border-t border-slate-100">
          <a
            class="inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 bg-[#2D6A4F] text-white rounded-2xl font-bold text-lg hover:bg-[#1f4a37] transition-all shadow-xl shadow-[#2D6A4F]/20 group"
            [routerLink]="['/contact']"
            [queryParams]="{ crop: ctaName() }"
          >
            <span>{{ 'products_v2.detail.contact_cta' | transloco }}</span>
            <span class="material-symbols-outlined rtl:rotate-180 ms-2 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">arrow_forward</span>
          </a>
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

  isSpecsOpen = signal(true); // Open by default for better visibility on large screens

  toggleSpecs() {
    this.isSpecsOpen.update((v) => !v);
  }

  readonly chipGroups = computed<ChipGroup[]>(() => {
    const p = this.product;
    if (!p) return [];
    const groups: ChipGroup[] = [];
    if (p.varieties.length > 0) {
      groups.push({ labelKey: 'products_page.modal.variety_label', values: p.varieties });
    }
    if (p.packagingOptions.length > 0) {
      groups.push({
        labelKey: 'products_page.modal.packaging_label',
        values: p.packagingOptions,
      });
    }
    if (p.weightOptions.length > 0) {
      groups.push({ labelKey: 'products_page.modal.weight_label', values: p.weightOptions });
    }
    if (p.sizeOptions.length > 0) {
      groups.push({ labelKey: 'products_page.modal.size_label', values: p.sizeOptions });
    }
    if (p.gradeOptions.length > 0) {
      groups.push({ labelKey: 'products_page.modal.grade_label', values: p.gradeOptions });
    }
    return groups;
  });

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
