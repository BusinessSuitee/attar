import { ChangeDetectionStrategy, Component, Input, computed, inject } from '@angular/core';
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
    <div class="panel">
      <div class="panel__name">
        @if (isArabic()) {
          <h1 class="panel__name-primary" dir="rtl">{{ product.nameAr || product.name }}</h1>
          @if (product.name && product.name !== product.nameAr) {
            <p class="panel__name-secondary" dir="ltr">{{ product.name }}</p>
          }
        } @else {
          <h1 class="panel__name-primary">{{ product.name || product.nameAr }}</h1>
          @if (product.nameAr && product.nameAr !== product.name) {
            <p class="panel__name-secondary" dir="rtl">{{ product.nameAr }}</p>
          }
        }
      </div>

      <div class="panel__badges">
        <app-in-season-badge
          [status]="product.status"
          [isInSeason]="product.isInSeasonNow"
        />
      </div>

      <div class="panel__chips" role="list">
        <span class="chip" role="listitem">{{ seasonLabelKey() | transloco }}</span>
        <span class="chip" role="listitem">{{ categoryLabelKey() | transloco }}</span>
        @if (product.productState === 'Frozen') {
          <span class="chip chip--accent" role="listitem">
            {{ 'products_page.filters.frozen' | transloco }}
          </span>
        }
      </div>

      @if (product.status !== 'ComingSoon') {
        <a
          class="panel__cta"
          [routerLink]="['/contact']"
          [queryParams]="{ crop: ctaName() }"
        >
          {{ 'products_v2.detail.contact_cta' | transloco }}
        </a>
      }

      @if (chipGroups().length > 0) {
        <details class="panel__specs">
          <summary class="panel__specs-summary">
            {{ 'products_v2.detail.specs_title' | transloco }}
          </summary>
          <div class="panel__specs-body">
            @for (group of chipGroups(); track group.labelKey) {
              <div class="spec-group">
                <p class="spec-group__label">{{ group.labelKey | transloco }}</p>
                <div class="spec-group__chips">
                  @for (value of group.values; track value) {
                    <span class="chip chip--neutral">{{ value }}</span>
                  }
                </div>
              </div>
            }
          </div>
        </details>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .panel {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        padding: 1.5rem 1rem;
        background-color: #ffffff;
      }
      @media (min-width: 768px) {
        .panel {
          padding: 2rem 2.5rem;
          gap: 1.75rem;
        }
      }
      .panel__name-primary {
        margin: 0;
        font-size: 2rem;
        font-weight: 800;
        line-height: 1.1;
        letter-spacing: -0.01em;
        color: #0f172a;
      }
      @media (min-width: 768px) {
        .panel__name-primary {
          font-size: 2.5rem;
        }
      }
      .panel__name-secondary {
        margin: 0.5rem 0 0;
        font-size: 1.25rem;
        font-weight: 700;
        color: rgba(15, 23, 42, 0.7);
      }
      .panel__badges {
        display: flex;
        gap: 0.5rem;
      }
      .panel__chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .chip {
        display: inline-flex;
        align-items: center;
        padding: 0.375rem 0.75rem;
        border-radius: 9999px;
        background-color: rgba(15, 23, 42, 0.06);
        color: #0f172a;
        font-size: 0.8125rem;
        font-weight: 600;
      }
      .chip--neutral {
        background-color: #ffffff;
        border: 1px solid rgba(15, 23, 42, 0.12);
      }
      .chip--accent {
        background-color: rgba(14, 165, 233, 0.1);
        color: #0369a1;
      }
      .panel__cta {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 48px;
        padding: 0 1.5rem;
        background-color: #0fbd66;
        color: #ffffff;
        border-radius: 9999px;
        font-weight: 700;
        text-decoration: none;
        font-size: 1rem;
        transition: background-color 150ms ease;
        align-self: flex-start;
      }
      .panel__cta:hover {
        background-color: #0a8f4d;
      }
      .panel__cta:focus-visible {
        outline: 2px solid #0fbd66;
        outline-offset: 2px;
      }
      .panel__specs {
        border-top: 1px solid rgba(15, 23, 42, 0.08);
        padding-top: 1rem;
      }
      .panel__specs-summary {
        cursor: pointer;
        font-weight: 700;
        font-size: 1rem;
        list-style: none;
        padding: 0.5rem 0;
        min-height: 44px;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .panel__specs-summary::after {
        content: '+';
        margin-inline-start: auto;
        font-size: 1.25rem;
        font-weight: 400;
        color: rgba(15, 23, 42, 0.5);
        transition: transform 150ms ease;
      }
      .panel__specs[open] .panel__specs-summary::after {
        transform: rotate(45deg);
      }
      .panel__specs-summary::-webkit-details-marker {
        display: none;
      }
      .panel__specs-body {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding-top: 0.75rem;
      }
      .spec-group__label {
        margin: 0 0 0.5rem;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: rgba(15, 23, 42, 0.6);
      }
      .spec-group__chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
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
