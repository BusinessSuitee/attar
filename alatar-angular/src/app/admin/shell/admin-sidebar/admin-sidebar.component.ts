import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { ADMIN_NAV, ADMIN_NAV_GROUPS } from '../../navigation/admin-nav.config';
import { AdminNavGroup, AdminSection } from '../../navigation/admin-nav.types';
import { AdminSidebarState } from '../admin-shell.component';

interface SidebarGroup {
  id: AdminNavGroup;
  labelKey: string;
  order: number;
  items: AdminSection[];
}

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.css',
})
export class AdminSidebarComponent {
  @Input({ required: true }) state!: AdminSidebarState;
  @Output() navigate = new EventEmitter<AdminSection>();

  readonly groups = computed<SidebarGroup[]>(() => {
    const itemsByGroup = new Map<AdminNavGroup, AdminSection[]>();
    for (const section of ADMIN_NAV) {
      const list = itemsByGroup.get(section.group) ?? [];
      list.push(section);
      itemsByGroup.set(section.group, list);
    }
    return ADMIN_NAV_GROUPS
      .slice()
      .sort((a, b) => a.order - b.order)
      .map<SidebarGroup>((g) => ({
        id: g.id,
        labelKey: g.labelKey,
        order: g.order,
        items: (itemsByGroup.get(g.id) ?? []).slice().sort((a, b) => a.order - b.order),
      }))
      .filter((g) => g.items.length > 0);
  });

  get isCollapsed(): boolean {
    return this.state === 'collapsed';
  }

  trackGroup = (_: number, item: SidebarGroup) => item.id;
  trackSection = (_: number, item: AdminSection) => item.id;

  onItemClick(section: AdminSection): void {
    this.navigate.emit(section);
  }
}
