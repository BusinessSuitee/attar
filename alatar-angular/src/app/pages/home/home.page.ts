import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  AfterViewInit,
  computed,
  inject,
} from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { HeroComponent } from '../../components/hero/hero.component';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { TranslocoModule } from '@jsverse/transloco';
import { ScrollRevealDirective } from '../../shared/directives/scroll-reveal.directive';
import { ProductsStore } from '../../core/products/products.store';
import { ProductListItem } from '../../core/products/product.service';
import { API_BASE_URL } from '../../core/config/api-base-url.token';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [NavbarComponent, HeroComponent, TranslocoModule, RouterLink, ScrollRevealDirective],
  templateUrl: './home.page.html',
  styleUrls: [
    './home.page.css',
    './home.founder.css',
    './home.partners.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent implements OnInit, AfterViewInit {
  private readonly productsStore = inject(ProductsStore);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly isLoading = this.productsStore.isLoading;

  readonly featuredProducts = computed<ProductListItem[]>(() => {
    const products = this.productsStore.products();
    if (!products || products.length === 0) return [];
    
    // Try to get diverse products (one vegetable, one fruit)
    const veg = products.find(p => p.productType === 'Vegetable' && p.status !== 'Invalid');
    const fruit = products.find(p => p.productType === 'Fruit' && p.status !== 'Invalid');
    
    const selected = new Set<ProductListItem>();
    if (veg) selected.add(veg);
    if (fruit) selected.add(fruit);
    
    // Fill up to 3 if we didn't find diverse ones
    for (const p of products) {
      if (selected.size >= 3) break;
      if (p.status !== 'Invalid') selected.add(p);
    }
    
    return Array.from(selected);
  });

  ngOnInit() {
    this.productsStore.ensureLoaded();
  }

  ngAfterViewInit(): void {
    this.scrollToFragment(this.router.parseUrl(this.router.url).fragment);

    this.route.fragment.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((fragment) => {
      this.scrollToFragment(fragment);
    });

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.scrollToFragment(this.router.parseUrl(this.router.url).fragment));
  }

  private scrollToFragment(fragment: string | null): void {
    if (!fragment || typeof document === 'undefined') return;

    setTimeout(() => {
      document.getElementById(fragment)?.scrollIntoView({ block: 'start' });
    }, 120);
  }

  isComingSoon(product: ProductListItem): boolean {
    return product.status === 'ComingSoon';
  }

  hasImages(product: ProductListItem): boolean {
    return !!product.imageUrls && product.imageUrls.length > 0;
  }

  firstImage(product: ProductListItem): string {
    const url = product.imageUrls?.[0] || '';
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${this.apiBaseUrl}/${url.replace(/^\//, '')}`;
  }

  displayPrimaryName(product: ProductListItem): string {
    // We could use transloco's activeLang here, but let's just do Arabic preferred if available
    return product.nameAr || product.name;
  }

  displayPrimaryDescription(product: ProductListItem): string {
    return product.descriptionAr || product.descriptionEn || '';
  }

  categoryLabelKey(product: ProductListItem): string {
    if (product.status === 'ComingSoon') return 'products_page.filters.coming_soon';
    if (product.productType === 'Vegetable') return 'products_page.filters.vegetables';
    return 'products_page.filters.fruits';
  }

  seasonLabelKey(season: string): string {
    switch (season) {
      case 'Summer': return 'products_page.seasons.summer';
      case 'Winter': return 'products_page.seasons.winter';
      case 'AllYear': return 'products_page.seasons.all_year';
      default: return 'products_page.seasons.all_year';
    }
  }
}
