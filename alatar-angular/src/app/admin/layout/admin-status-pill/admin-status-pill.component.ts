import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type AdminStatusTone =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral';

@Component({
  selector: 'admin-status-pill',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="admin-status-pill" [attr.data-tone]="tone">
      @if (icon) {
        <span class="admin-status-pill__icon material-symbols-outlined">{{ icon }}</span>
      }
      {{ label }}
    </span>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
      }
      .admin-status-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.125rem 0.625rem;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 700;
        border: 1px solid currentColor;
        line-height: 1.4;
        white-space: nowrap;
      }
      .admin-status-pill__icon {
        font-size: 0.875rem;
      }
      .admin-status-pill[data-tone='success']  { color: #166534; background: #dcfce7; }
      .admin-status-pill[data-tone='warning']  { color: #b45309; background: #fef3c7; }
      .admin-status-pill[data-tone='danger']   { color: #b91c1c; background: #fee2e2; }
      .admin-status-pill[data-tone='info']     { color: #1d4ed8; background: #dbeafe; }
      .admin-status-pill[data-tone='neutral']  { color: #475569; background: #f1f5f9; }
    `,
  ],
})
export class AdminStatusPillComponent {
  @Input({ required: true }) label!: string;
  @Input() tone: AdminStatusTone = 'neutral';
  @Input() icon?: string;
}
