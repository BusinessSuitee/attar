import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { signal } from '@angular/core';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import { ProductListItem } from '../../core/products/product.service';
import { ProductsStore } from '../../core/products/products.store';
import { PublicCatalogStore } from './public-catalog.store';

function buildProduct(overrides: Partial<ProductListItem>): ProductListItem {
  return {
    id: 'p-' + Math.random().toString(36).slice(2, 8),
    name: 'Sample',
    nameAr: 'عينة',
    sku: 'SKU-1',
    price: 0,
    stockQuantity: 0,
    status: 'Valid',
    descriptionEn: '',
    descriptionAr: '',
    productType: 'Fruit',
    productState: 'Fresh',
    season: 'AllYear',
    varieties: [],
    packagingOptions: [],
    weightOptions: [],
    sizeOptions: [],
    gradeOptions: [],
    imageUrls: ['https://example.com/img.jpg'],
    ...overrides,
  };
}

function buildFixture(): ProductListItem[] {
  const list: ProductListItem[] = [];
  for (let i = 0; i < 14; i++) {
    list.push(
      buildProduct({
        id: `fruit-summer-${i}`,
        name: `Fruit Summer ${i}`,
        productType: 'Fruit',
        productState: 'Fresh',
        season: 'Summer',
        status: 'Valid',
      }),
    );
  }
  for (let i = 0; i < 6; i++) {
    list.push(
      buildProduct({
        id: `veg-winter-${i}`,
        name: `Veg Winter ${i}`,
        productType: 'Vegetable',
        productState: 'Fresh',
        season: 'Winter',
        status: 'Valid',
      }),
    );
  }
  for (let i = 0; i < 4; i++) {
    list.push(
      buildProduct({
        id: `frozen-${i}`,
        name: `Frozen ${i}`,
        productType: 'Vegetable',
        productState: 'Frozen',
        season: 'AllYear',
        status: 'Valid',
      }),
    );
  }
  list.push(
    buildProduct({
      id: 'coming-soon-1',
      name: 'Coming Soon',
      productType: 'Fruit',
      productState: 'Fresh',
      season: 'Winter',
      status: 'ComingSoon',
    }),
    buildProduct({
      id: 'invalid-1',
      name: 'Invalid',
      status: 'Invalid',
    }),
  );
  return list;
}

class StubProductsStore {
  readonly products = signal<ProductListItem[]>([]);
  readonly isLoading = signal(false);
  readonly hasError = signal(false);
  readonly hasLoaded = signal(true);
  ensureLoaded(): void {}
  reload(): void {}
}

class StubRouter {
  navigate = vi.fn().mockResolvedValue(true);
}

describe('PublicCatalogStore', () => {
  let store: PublicCatalogStore;
  let stubStore: StubProductsStore;
  let stubRouter: StubRouter;

  beforeEach(() => {
    stubStore = new StubProductsStore();
    stubStore.products.set(buildFixture());
    stubRouter = new StubRouter();

    TestBed.configureTestingModule({
      providers: [
        PublicCatalogStore,
        { provide: ProductsStore, useValue: stubStore },
        { provide: Router, useValue: stubRouter },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap({}) },
          },
        },
      ],
    });

    store = TestBed.inject(PublicCatalogStore);
    store.setCurrentMonthForTesting(7);
  });

  it('hides Invalid products from publicCards via filteredItems', () => {
    const ids = store.filteredItems().map((c) => c.id);
    expect(ids).not.toContain('invalid-1');
    expect(ids).toContain('coming-soon-1');
  });

  it('filter by category Fruit returns only Fruit-Fresh entries', () => {
    store.setFilter({ category: 'Fruit' });
    const items = store.filteredItems();
    expect(items.every((c) => c.productType === 'Fruit' && c.productState === 'Fresh')).toBe(true);
  });

  it('filter by category Frozen returns only Frozen state regardless of type', () => {
    store.setFilter({ category: 'Frozen' });
    const items = store.filteredItems();
    expect(items.length).toBe(4);
    expect(items.every((c) => c.productState === 'Frozen')).toBe(true);
  });

  it('availability=in-season excludes ComingSoon and out-of-season products', () => {
    store.setCurrentMonthForTesting(7);
    store.setFilter({ availability: 'in-season' });
    const items = store.filteredItems();
    expect(items.every((c) => c.isInSeasonNow)).toBe(true);
    expect(items.find((c) => c.id === 'coming-soon-1')).toBeUndefined();
  });

  it('availability=coming-soon returns only ComingSoon products', () => {
    store.setFilter({ availability: 'coming-soon' });
    const items = store.filteredItems();
    expect(items.length).toBe(1);
    expect(items[0].id).toBe('coming-soon-1');
  });

  it('combines filters by intersection', () => {
    store.setFilter({ category: 'Fruit', season: 'Summer' });
    const items = store.filteredItems();
    expect(items.every((c) => c.productType === 'Fruit' && c.season === 'Summer')).toBe(true);
  });

  it('visibleItems returns only the first page (12 items) by default', () => {
    expect(store.visibleItems().length).toBe(12);
    expect(store.hasMore()).toBe(true);
  });

  it('loadMore() appends the next batch of 12', () => {
    const totalBefore = store.visibleItems().length;
    store.loadMore();
    expect(store.visibleItems().length).toBeGreaterThan(totalBefore);
  });

  it('hasMore is false once all filtered items are visible', () => {
    store.setFilter({ category: 'Frozen' });
    expect(store.filteredItems().length).toBe(4);
    expect(store.visibleItems().length).toBe(4);
    expect(store.hasMore()).toBe(false);
  });

  it('resetFilter() clears all dimensions and resets visiblePage', () => {
    store.setFilter({ category: 'Fruit', season: 'Summer', availability: 'in-season' });
    store.loadMore();
    store.resetFilter();
    expect(store.filter()).toEqual({ category: 'all', season: 'all', availability: 'all' });
    expect(store.visiblePage()).toBe(1);
  });

  it('setFilter pushes URL update via Router.navigate', () => {
    store.setFilter({ category: 'Fruit' });
    expect(stubRouter.navigate).toHaveBeenCalled();
    const lastCall = stubRouter.navigate.mock.calls.at(-1)!;
    const queryParams = lastCall[1].queryParams;
    expect(queryParams.category).toBe('Fruit');
    expect(queryParams.season).toBeNull();
    expect(queryParams.availability).toBeNull();
  });

  it('syncFromUrl reads query params into filter state', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        PublicCatalogStore,
        { provide: ProductsStore, useValue: stubStore },
        { provide: Router, useValue: new StubRouter() },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({
                category: 'Vegetable',
                season: 'Winter',
                availability: 'in-season',
              }),
            },
          },
        },
      ],
    });

    const reloaded = TestBed.inject(PublicCatalogStore);
    reloaded.syncFromUrl();
    expect(reloaded.filter()).toEqual({
      category: 'Vegetable',
      season: 'Winter',
      availability: 'in-season',
    });
  });

  it('categoryLanes returns four lanes (all + 3 categories) with derived counts', () => {
    const lanes = store.categoryLanes();
    expect(lanes.map((l) => l.key)).toEqual(['all', 'Fruit', 'Vegetable', 'Frozen']);
    expect(lanes[0].productCount).toBeGreaterThan(0);
    expect(lanes[1].productCount).toBe(14);
    expect(lanes[2].productCount).toBe(6);
    expect(lanes[3].productCount).toBe(4);
  });
});
