import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';

interface TextChunk {
  content: string;
  isSpace: boolean;
  index: number;
}

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [TranslocoModule, CommonModule, RouterModule],
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class HeroComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly transloco = inject(TranslocoService);

  readonly autoplayDelay = 5500;
  readonly transitionSpeed = 800;

  readonly swiperEl = viewChild<ElementRef<HTMLElement>>('swiperEl');

  private readonly activeLang = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });
  readonly dir = computed(() => (this.activeLang() === 'ar' ? 'rtl' : 'ltr'));

  readonly langSwitching = signal(false);
  private langSwitchTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    let isFirst = true;
    effect(() => {
      const lang = this.activeLang();
      if (isFirst) { isFirst = false; return; }

      this.langSwitching.set(true);

      const swiper = (this.swiperEl()?.nativeElement as unknown as { swiper?: { changeLanguageDirection: (d: string) => void; update: () => void } })?.swiper;
      if (swiper) {
        swiper.changeLanguageDirection(lang === 'ar' ? 'rtl' : 'ltr');
        swiper.update();
      }

      if (this.langSwitchTimeout) clearTimeout(this.langSwitchTimeout);
      this.langSwitchTimeout = setTimeout(() => this.langSwitching.set(false), 500);
    });
  }

  ngOnDestroy(): void {
    if (this.langSwitchTimeout) clearTimeout(this.langSwitchTimeo
  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

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

  /**
   * Splits text for per-char animation. Arabic splits by word to preserve
   * cursive glyph shaping (isolating chars would break the word visually).
   * Latin scripts split by character for the classic typewriter effect.
   */
  splitChars(text: string | null | undefined): TextChunk[] {
    if (!text) {
      return [];
    }

    const hasArabic = /[؀-ۿ]/.test(text);
    if (hasArabic) {
      const parts = text.split(/(\s+)/).filter((p) => p.length > 0);
      let idx = 0;
      return parts.map<TextChunk>((p) => {
        const isSpace = /^\s+$/.test(p);
        return {
          content: p.replace(/\s/g, ' '),
          isSpace,
          index: isSpace ? -1 : idx++,
        };
      });
    }

    let idx = 0;
    return Array.from(text).map<TextChunk>((c) => {
      const isSpace = c === ' ';
      return {
        content: isSpace ? ' ' : c,
        isSpace,
        index: isSpace ? -1 : idx++,
      };
    });
  }
}

