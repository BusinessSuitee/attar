import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type AdminSkeletonVariant = 'line' | 'card' | 'circle';

@Component({
  selector: 'admin-loading-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="admin-skeleton-group">
      @for (_ of slots; track $index) {
        <div class="admin-skeleton" [attr.data-variant]="variant"></div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .admin-skeleton-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .admin-skeleton {
        background: linear-gradient(
          90deg,
          rgba(226, 232, 240, 0.5) 0%,
          rgba(226, 232, 240, 0.9) 50%,
          rgba(226, 232, 240, 0.5) 100%
        );
        background-size: 200% 100%;
        animation: admin-skeleton-shimmer 1.4s ease-in-out infinite;
        border-radius: 0.5rem;
      }
      .admin-skeleton[data-variant='line'] {
        height: 0.875rem;
      }
      .admin-skeleton[data-variant='card'] {
        height: 6rem;
        border-radius: 1rem;
      }
      .admin-skeleton[data-variant='circle'] {
        height: 2.5rem;
        width: 2.5rem;
        border-radius: 50%;
      }
      @keyframes admin-skeleton-shimmer {
        0%   { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      @media (prefers-reduced-motion: reduce) {
        .admin-skeleton {
          animation: none;
        }
      }
    `,
  ],
})
export class AdminLoadingSkeletonComponent {
  @Input() variant: AdminSkeletonVariant = 'line';
  @Input() count = 3;

  get slots(): readonly null[] {
    return Array.from({ length: Math.max(0, this.count) }, () => null);
  }
}
