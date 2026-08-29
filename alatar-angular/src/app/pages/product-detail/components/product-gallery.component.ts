import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';

import { API_BASE_URL } from '../../../core/config/api-base-url.token';

@Component({
  selector: 'app-product-gallery',
  standalone: true,
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="relative w-full h-full min-h-[400px] lg:min-h-[500px] xl:min-h-[600px] bg-slate-100 overflow-hidden rounded-t-3xl lg:rounded-tr-none lg:rounded-s-3xl">
      @if (resolvedUrls().length === 0) {
        <div class="absolute inset-0 flex flex-col items-center justify-center text-slate-400" aria-hidden="true">
          <span class="material-symbols-outlined text-6xl mb-4">image</span>
          <span class="text-sm font-medium">No Image Available</span>
        </div>
      } @else if (resolvedUrls().length === 1) {
        <img
          class="absolute inset-0 w-full h-full object-cover"
          [src]="resolvedUrls()[0]"
          [alt]="productName + ' image 1'"
          loading="eager"
          decoding="async"
        />
      } @else {
        <swiper-container
          #swiperEl
          class="w-full h-full absolute inset-0"
          [attr.dir]="dir()"
          [attr.keyboard]="'true'"
          [attr.navigation]="'false'"
          [attr.loop]="'false'"
          [attr.slides-per-view]="'1'"
          (swiperslidechange)="onSlideChange($event)"
        >
          @for (url of resolvedUrls(); track $index) {
            <swiper-slide>
              <img
                class="w-full h-full object-cover"
                [src]="url"
                [alt]="productName + ' image ' + ($index + 1)"
                [attr.loading]="$index === 0 ? 'eager' : 'lazy'"
                decoding="async"
              />
            </swiper-slide>
          }
        </swiper-container>
        
        <!-- Navigation Buttons -->
        <button
          type="button"
          class="absolute top-1/2 -translate-y-1/2 left-4 w-12 h-12 rounded-full bg-white/90 text-slate-800 flex items-center justify-center shadow-lg hover:bg-white transition-all z-10 hover:scale-105"
          [attr.aria-label]="'products_v2.detail.gallery_prev' | transloco"
          (click)="prev()"
        >
          <span class="material-symbols-outlined text-2xl" [class.scale-x-[-1]]="dir() === 'rtl'">chevron_left</span>
        </button>
        <button
          type="button"
          class="absolute top-1/2 -translate-y-1/2 right-4 w-12 h-12 rounded-full bg-white/90 text-slate-800 flex items-center justify-center shadow-lg hover:bg-white transition-all z-10 hover:scale-105"
          [attr.aria-label]="'products_v2.detail.gallery_next' | transloco"
          (click)="next()"
        >
          <span class="material-symbols-outlined text-2xl" [class.scale-x-[-1]]="dir() === 'rtl'">chevron_right</span>
        </button>
        
        <!-- Counter Badge -->
        <div class="absolute bottom-4 right-4 px-4 py-1.5 bg-slate-900/70 backdrop-blur-sm text-white rounded-full text-sm font-bold shadow-lg z-10 tracking-widest" aria-live="polite">
          {{ activeIndex() + 1 }} / {{ resolvedUrls().length }}
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
export class ProductGalleryComponent implements AfterViewInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly transloco = inject(TranslocoService);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  @Input({ required: true }) imageUrls: string[] = [];
  @Input({ required: true }) productName = '';

  readonly swiperEl = viewChild<ElementRef<HTMLElement>>('swiperEl');
  readonly activeIndex = signal(0);

  private readonly activeLang = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });
  readonly dir = computed(() => ((this.activeLang() || 'ar') === 'ar' ? 'rtl' : 'ltr'));

  readonly resolvedUrls = computed(() =>
    this.imageUrls
      .filter((u) => !!u && u.trim().length > 0)
      .map((u) => this.resolveUrl(u)),
  );

  constructor() {
    effect(() => {
      const lang = this.activeLang();
      const el = this.swiperEl()?.nativeElement as unknown as
        | { swiper?: { changeLanguageDirection: (d: string) => void; update: () => void } }
        | undefined;
      if (el?.swiper) {
        el.swiper.changeLanguageDirection(lang === 'ar' ? 'rtl' : 'ltr');
        el.swiper.update();
      }
    });
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    void import('swiper/element/bundle').then(({ register }) => register());
  }

  prev(): void {
    const swiperInstance = (this.swiperEl()?.nativeElement as unknown as {
      swiper?: { slidePrev: () => void };
    } | undefined)?.swiper;
    swiperInstance?.slidePrev();
  }

  next(): void {
    const swiperInstance = (this.swiperEl()?.nativeElement as unknown as {
      swiper?: { slideNext: () => void };
    } | undefined)?.swiper;
    swiperInstance?.slideNext();
  }

  onSlideChange(event: Event): void {
    const detail = (event as CustomEvent).detail as Array<{ activeIndex?: number }> | undefined;
    const idx = detail?.[0]?.activeIndex;
    if (typeof idx === 'number') {
      this.activeIndex.set(idx);
    }
  }

  private resolveUrl(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${this.apiBaseUrl}/${url.replace(/^\//, '')}`;
  }
}
