import { isPlatformBrowser } from '@angular/common';
import {
  Injectable,
  PLATFORM_ID,
  Signal,
  WritableSignal,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ProductListItem } from '../../core/products/product.service';
import { ProductsStore } from '../../core/products/products.store';
import {
  getAvailableMonths,
  getCategoryAccent,
  isInSeasonNow,
} from '../../core/products/season-calendar.utils';

export type CatalogCategoryKey = 'all' | 'Fruit' | 'Vegetable' | 'Frozen';
export type CatalogSeasonKey = 'all' | 'Summer' | 'Winter' | 'AllYear';
export type CatalogAvailabilityKey = 'all' | 'in-season' | 'coming-soon';

export interface CatalogFilterState {
  category: CatalogCategoryKey;
  season: CatalogSeasonKey;
  availability: CatalogAvailabilityKey;
}

export interface PublicProductCard {
  id: string;
  name: string;
  nameAr: string;
  status: ProductListItem['status'];
  productType: ProductListItem['productType'];
  productState: ProductListItem['productState'];
  season: ProductListItem['season'];
  thumbnailUrl: string | null;
  isInSeasonNow: boolean;
  accentColor: string;
}

export interface CategoryLane {
  key: CatalogCategoryKey;
  labelKey: string;
  coverImageUrl: string | null;
  accentColor: string;
  productCount: number;
}

const PAGE_SIZE = 12;

const DEFAULT_FILTER: CatalogFilterState = {
  category: 'all',
  season: 'all',
  availability: 'all',
};

@Injectable()
export class PublicCatalogStore {
  private readonly productsStore = inject(ProductsStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly platformId = inject(PLATFORM_ID);

  readonly filter: WritableSignal<CatalogFilterState> = signal({ ...DEFAULT_FILTER });
  readonly visiblePage: WritableSignal<number> = signal(1);

  private readonly currentMonth = signal<number | null>(null);

  readonly isLoading: Signal<boolean> = this.productsStore.isLoading;
  readonly hasError: Signal<boolean> = this.productsStore.hasError;

  private readonly publicCards = computed<PublicProductCard[]>(() => {
    const month = this.currentMonth();
    return this.productsStore
      .products()
      .filter((p) => p.status !== 'Invalid')
      .map<PublicProductCard>((p) => ({
        id: p.id,
        name: p.name,
        nameAr: p.nameAr,
        status: p.status,
        productType: p.productType,
        productState: p.productState,
        season: p.season,
        thumbnailUrl: pickThumbnail(p),
        isInSeasonNow:
          p.status === 'Valid' &&
          month !== null &&
          getAvailableMonths(p.season).includes(month),
        accentColor: getCategoryAccent(p.productType, p.productState),
      }));
  });

  readonly filteredItems = computed<PublicProductCard[]>(() => {
    const { category, season, availability } = this.filter();
    return this.publicCards().filter((card) => {
      if (category === 'Frozen') {
        if (card.productState !== 'Frozen') return false;
      } else if (category !== 'all') {
        if (card.productType !== category || card.productState !== 'Fresh') return false;
      }

      if (season !== 'all' && card.season !== season) {
        return false;
      }

      if (availability === 'in-season' && !card.isInSeasonNow) {
        return false;
      }

      if (availability === 'coming-soon' && card.status !== 'ComingSoon') {
        return false;
      }

      return true;
    });
  });

  readonly visibleItems = computed<PublicProductCard[]>(() =>
    this.filteredItems().slice(0, this.visiblePage() * PAGE_SIZE),
  );

  readonly hasMore = computed<boolean>(
    () => this.visibleItems().length < this.filteredItems().length,
  );

  readonly categoryLanes = computed<CategoryLane[]>(() => {
    const cards = this.publicCards();
    const valid = cards.filter((c) => c.status === 'Valid');

    const fruit = valid.filter((c) => c.productType === 'Fruit' && c.productState === 'Fresh');
    const vegetable = valid.filter(
      (c) => c.productType === 'Vegetable' && c.productState === 'Fresh',
    );
    const frozen = valid.filter((c) => c.productState === 'Frozen');

    return [
      {
        key: 'all',
        labelKey: 'products_v2.catalog.category_all',
        coverImageUrl: valid[0]?.thumbnailUrl ?? null,
        accentColor: '#0fbd66',
        productCount: cards.length,
      },
      {
        key: 'Fruit',
        labelKey: 'products_page.filters.fruits',
        coverImageUrl: fruit[0]?.thumbnailUrl ?? null,
        accentColor: getCategoryAccent('Fruit', 'Fresh'),
        productCount: fruit.length,
      },
      {
        key: 'Vegetable',
        labelKey: 'products_page.filters.vegetables',
        coverImageUrl: vegetable[0]?.thumbnailUrl ?? null,
        accentColor: getCategoryAccent('Vegetable', 'Fresh'),
        productCount: vegetable.length,
      },
      {
        key: 'Frozen',
        labelKey: 'products_page.filters.frozen',
        coverImageUrl: frozen[0]?.thumbnailUrl ?? null,
        accentColor: getCategoryAccent('Fruit', 'Frozen'),
        productCount: frozen.length,
      },
    ];
  });

  constructor() {
    afterNextRender(() => {
      if (isPlatformBrowser(this.platformId)) {
        this.currentMonth.set(new Date().getMonth() + 1);
      }
    });
  }

  ensureLoaded(): void {
    this.productsStore.ensureLoaded();
  }

  reload(): void {
    this.productsStore.reload();
  }

  setFilter(patch: Partial<CatalogFilterState>): void {
    const next: CatalogFilterState = { ...this.filter(), ...patch };
    this.filter.set(next);
    this.visiblePage.set(1);
    this.pushFilterToUrl(next);
  }

  resetFilter(): void {
    this.filter.set({ ...DEFAULT_FILTER });
    this.visiblePage.set(1);
    this.pushFilterToUrl(DEFAULT_FILTER);
  }

  loadMore(): void {
    if (!this.hasMore()) return;
    this.visiblePage.update((n) => n + 1);
  }

  syncFromUrl(): void {
    const params = this.route.snapshot.queryParamMap;
    const next: CatalogFilterState = {
      category: parseCategory(params.get('category')),
      season: parseSeason(params.get('season')),
      availability: parseAvailability(params.get('availability')),
    };
    this.filter.set(next);
    this.visiblePage.set(1);
  }

  /**
   * Test-only hook: pin the current month so signal-derived isInSeasonNow becomes
   * deterministic in unit tests. Runtime always uses the afterNextRender path.
   */
  setCurrentMonthForTesting(month: number | null): void {
    this.currentMonth.set(month);
  }

  private pushFilterToUrl(next: CatalogFilterState): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const queryParams = {
      category: next.category === 'all' ? null : next.category,
      season: next.season === 'all' ? null : next.season,
      availability: next.availability === 'all' ? null : next.availability,
    };

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}

function pickThumbnail(product: ProductListItem): string | null {
  const urls = product.imageUrls ?? [];
  for (const url of urls) {
    if (url && url.trim().length > 0) return url;
  }
  return null;
}

function parseCategory(value: string | null): CatalogCategoryKey {
  return value === 'Fruit' || value === 'Vegetable' || value === 'Frozen' ? value : 'all';
}

function parseSeason(value: string | null): CatalogSeasonKey {
  return value === 'Summer' || value === 'Winter' || value === 'AllYear' ? value : 'all';
}

function parseAvailability(value: string | null): CatalogAvailabilityKey {
  return value === 'in-season' || value === 'coming-soon' ? value : 'all';
}
