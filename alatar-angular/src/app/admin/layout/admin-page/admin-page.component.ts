import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'admin-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="admin-page">
      <ng-content></ng-content>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .admin-page {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        max-width: 88rem;
        margin: 0 auto;
        padding: 1.5rem;
        width: 100%;
      }
      @media (max-width: 767px) {
        .admin-page {
          padding: 1rem;
          gap: 1.25rem;
        }
      }
    `,
  ],
})
export class AdminPageComponent {}
