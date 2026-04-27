import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { AdminPageComponent } from '../../layout/admin-page/admin-page.component';
import { AdminPageHeaderComponent } from '../../layout/admin-page-header/admin-page-header.component';
import { AdminSectionCardComponent } from '../../layout/admin-section-card/admin-section-card.component';
import { AdminEmptyStateComponent } from '../../layout/admin-empty-state/admin-empty-state.component';

@Component({
  selector: 'app-admin-settings-page',
  standalone: true,
  imports: [
    TranslocoPipe,
    AdminPageComponent,
    AdminPageHeaderComponent,
    AdminSectionCardComponent,
    AdminEmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <admin-page>
      <admin-page-header
        [title]="'admin.settings.title' | transloco"
        [subtitle]="'admin.settings.subtitle' | transloco"
      ></admin-page-header>

      <admin-section-card>
        <admin-empty-state
          icon="settings"
          [title]="'admin.placeholder.title' | transloco"
          [description]="'admin.placeholder.description' | transloco"
        ></admin-empty-state>
      </admin-section-card>
    </admin-page>
  `,
})
export class AdminSettingsPageComponent {}
