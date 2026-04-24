import { isPlatformBrowser } from '@angular/common';
import {
  Directive,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  booleanAttribute,
  inject,
  numberAttribute,
} from '@angular/core';

type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'zoom' | 'blur';

const DIRECTION_PROPS: Record<RevealDirection, Record<string, unknown>> = {
  up:    { y: 48, opacity: 0 },
  down:  { y: -48, opacity: 0 },
  left:  { x: 48, opacity: 0 },
  right: { x: -48, opacity: 0 },
  zoom:  { scale: 0.88, y: 16, opacity: 0 },
  blur:  { filter: 'blur(10px)', y: 16, opacity: 0 },
};

const DIRECTION_EASE: Record<RevealDirection, string> = {
  up:    'power3.out',
  down:  'power3.out',
  left:  'power3.out',
  right: 'power3.out',
  zoom:  'back.out(1.4)',
  blur:  'power2.out',
};

// Registered once across all directive instances — GSAP registers the plugin globally.
let gsapReady = false;

@Directive({
  selector: '[appScrollReveal]',
  standalone: true,
})
export class ScrollRevealDirective implements OnInit, OnDestroy {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly ngZone = inject(NgZone);
  private readonly platformId = inject(PLATFORM_ID);

  @Input({ alias: 'appScrollReveal' }) revealDirection: RevealDirection = 'up';
  @Input({ transform: numberAttribute }) revealDelay = 0;
  @Input({ transform: numberAttribute }) revealDuration = 900;
  @Input({ transform: booleanAttribute }) revealOnce = true;

  private destroyed = false;
  private cleanup: (() => void) | null = null;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const prefersReducedMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (prefersReducedMotion) return;

    this.ngZone.runOutsideAngular(() => {
      void this.initGsap();
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.cleanup?.();
    this.cleanup = null;
  }

  private async initGsap(): Promise<void> {
    let gsap: (typeof import('gsap'))['gsap'];
    let ScrollTrigger: (typeof import('gsap/ScrollTrigger'))['ScrollTrigger'];

    try {
      [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);
    } catch {
      return;
    }

    if (this.destroyed) return;

    // If the element is already in the viewport when GSAP loads (common with SSR +
    // slow bundle delivery in production), skip the entrance animation entirely.
    // Without this guard, gsap.from() snaps the element to y:48/opacity:0 while
    // overflow:hidden ancestors clip it — producing a permanent "half image" cut.
    const rect = this.el.nativeElement.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) return;

    if (!gsapReady) {
      gsap.registerPlugin(ScrollTrigger);
      gsapReady = true;
    }

    const direction = this.normalizeDirection(this.revealDirection);
    const fromVars = { ...DIRECTION_PROPS[direction] };
    const duration = Math.max(0.15, this.revealDuration / 1000);
    const delay = Math.max(0, this.revealDelay / 1000);

    const tween = gsap.from(this.el.nativeElement, {
      ...fromVars,
      duration,
      delay,
      ease: DIRECTION_EASE[direction],
      scrollTrigger: {
        trigger: this.el.nativeElement,
        start: 'top 88%',
        once: this.revealOnce,
        toggleActions: this.revealOnce
          ? 'play none none none'
          : 'play none none reverse',
      },
    });

    this.cleanup = () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }

  private normalizeDirection(value: string): RevealDirection {
    const supported: RevealDirection[] = ['up', 'down', 'left', 'right', 'zoom', 'blur'];
    return supported.includes(value as RevealDirection) ? (value as RevealDirection) : 'up';
  }
}
