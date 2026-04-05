import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { TranslocoPipe } from '@jsverse/transloco';

type ProductFilter = 'all' | 'winter' | 'summer' | 'vegetables' | 'frozen';
type ProductBadge = 'summer' | 'vegetables' | 'winter' | 'frozen';

interface FilterOption {
  id: ProductFilter;
  labelKey: string;
  icon: string;
}

interface ProductCard {
  titleKey: string;
  seasonKey: string;
  image: string;
  images: string[];
  descriptionKey: string;
  badgeType: ProductBadge;
  categories: ProductFilter[];
}

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [CommonModule, NavbarComponent, TranslocoPipe],
  templateUrl: './products.page.html',
  styleUrl: './products.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPageComponent {
  readonly activeFilter = signal<ProductFilter>('all');
  readonly selectedProduct = signal<ProductCard | null>(null);
  readonly activeImageIndex = signal<number>(0);

  readonly filterOptions: FilterOption[] = [
    { id: 'all', labelKey: 'products_page.filters.all', icon: 'apps' },
    { id: 'winter', labelKey: 'products_page.filters.winter', icon: 'ac_unit' },
    { id: 'summer', labelKey: 'products_page.filters.summer', icon: 'sunny' },
    { id: 'vegetables', labelKey: 'products_page.filters.vegetables', icon: 'eco' },
    { id: 'frozen', labelKey: 'products_page.filters.frozen', icon: 'severe_cold' },
  ];

  readonly products: ProductCard[] = [
    {
      titleKey: 'products_page.items.pepper.title',
      seasonKey: 'products_page.items.pepper.season',
      image: 'assets/Images/1.jpeg',
      images: [
        'assets/Images/1.jpeg',
        'assets/Images/01.jpeg',
        'assets/Images/001.jpeg',
        'assets/Images/0001.jpeg',
      ],
      descriptionKey: 'products_page.items.pepper.desc',
      badgeType: 'summer',
      categories: ['summer'],
    },
    {
      titleKey: 'products_page.items.orange.title',
      seasonKey: 'products_page.items.orange.season',
      image: 'assets/Images/2.jpeg',
      images: [
        'assets/Images/2.jpeg',
        'assets/Images/02.jpeg',
        'assets/Images/002.jpeg',
        'assets/Images/0002.jpeg',
        'assets/Images/00002.jpeg',
        'assets/Images/000002.jpeg',
        'assets/Images/0000002.jpeg',
      ],
      descriptionKey: 'products_page.items.orange.desc',
      badgeType: 'winter',
      categories: ['winter'],
    },
    {
      titleKey: 'products_page.items.grape_black.title',
      seasonKey: 'products_page.items.grape_black.season',
      image: 'assets/Images/3.jpeg',
      images: ['assets/Images/3.jpeg', 'assets/Images/03.jpeg'],
      descriptionKey: 'products_page.items.grape_black.desc',
      badgeType: 'summer',
      categories: ['summer'],
    },
    {
      titleKey: 'products_page.items.mango.title',
      seasonKey: 'products_page.items.mango.season',
      image: 'assets/Images/4.jpeg',
      images: [
        'assets/Images/4.jpeg',
        'assets/Images/04.jpeg',
        'assets/Images/004.jpeg',
        'assets/Images/0004.jpeg',
        'assets/Images/00004.jpeg',
      ],
      descriptionKey: 'products_page.items.mango.desc',
      badgeType: 'summer',
      categories: ['summer'],
    },
    {
      titleKey: 'products_page.items.grape_red.title',
      seasonKey: 'products_page.items.grape_red.season',
      image: 'assets/Images/5.jpeg',
      images: ['assets/Images/5.jpeg', 'assets/Images/05.jpeg'],
      descriptionKey: 'products_page.items.grape_red.desc',
      badgeType: 'summer',
      categories: ['summer'],
    },
    {
      titleKey: 'products_page.items.strawberry.title',
      seasonKey: 'products_page.items.strawberry.season',
      image: 'assets/Images/7.jpeg',
      images: ['assets/Images/7.jpeg', 'assets/Images/07.jpeg'],
      descriptionKey: 'products_page.items.strawberry.desc',
      badgeType: 'winter',
      categories: ['winter'],
    },
    {
      titleKey: 'products_page.items.onion.title',
      seasonKey: 'products_page.items.onion.season',
      image: 'assets/Images/8.jpeg',
      images: ['assets/Images/8.jpeg'],
      descriptionKey: 'products_page.items.onion.desc',
      badgeType: 'vegetables',
      categories: ['vegetables'],
    },
    {
      titleKey: 'products_page.items.lemon.title',
      seasonKey: 'products_page.items.lemon.season',
      image: 'assets/Images/9.jpeg',
      images: [
        'assets/Images/9.jpeg',
        'assets/Images/09.jpeg',
        'assets/Images/009.jpeg',
        'assets/Images/0009.jpeg',
      ],
      descriptionKey: 'products_page.items.lemon.desc',
      badgeType: 'winter',
      categories: ['winter'],
    },
    {
      titleKey: 'products_page.items.mandarin.title',
      seasonKey: 'products_page.items.mandarin.season',
      image: 'assets/Images/10.jpeg',
      images: ['assets/Images/10.jpeg'],
      descriptionKey: 'products_page.items.mandarin.desc',
      badgeType: 'winter',
      categories: ['winter'],
    },
  ];

  readonly visibleProducts = computed(() => {
    const filter = this.activeFilter();
    return filter === 'all'
      ? this.products
      : this.products.filter((product) => product.categories.includes(filter));
  });

  setFilter(filter: ProductFilter): void {
    this.activeFilter.set(filter);
  }

  openProduct(product: ProductCard): void {
    this.selectedProduct.set(product);
    this.activeImageIndex.set(0);
    document.body.style.overflow = 'hidden';
  }

  closeProduct(): void {
    this.selectedProduct.set(null);
    document.body.style.overflow = '';
  }

  setActiveImage(index: number): void {
    this.activeImageIndex.set(index);
  }

  encodeWhatsAppMessage(product: ProductCard): string {
    // In a real app we'd map this properly or use TranslocoService for exact texts.
    // For now, retaining a basic fallback or we could use the key.
    return encodeURIComponent(`Hello, I'd like to inquire about ` + product.titleKey);
  }
}
