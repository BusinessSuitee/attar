import { AdminNavGroupMeta, AdminSection } from './admin-nav.types';

export const ADMIN_NAV_GROUPS: AdminNavGroupMeta[] = [
  { id: 'main', labelKey: 'admin.nav.groups.main', order: 1 },
  { id: 'commerce', labelKey: 'admin.nav.groups.commerce', order: 2 },
  { id: 'system', labelKey: 'admin.nav.groups.system', order: 3 },
];

export const ADMIN_NAV: AdminSection[] = [
  {
    id: 'overview',
    path: 'overview',
    labelKey: 'admin.nav.overview',
    icon: 'dashboard',
    group: 'main',
    order: 1,
  },
  {
    id: 'products',
    path: 'products',
    labelKey: 'admin.nav.products',
    icon: 'inventory_2',
    group: 'commerce',
    order: 1,
  },
  {
    id: 'orders',
    path: 'orders',
    labelKey: 'admin.nav.orders',
    icon: 'receipt_long',
    group: 'commerce',
    order: 2,
  },
  {
    id: 'contacts',
    path: 'contacts',
    labelKey: 'admin.nav.contacts',
    icon: 'contact_phone',
    group: 'commerce',
    order: 3,
  },
  {
    id: 'social-links',
    path: 'social',
    labelKey: 'admin.nav.social_links',
    icon: 'share',
    group: 'system',
    order: 1,
  },
  {
    id: 'settings',
    path: 'settings',
    labelKey: 'admin.nav.settings',
    icon: 'settings',
    group: 'system',
    order: 2,
  },
];
