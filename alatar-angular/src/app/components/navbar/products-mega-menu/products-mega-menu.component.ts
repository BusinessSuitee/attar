import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import { ProductListItem, ProductSeason } from '../../../core/products/product.service';
import { ProductCategoryKey, ProductsStore } from '../../../core/products/products.store';

interface CategoryOption {
  id: ProductCategoryKey;
  labelKey: string;
  icon: string;
  supportsSeasons: boolean;
}

type SeasonFilter = 'all' | ProductSeason;

interface SeasonOption {
  id: SeasonFilter;
  labelKey: string;
  icon: string;
}

@Component({
  selector: 'app-products-mega-menu',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslocoPipe],
  templateUrl: './products-mega-menu.component.html',
  styleUrl: './products-mega-menu.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsMegaMenuComponent implements OnChanges {
  private readonly productsStore = inject(ProductsStore);
  private readonly router = inject(Router);
  private readonly translocoService = inject(TranslocoService);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  @Input() open = false;
  @Input() openedViaKeyboard = false;

  @Output() close = new EventEmitter<void>();
  @Output() panelEnter = new EventEmitter<void>();
  @Output() panelLeave = new EventEmitter<void>();

  readonly categories: CategoryOption[] = [
    { id: 'all', labelKey: 'products_page.filters.all', icon: 'apps', supportsSeasons: false },
    { id: 'Fruit', labelKey: 'products_page.filters.fruits', icon: 'nutrition', supportsSeasons: true },
    {
      id: 'Vegetable',
      labelKey: 'products_page.filters.vegetables',
      icon: 'eco',
      supportsSeasons: true,
    },
    { id: 'Frozen', labelKey: 'products_page.filters.frozen', icon: 'severe_cold', supportsSeasons: false },
  ];

  readonly seasons: SeasonOption[] = [
    { id: 'all', labelKey: 'products_page.seasons.all', icon: 'calendar_month' },
    { id: 'Summer', labelKey: 'products_page.seasons.summer', icon: 'sunny' },
    { id: 'Winter', labelKey: 'products_page.seasons.winter', icon: 'ac_unit' },
    { id: 'AllYear', labelKey: 'products_page.seasons.all_year', icon: 'autorenew' },
  ];

  readonly hoveredCategory = signal<ProductCategoryKey>('all');
  readonly activeSeason = signal<SeasonFilter>('all');

  readonly storeIsLoading = this.productsStore.isLoading;
  readonly storeHasError = this.productsStore.hasError;
  readonly storeHasLoaded = this.productsStore.hasLoaded;
  readonly productsByCategory = this.productsStore.validProductsByCategory;

  readonly currentCategoryMeta = computed<CategoryOption>(() => {
    const id = this.hoveredCategory();
    return this.categories.find((c) => c.id === id) ?? this.categories[0];
  });

  readonly filteredProducts = computed<ProductListItem[]>(() => {
    const cat = this.hoveredCategory();
    const meta = this.currentCategoryMeta();
    const season = this.activeSeason();
    const list = this.productsStore.validProductsByCategory()[cat];

    if (meta.supportsSeasons && season !== 'all') {
      return list.filter((p) => p.season === season);
    }
    return list;
  });

  readonly skeletonSlots = Array.from({ length: 8 });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] && !changes['open'].currentValue) {
      this.activeSeason.set('all');
    }
  }

  onCategoryHover(category: ProductCategoryKey): void {
    this.hoveredCategory.set(category);
    this.activeSeason.set('all');
  }

  onCategoryClick(event: MouseEvent, category: ProductCategoryKey): void {
    event.preventDefault();
    this.productsStore.pendingCategoryFilter.set(category);
    const targetCat = category === 'all' ? null : category;
    this.router.navigate(['/products'], {
      queryParams: { category: targetCat, season: null },
      queryParamsHandling: 'merge',
    });
    this.close.emit();
  }

  onSeasonClick(season: SeasonFilter): void {
    this.activeSeason.set(season);
  }

  onProductClick(): void {
    this.close.emit();
  }

  onViewAllClick(event: MouseEvent): void {
    event.preventDefault();
    const cat = this.hoveredCategory();
    const meta = this.currentCategoryMeta();
    const season = this.activeSeason();

    this.productsStore.pendingCategoryFilter.set(cat);
    this.router.navigate(['/products'], {
      queryParams: {
        category: cat === 'all' ? null : cat,
        season: meta.supportsSeasons && season !== 'all' ? season : null,
      },
      queryParamsHandling: 'merge',
    });
    this.close.emit();
  }

  onPanelMouseEnter(): void {
    this.panelEnter.emit();
  }

  onPanelMouseLeave(): void {
    this.panelLeave.emit();
  }

  onRetry(): void {
    this.productsStore.reload();
  }

  imageUrl(relativePath: string): string {
    if (!relativePath) return '';
    if (relativePath.startsWith('http')) return relativePath;
    return `${this.apiBaseUrl}/${relativePath.replace(/^\//, '')}`;
  }

  hasImages(product: ProductListItem): boolean {
    return (product.imageUrls?.length ?? 0) > 0;
  }

  productDisplayName(product: ProductListItem): string {
    const lang = this.translocoService.getActiveLang().toLowerCase();
    const isArabic = lang.startsWith('ar');
    if (isArabic) {
      return (product.nameAr || product.name).trim();
    }
    return (product.name || product.nameAr).trim();
  }

  trackCategory = (_: number, item: CategoryOption): string => item.id;
  trackSeason = (_: number, item: SeasonOption): string => item.id;
  trackProduct = (_: number, item: ProductListItem): string => item.id;
  trackSkeleton = (index: number): number => index;
}
