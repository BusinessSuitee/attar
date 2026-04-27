import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'admin-page-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="admin-page-header">
      <div class="admin-page-header__text">
        <h1 class="admin-page-header__title">{{ title }}</h1>
        @if (subtitle) {
          <p class="admin-page-header__subtitle">{{ subtitle }}</p>
        }
      </div>
      <div class="admin-page-header__actions">
        <ng-content select="[slot=actions]"></ng-content>
      </div>
    </header>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .admin-page-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
      }
      .admin-page-header__text {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        min-width: 0;
      }
      .admin-page-header__title {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 800;
        line-height: 1.2;
        color: var(--color-text-primary, #0f172a);
      }
      .admin-page-header__subtitle {
        margin: 0;
        font-size: 0.875rem;
        color: var(--color-text-secondary, #64748b);
      }
      .admin-page-header__actions {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        flex-wrap: wrap;
      }
      .admin-page-header__actions:empty {
        display: none;
      }
    `,
  ],
})
export class AdminPageHeaderComponent {
  @Input({ required: true }) title!: string;
  @Input() subtitle?: string;
}
