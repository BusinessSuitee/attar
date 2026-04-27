import { ChangeDetectionStrategy, Component, Input, inject, signal } from '@angular/core';
import { API_BASE_URL } from '../../core/config/api-base-url.token';

@Component({
  selector: 'ui-image',
  standalone: true,
  template: `
    <span
      class="block overflow-hidden bg-slate-100"
      [style.aspectRatio]="aspectRatio"
      [style.borderRadius]="radius"
    >
      @if (resolvedSrc() && !errored()) {
        <img
          [src]="resolvedSrc()"
          [alt]="alt"
          loading="lazy"
          decoding="async"
          class="block h-full w-full object-cover"
          (error)="onError()"
        />
      } @else {
        <span
          class="flex h-full w-full items-center justify-center text-slate-300"
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" class="size-10" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        </span>
      }
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'data-slot': 'image' },
})
export class ImageWithFallbackComponent {
  private readonly apiBaseUrl = inject(API_BASE_URL);

  readonly errored = signal(false);

  @Input() src: string | null | undefined = null;
  @Input() alt = '';
  @Input() aspectRatio = '4 / 3';
  @Input() radius = '0';

  resolvedSrc(): string {
    const raw = (this.src ?? '').trim();
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw) || raw.startsWith('data:')) return raw;
    return `${this.apiBaseUrl.replace(/\/$/, '')}/${raw.replace(/^\//, '')}`;
  }

  onError(): void {
    this.errored.set(true);
  }
}
