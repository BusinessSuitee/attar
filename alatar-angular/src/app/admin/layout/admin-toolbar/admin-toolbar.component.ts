import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'admin-toolbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="admin-toolbar">
      <ng-content></ng-content>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .admin-toolbar {
        display: flex;
        gap: 0.75rem;
        align-items: center;
        flex-wrap: wrap;
        padding: 0.75rem 1rem;
        background: var(--color-surface-card, #ffffff);
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: 0.75rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      }
    `,
  ],
})
export class AdminToolbarComponent {}
