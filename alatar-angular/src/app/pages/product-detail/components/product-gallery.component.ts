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
    <div class="gallery">
      @if (resolvedUrls().length === 0) {
        <div class="gallery__placeholder" aria-hidden="true">
          <span class="material-symbols-outlined">image</span>
        </div>
      } @else if (resolvedUrls().length === 1) {
        <img
          class="gallery__single"
          [src]="resolvedUrls()[0]"
          [alt]="productName + ' image 1'"
          loading="eager"
          decoding="async"
        />
      } @else {
        <swiper-container
          #swiperEl
          class="gallery__swiper"
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
                class="gallery__img"
                [src]="url"
                [alt]="productName + ' image ' + ($index + 1)"
                [attr.loading]="$index === 0 ? 'eager' : 'lazy'"
                decoding="async"
              />
            </swiper-slide>
          }
        </swiper-container>
        <button
          type="button"
          class="gallery__nav gallery__nav--prev"
          [attr.aria-label]="'products_v2.detail.gallery_prev' | transloco"
          (click)="prev()"
        >
          <span class="material-symbols-outlined">chevron_left</span>
        </button>
        <button
          type="button"
          class="gallery__nav gallery__nav--next"
          [attr.aria-label]="'products_v2.detail.gallery_next' | transloco"
          (click)="next()"
        >
          <span class="material-symbols-outlined">chevron_right</span>
        </button>
        <div class="gallery__counter" aria-live="polite">
          {{ activeIndex() + 1 }} / {{ resolvedUrls().length }}
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .gallery {
        position: relative;
        width: 100%;
        aspect-ratio: 4 / 5;
        background-color: #f8fafc;
        overflow: hidden;
        border-radius: 1rem;
      }
      @media (min-width: 768px) {
        .gallery {
          aspect-ratio: unset;
          border-radius: 0;
          width: 100%;
          min-height: 520px;
          max-height: min(720px, 82vh);
        }
      }
      .gallery__swiper {
        width: 100%;
        height: 100%;
        display: block;
      }
      .gallery__single,
      .gallery__img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .gallery__placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        color: rgba(100, 116, 139, 0.5);
      }
      .gallery__placeholder .material-symbols-outlined {
        font-size: 6rem;
      }
      .gallery__nav {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 44px;
        height: 44px;
        border-radius: 9999px;
        background-color: rgba(255, 255, 255, 0.92);
        color: #0f172a;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.12);
        transition: background-color 150ms ease;
        z-index: 2;
      }
      .gallery__nav:hover {
        background-color: #ffffff;
      }
      .gallery__nav:focus-visible {
        outline: 2px solid #0fbd66;
        outline-offset: 2px;
      }
      .gallery__nav--prev {
        inset-inline-start: 0.75rem;
      }
      .gallery__nav--next {
        inset-inline-end: 0.75rem;
      }
      .gallery__nav .material-symbols-outlined {
        font-size: 1.5rem;
      }
      [dir='rtl'] .gallery__nav--prev .material-symbols-outlined {
        transform: scaleX(-1);
      }
      [dir='rtl'] .gallery__nav--next .material-symbols-outlined {
        transform: scaleX(-1);
      }
      .gallery__counter {
        position: absolute;
        inset-block-end: 0.75rem;
        inset-inline-end: 0.75rem;
        padding: 0.25rem 0.625rem;
        background-color: rgba(15, 23, 42, 0.7);
        color: #ffffff;
        border-radius: 9999px;
        font-size: 0.8125rem;
        font-weight: 600;
        z-index: 2;
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
