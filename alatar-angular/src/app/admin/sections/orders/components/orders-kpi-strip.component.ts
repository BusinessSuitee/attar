import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { AdminDataCardComponent } from '../../../layout/admin-data-card/admin-data-card.component';

export interface OrdersKpis {
  total: number;
  newCount: number;
  inProgress: number;
  confirmed7d: number;
}

@Component({
  selector: 'app-orders-kpi-strip',
  standalone: true,
  imports: [TranslocoPipe, AdminDataCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="orders-kpi-strip">
      <admin-data-card
        icon="receipt_long"
        [label]="'admin.orders.kpi.total' | transloco"
        [value]="kpis.total"
      ></admin-data-card>

      <admin-data-card
        icon="mark_email_unread"
        [label]="'admin.orders.kpi.new' | transloco"
        [value]="kpis.newCount"
        [trend]="
          kpis.newCount > 0
            ? { value: 'admin.orders.kpi.new_hint' | transloco, direction: 'flat' }
            : undefined
        "
      ></admin-data-card>

      <admin-data-card
        icon="pending_actions"
        [label]="'admin.orders.kpi.in_progress' | transloco"
        [value]="kpis.inProgress"
      ></admin-data-card>

      <admin-data-card
        icon="task_alt"
        [label]="'admin.orders.kpi.confirmed_7d' | transloco"
        [value]="kpis.confirmed7d"
      ></admin-data-card>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .orders-kpi-strip {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
      }
    `,
  ],
})
export class OrdersKpiStripComponent {
  @Input({ required: true }) kpis!: OrdersKpis;
}
