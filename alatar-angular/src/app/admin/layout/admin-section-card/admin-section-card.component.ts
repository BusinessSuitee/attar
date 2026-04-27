import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'admin-section-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="admin-section-card">
      @if (title || description) {
        <header class="admin-section-card__header">
          @if (title) {
            <h2 class="admin-section-card__title">{{ title }}</h2>
          }
          @if (description) {
            <p class="admin-section-card__description">{{ description }}</p>
          }
        </header>
      }
      <div class="admin-section-card__body">
        <ng-content></ng-content>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .admin-section-card {
        display: flex;
        flex-direction: column;
        background: var(--color-surface-card, #ffffff);
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: 1rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        overflow: hidden;
      }
      .admin-section-card__header {
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid var(--color-border, #e2e8f0);
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .admin-section-card__title {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 700;
        color: var(--color-text-primary, #0f172a);
      }
      .admin-section-card__description {
        margin: 0;
        font-size: 0.875rem;
        color: var(--color-text-secondary, #64748b);
      }
      .admin-section-card__body {
        padding: 1.5rem;
      }
    `,
  ],
})
export class AdminSectionCardComponent {
  @Input() title?: string;
  @Input() description?: string;
}
