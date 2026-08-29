import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  PLATFORM_ID,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { NavbarComponent } from '../../components/navbar/navbar.component';
import {
  getAvailableMonths,
  getCategoryAccent,
} from '../../core/products/season-calendar.utils';
import { ProductsStore } from '../../core/products/products.store';
import { SeasonCalendarComponent, SeasonCalendarRow } from './components/season-calendar.component';
import {
  SeasonCellPopoverComponent,
  SeasonCellSelection,
} from './components/season-cell-popover.component';

@Component({
  selector: 'app-seasons-page',
  standalone: true,
  imports: [
    NavbarComponent,
    TranslocoPipe,
    SeasonCalendarComponent,
    SeasonCellPopoverComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-navbar></app-navbar>
    <main class="seasons-page">

      <section class="seasons-hero">
        <div class="container">
          <p class="seasons-hero__kicker">
            {{ 'brand.name' | transloco }}
          </p>
          <h1 class="seasons-hero__title">
            {{ 'products_v2.seasons.page_title' | transloco }}
          </h1>
          <p class="seasons-hero__subtitle">
            {{ 'products_v2.seasons.page_subtitle' | transloco }}
          </p>
        </div>
      </section>

      <div class="seasons-page__body">
        <div class="container">
          @if (productsStore.isLoading() && rows().length === 0) {
            <p class="seasons-page__status" aria-live="polite">
              {{ 'product_detail.loading' | transloco }}
            </p>
          } @else if (productsStore.hasError()) {
            <p class="seasons-page__status" role="alert">
              {{ 'product_detail.load_error' | transloco }}
            </p>
          } @else if (rows().length === 0) {
            <p class="seasons-page__status">
              {{ 'products_v2.catalog.empty' | transloco }}
            </p>
          } @else {
            <app-season-calendar
              [rows]="rows()"
              (cellClicked)="onCellClicked($event)"
            ></app-season-calendar>
          }
        </div>
      </div>

      <app-season-cell-popover
        [cell]="activeCell()"
        (closed)="onPopoverClosed()"
      ></app-season-cell-popover>
    </main>
  `,
  styles: [
    `
      :host { display: block; }

      .container {
        width: 100%;
        max-width: 1400px;
        margin-inline: auto;
        padding-inline: 1rem;
      }
      @media (min-width: 768px)  { .container { padding-inline: 2rem; } }
      @media (min-width: 1280px) { .container { padding-inline: 3rem; } }

      .seasons-page {
        min-height: 100vh;
        background-color: #ffffff;
        color: #0f172a;
        padding-block-end: 5rem;
      }

      .seasons-hero {
        position: relative;
        padding-block-start: 10rem;
        padding-block-end: 5rem;
        background-color: #032b13; /* Fallback */
        background-image: linear-gradient(
          to bottom,
          rgba(3, 43, 19, 0.75) 0%,
          rgba(3, 43, 19, 0.85) 100%
        ), url('/assets/images/%D9%85%D8%B2%D8%A7%D8%B1%D8%B9%201.jpeg');
        background-size: cover;
        background-position: center;
        background-attachment: fixed;
        color: #ffffff;
      }

      .seasons-hero .container {
        position: relative;
        z-index: 2;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        align-items: center;
        text-align: center;
      }

      @media (min-width: 1024px) {
        .seasons-hero .container {
          align-items: flex-start;
          text-align: start;
          max-width: 800px;
        }
      }

      .seasons-hero__kicker {
        margin: 0;
        display: inline-flex;
        align-items: center;
        padding: 0.375rem 1rem;
        border-radius: 9999px;
        background-color: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        color: #e2e8f0;
        font-size: 0.8125rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .seasons-hero__title {
        margin: 0;
        font-size: clamp(2.5rem, 5vw, 4rem);
        font-weight: 800;
        line-height: 1.1;
        letter-spacing: -0.02em;
        color: #ffffff;
        text-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }

      .seasons-hero__subtitle {
        margin: 0;
        max-width: 44ch;
        font-size: 1.125rem;
        line-height: 1.6;
        color: rgba(255, 255, 255, 0.85);
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      .seasons-page__body {
        padding-block-start: 3rem;
      }

      .seasons-page__status {
        text-align: center;
        padding: 4rem 1rem;
        color: rgba(15, 23, 42, 0.65);
        font-size: 1rem;
      }
    `,
  ],
})
export class SeasonsPageComponent implements OnInit {
  protected readonly productsStore = inject(ProductsStore);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly currentMonth = signal<number | null>(null);

  readonly rows = computed<SeasonCalendarRow[]>(() => {
    const month = this.currentMonth();
    return this.productsStore
      .products()
      .filter((p) => p.status !== 'Invalid')
      .map<SeasonCalendarRow>((p) => ({
        product: {
          id: p.id,
          name: p.name,
          nameAr: p.nameAr,
          status: p.status,
          productType: p.productType,
          productState: p.productState,
          season: p.season,
          thumbnailUrl: pickThumbnail(p.imageUrls),
          isInSeasonNow:
            p.status === 'Valid' &&
            month !== null &&
            getAvailableMonths(p.season).includes(month),
          accentColor: getCategoryAccent(p.productType, p.productState),
        },
        availableMonths: getAvailableMonths(p.season),
      }));
  });

  readonly activeCell = signal<SeasonCellSelection | null>(null);

  constructor() {
    afterNextRender(() => {
      if (isPlatformBrowser(this.platformId)) {
        this.currentMonth.set(new Date().getMonth() + 1);
      }
    });
  }

  ngOnInit(): void {
    this.productsStore.ensureLoaded();
  }

  onCellClicked(selection: SeasonCellSelection): void {
    this.activeCell.set(selection);
  }

  onPopoverClosed(): void {
    this.activeCell.set(null);
  }
}

function pickThumbnail(urls: string[] | undefined): string | null {
  if (!urls) return null;
  for (const url of urls) {
    if (url && url.trim().length > 0) return url;
  }
  return null;
}
