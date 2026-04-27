import { Signal } from '@angular/core';

export type AdminNavGroup = 'main' | 'commerce' | 'system';

export interface AdminSection {
  id: string;
  path: string;
  labelKey: string;
  icon: string;
  group: AdminNavGroup;
  order: number;
  badge?: () => Signal<number | null>;
  children?: AdminSection[];
}

export interface AdminNavGroupMeta {
  id: AdminNavGroup;
  labelKey: string;
  order: number;
}
