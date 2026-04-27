import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type AdminDataCardTrendDirection = 'up' | 'down' | 'flat';

export interface AdminDataCardTrend {
  value: string;
  direction: AdminDataCardTrendDirection;
  label?: string;
}

@Component({
  selector: 'admin-data-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="admin-data-card">
      <div class="admin-data-card__top">
        @if (icon) {
          <span class="admin-data-card__icon material-symbols-outlined">{{ icon }}</span>
        }
        <p class="admin-data-card__label">{{ label }}</p>
      </div>
      <div class="admin-data-card__value-row">
        <span class="admin-data-card__value">{{ value }}</span>
        @if (unit) {
          <span class="admin-data-card__unit">{{ unit }}</span>
        }
      </div>
      @if (trend) {
        <div class="admin-data-card__trend" [attr.data-direction]="trend.direction">
          <span class="material-symbols-outlined admin-data-card__trend-icon">
            {{ trend.direction === 'up' ? 'trending_up' : trend.direction === 'down' ? 'trending_down' : 'trending_flat' }}
          </span>
          <span class="admin-data-card__trend-value">{{ trend.value }}</span>
          @if (trend.label) {
            <span class="admin-data-card__trend-label">{{ trend.label }}</span>
          }
        </div>
      }
    </article>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .admin-data-card {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        background: var(--color-surface-card, #ffffff);
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: 1rem;
        padding: 1.25rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      }
      .admin-data-card__top {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .admin-data-card__icon {
        font-size: 1.25rem;
        color: var(--color-text-secondary, #64748b);
      }
      .admin-data-card__label {
        margin: 0;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--color-text-secondary, #64748b);
        font-weight: 600;
      }
      .admin-data-card__value-row {
        display: flex;
        align-items: baseline;
        gap: 0.375rem;
      }
      .admin-data-card__value {
        font-size: 2.25rem;
        font-weight: 800;
        line-height: 1;
        color: var(--color-text-primary, #0f172a);
        letter-spacing: -0.02em;
      }
      .admin-data-card__unit {
        font-size: 1.125rem;
        color: var(--color-text-secondary, #64748b);
        font-weight: 600;
      }
      .admin-data-card__trend {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.8125rem;
        font-weight: 600;
      }
      .admin-data-card__trend[data-direction='up']   { color: #16a34a; }
      .admin-data-card__trend[data-direction='down'] { color: #dc2626; }
      .admin-data-card__trend[data-direction='flat'] { color: #64748b; }
      .admin-data-card__trend-icon {
        font-size: 1rem;
      }
      .admin-data-card__trend-label {
        color: var(--color-text-secondary, #64748b);
        font-weight: 500;
      }
    `,
  ],
})
export class AdminDataCardComponent {
  @Input() icon?: string;
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: string | number;
  @Input() unit?: string;
  @Input() trend?: AdminDataCardTrend;
}
