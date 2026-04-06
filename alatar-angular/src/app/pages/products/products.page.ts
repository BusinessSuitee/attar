import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { TranslocoPipe } from '@jsverse/transloco';
import { ProductListItem, ProductService } from '../../core/products/product.service';
import { API_BASE_URL } from '../../core/config/api-base-url.token';

type CategoryFilter = 'all' | 'Fruit' | 'Vegetable' | 'Frozen';
type SeasonFilter = 'all' | 'Summer' | 'Winter' | 'AllYear';

interface FilterOption {
  id: CategoryFilter;
  labelKey: string;
  icon: string;
}

interface SeasonOption {
  id: SeasonFilter;
  labelKey: string;
  icon: string;
}

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [CommonModule, NavbarComponent, TranslocoPipe],
  templateUrl: './products.page.html',
  styleUrl: './products.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPageComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  readonly isBrowser = typeof window !== 'undefined';

  readonly activeFilter = signal<CategoryFilter>('all');
  readonly activeSeason = signal<SeasonFilter>('all');
  readonly selectedProduct = signal<ProductListItem | null>(null);
  readonly activeImageIndex = signal<number>(0);
  readonly products = signal<ProductListItem[]>([]);
  readonly isLoading = signal(true);
  readonly loadError = signal('');

  readonly filterOptions: FilterOption[] = [
    { id: 'all', labelKey: 'products_page.filters.all', icon: 'apps' },
    { id: 'Fruit', labelKey: 'products_page.filters.fruits', icon: 'nutrition' },
    { id: 'Vegetable', labelKey: 'products_page.filters.vegetables', icon: 'eco' },
    { id: 'Frozen', labelKey: 'products_page.filters.frozen', icon: 'severe_cold' },
  ];

  readonly seasonOptions: SeasonOption[] = [
    { id: 'all', labelKey: 'products_page.seasons.all', icon: 'calendar_month' },
    { id: 'Summer', labelKey: 'products_page.seasons.summer', icon: 'sunny' },
    { id: 'Winter', labelKey: 'products_page.seasons.winter', icon: 'ac_unit' },
    { id: 'AllYear', labelKey: 'products_page.seasons.all_year', icon: 'autorenew' },
  ];

  readonly showSeasonFilter = computed(() => {
    const f = this.activeFilter();
    return f === 'Fruit' || f === 'Vegetable';
  });

  readonly visibleProducts = computed(() => {
    const catFilter = this.activeFilter();
    const seasonFilter = this.activeSeason();
    let list = this.products();

    if (catFilter === 'Frozen') {
      list = list.filter(p => p.productState === 'Frozen');
    } else if (catFilter !== 'all') {
      list = list.filter(p => p.productType === catFilter && p.productState === 'Fresh');
    }

    if (this.showSeasonFilter() && seasonFilter !== 'all') {
      list = list.filter(p => p.season === seasonFilter);
    }

    return list;
  });

  ngOnInit(): void {
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products.set(products);
        this.isLoading.set(false);
      },
      error: () => {
        this.loadError.set('تعذر تحميل المنتجات، حاول مرة أخرى.');
        this.isLoading.set(false);
      },
    });
  }

  setFilter(filter: CategoryFilter): void {
    this.activeFilter.set(filter);
    this.activeSeason.set('all');
  }

  setSeason(season: SeasonFilter): void {
    this.activeSeason.set(season);
  }

  openProduct(product: ProductListItem): void {
    this.selectedProduct.set(product);
    this.activeImageIndex.set(0);
    if (this.isBrowser) document.body.style.overflow = 'hidden';
  }

  closeProduct(): void {
    this.selectedProduct.set(null);
    if (this.isBrowser) document.body.style.overflow = '';
  }

  setActiveImage(index: number): void {
    this.activeImageIndex.set(index);
  }

  imageUrl(relativePath: string): string {
    if (!relativePath) return '';
    if (relativePath.startsWith('http')) return relativePath;
    return `${this.apiBaseUrl}/${relativePath.replace(/^\//, '')}`;
  }

  hasImages(product: ProductListItem): boolean {
    return (product.imageUrls?.length ?? 0) > 0;
  }

  firstImage(product: ProductListItem): string {
    return this.hasImages(product) ? this.imageUrl(product.imageUrls![0]) : '';
  }

  seasonLabelKey(season: string): string {
    const map: Record<string, string> = {
      Summer: 'products_page.seasons.summer',
      Winter: 'products_page.seasons.winter',
      AllYear: 'products_page.seasons.all_year',
    };
    return map[season] ?? 'products_page.seasons.all_year';
  }

  categoryLabelKey(product: ProductListItem): string {
    if (product.productState === 'Frozen') return 'products_page.filters.frozen';
    if (product.productType === 'Fruit') return 'products_page.filters.fruits';
    return 'products_page.filters.vegetables';
  }

  categoryBadgeColor(product: ProductListItem): string {
    if (product.productState === 'Frozen') return 'bg-teal-700';
    if (product.productType === 'Fruit') return 'bg-orange-500';
    return 'bg-green-600';
  }

  encodeWhatsAppMessage(product: ProductListItem): string {
    const name = product.nameAr || product.name;
    return encodeURIComponent(`أهلاً، أرغب في الاستفسار عن تفاصيل وأسعار: ${name}`);
  }
}
