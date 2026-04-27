import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { AdminBreadcrumbsComponent } from '../admin-breadcrumbs/admin-breadcrumbs.component';
import { AdminUserMenuComponent } from '../admin-user-menu/admin-user-menu.component';

@Component({
  selector: 'app-admin-topbar',
  standalone: true,
  imports: [CommonModule, TranslocoPipe, AdminBreadcrumbsComponent, AdminUserMenuComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-topbar.component.html',
  styleUrl: './admin-topbar.component.css',
})
export class AdminTopbarComponent {
  @Output() toggleSidebar = new EventEmitter<void>();

  onToggleClick(): void {
    this.toggleSidebar.emit();
  }
}
