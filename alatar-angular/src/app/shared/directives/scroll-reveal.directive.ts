import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  Directive,
  ElementRef,
  HostBinding,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  Renderer2,
  booleanAttribute,
  inject,
  numberAttribute,
} from '@angular/core';

type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'zoom' | 'blur';

@Directive({
  selector: '[appScrollReveal]',
  standalone: true,
})
export class ScrollRevealDirective implements OnInit, OnDestroy {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly ngZone = inject(NgZone);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);

  private observer: IntersectionObserver | null = null;
  private hasIntersected = false;

  @Input({ alias: 'appScrollReveal' }) revealDirection: RevealDirection = 'up';
  @Input({ transform: numberAttribute }) revealDelay = 0;
  @Input({ transform: numberAttribute }) revealDuration = 1180;
  @Input({ transform: numberAttribute }) revealDistance = 34;
  @Input({ transform: booleanAttribute }) revealOnce = true;
  @Input({ transform: numberAttribute }) revealThreshold = 0.1;
  @Input() revealRootMargin = '0px 0px -4% 0px';

  @HostBinding('class.reveal-item') readonly revealClass = true;
  @HostBinding('class.reveal-visible') visible = false;

  ngOnInit(): void {
    const element = this.elementRef.nativeElement;
    const direction = this.normalizeDirection(this.revealDirection);

    this.renderer.addClass(element, `reveal-${direction}`);
    this.setCssVar('--reveal-delay', `${Math.max(0, this.revealDelay)}ms`);
    this.setCssVar('--reveal-duration', `${Math.max(150, this.revealDuration)}ms`);
    this.applyDistance(direction, Math.max(8, this.revealDistance));

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.renderer.addClass(this.document.documentElement, 'reveal-ready');

    const prefersReducedMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    if (prefersReducedMotion || typeof window.IntersectionObserver === 'undefined') {
      this.visible = true;
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      this.observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.target !== element) {
              continue;
            }

            if (entry.isIntersecting) {
              this.ngZone.run(() => {
                this.visible = true;
                this.hasIntersected = true;
              });

              if (this.revealOnce && this.observer) {
                this.observer.unobserve(element);
              }
              continue;
            }

            if (!this.revealOnce && this.hasIntersected) {
              this.ngZone.run(() => {
                this.visible = false;
              });
            }
          }
        },
        {
          threshold: this.clampThreshold(this.revealThreshold),
          rootMargin: this.revealRootMargin,
        },
      );

      this.observer.observe(element);
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.observer = null;
  }

  private normalizeDirection(value: string): RevealDirection {
    const safeValue = (value ?? '').toLowerCase();
    const supported: RevealDirection[] = ['up', 'down', 'left', 'right', 'zoom', 'blur'];

    return supported.includes(safeValue as RevealDirection) ? (safeValue as RevealDirection) : 'up';
  }

  private applyDistance(direction: RevealDirection, distance: number): void {
    if (direction === 'left') {
      this.setCssVar('--reveal-translate-x', `${distance}px`);
      this.setCssVar('--reveal-translate-y', '0px');
      return;
    }

    if (direction === 'right') {
      this.setCssVar('--reveal-translate-x', `-${distance}px`);
      this.setCssVar('--reveal-translate-y', '0px');
      return;
    }

    if (direction === 'down') {
      this.setCssVar('--reveal-translate-y', `-${distance}px`);
      return;
    }

    if (direction === 'zoom') {
      this.setCssVar('--reveal-translate-y', `${Math.round(distance * 0.35)}px`);
      return;
    }

    this.setCssVar('--reveal-translate-y', `${distance}px`);
  }

  private setCssVar(name: string, value: string): void {
    this.renderer.setStyle(this.elementRef.nativeElement, name, value);
  }

  private clampThreshold(value: number): number {
    if (!Number.isFinite(value)) {
      return 0.16;
    }

    return Math.max(0, Math.min(1, value));
  }
}
