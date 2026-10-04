import { isPlatformBrowser } from '@angular/common';
import {
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  booleanAttribute,
  inject,
  numberAttribute,
} from '@angular/core';

type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'zoom' | 'blur';

const OFFSETS: Record<RevealDirection, string> = {
  up: 'translate3d(0, 48px, 0)',
  down: 'translate3d(0, -48px, 0)',
  left: 'translate3d(48px, 0, 0)',
  right: 'translate3d(-48px, 0, 0)',
  zoom: 'translate3d(0, 16px, 0) scale(.88)',
  blur: 'translate3d(0, 16px, 0)',
};

@Directive({
  selector: '[appScrollReveal]',
  standalone: true,
})
export class ScrollRevealDirective implements OnInit, OnDestroy {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);

  @Input({ alias: 'appScrollReveal' }) revealDirection: RevealDirection = 'up';
  @Input({ transform: numberAttribute }) revealDelay = 0;
  @Input({ transform: numberAttribute }) revealDuration = 900;
  @Input({ transform: booleanAttribute }) revealOnce = true;

  private observer?: IntersectionObserver;
  private animation?: Animation;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    // Keep above-the-fold content visible immediately. Below-the-fold elements use
    // the browser's native IntersectionObserver + Web Animations APIs, avoiding a
    // 40KB animation library on the critical loading path.
    const rect = this.el.nativeElement.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) return;
    if (!('IntersectionObserver' in window)) return;

    const direction = this.normalizeDirection(this.revealDirection);
    const startTransform = OFFSETS[direction];
    const startFilter = direction === 'blur' ? 'blur(10px)' : 'none';
    const element = this.el.nativeElement;
    element.style.opacity = '0';
    element.style.transform = startTransform;
    if (startFilter !== 'none') element.style.filter = startFilter;

    this.observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        this.animation = element.animate(
          [
            { opacity: 0, transform: startTransform, filter: startFilter },
            { opacity: 1, transform: 'none', filter: 'none' },
          ],
          {
            duration: Math.max(150, this.revealDuration),
            delay: Math.max(0, this.revealDelay),
            easing: direction === 'zoom' ? 'cubic-bezier(.34,1.56,.64,1)' : 'cubic-bezier(.22,1,.36,1)',
            fill: 'both',
          },
        );
        if (this.revealOnce) this.observer?.unobserve(element);
        break;
      }
    }, { rootMargin: '0px 0px -12% 0px' });
    this.observer.observe(element);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.animation?.cancel();
  }

  private normalizeDirection(value: string): RevealDirection {
    return (['up', 'down', 'left', 'right', 'zoom', 'blur'] as RevealDirection[]).includes(value as RevealDirection)
      ? (value as RevealDirection)
      : 'up';
  }
}
