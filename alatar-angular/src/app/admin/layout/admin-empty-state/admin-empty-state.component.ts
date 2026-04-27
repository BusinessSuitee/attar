import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'admin-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="admin-empty-state">
      @if (icon) {
        <span class="admin-empty-state__icon material-symbols-outlined">{{ icon }}</span>
      }
      <h3 class="admin-empty-state__title">{{ title }}</h3>
      @if (description) {
        <p class="admin-empty-state__description">{{ description }}</p>
      }
      <div class="admin-empty-state__action">
        <ng-content select="[slot=action]"></ng-content>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .admin-empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        text-align: center;
        padding: 3rem 1.5rem;
      }
      .admin-empty-state__icon {
        font-size: 3rem;
        color: var(--color-text-tertiary, #94a3b8);
        margin-bottom: 0.5rem;
      }
      .admin-empty-state__title {
        margin: 0;
        font-size: 1rem;
        font-weight: 700;
        color: var(--color-text-primary, #0f172a);
      }
      .admin-empty-state__description {
        margin: 0;
        font-size: 0.875rem;
        color: var(--color-text-secondary, #64748b);
        max-width: 28rem;
      }
      .admin-empty-state__action:empty {
        display: none;
      }
      .admin-empty-state__action {
        margin-top: 0.75rem;
      }
    `,
  ],
})
export class AdminEmptyStateComponent {
  @Input() icon?: string;
  @Input({ required: true }) title!: string;
  @Input() description?: string;
}
