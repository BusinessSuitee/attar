import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { AdminDataCardComponent } from '../../../layout/admin-data-card/admin-data-card.component';

export interface ContactsKpis {
  total: number;
  inProgress: number;
  contacted: number;
  saleConfirmed7d: number;
}

@Component({
  selector: 'app-contacts-kpi-strip',
  standalone: true,
  imports: [TranslocoPipe, AdminDataCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="contacts-kpi-strip">
      <admin-data-card
        icon="contact_phone"
        [label]="'admin.contacts.kpi.total' | transloco"
        [value]="kpis.total"
      ></admin-data-card>

      <admin-data-card
        icon="hourglass_top"
        [label]="'admin.contacts.kpi.in_progress' | transloco"
        [value]="kpis.inProgress"
        [trend]="
          kpis.inProgress > 0
            ? { value: 'admin.contacts.kpi.in_progress_hint' | transloco, direction: 'flat' }
            : undefined
        "
      ></admin-data-card>

      <admin-data-card
        icon="call_made"
        [label]="'admin.contacts.kpi.contacted' | transloco"
        [value]="kpis.contacted"
      ></admin-data-card>

      <admin-data-card
        icon="task_alt"
        [label]="'admin.contacts.kpi.sale_confirmed_7d' | transloco"
        [value]="kpis.saleConfirmed7d"
      ></admin-data-card>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .contacts-kpi-strip {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
      }
    `,
  ],
})
export class ContactsKpiStripComponent {
  @Input({ required: true }) kpis!: ContactsKpis;
}
