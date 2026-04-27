import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  { path: '', redirectTo: 'overview', pathMatch: 'full' },
  {
    path: 'overview',
    loadComponent: () =>
      import('./sections/overview/overview.page').then((m) => m.AdminOverviewPageComponent),
    data: { sectionId: 'overview', titleKey: 'admin.nav.overview' },
  },
  {
    path: 'products',
    loadComponent: () =>
      import('./sections/products/products.page').then((m) => m.AdminProductsPageComponent),
    data: { sectionId: 'products', titleKey: 'admin.nav.products' },
  },
  {
    path: 'orders',
    loadComponent: () =>
      import('./sections/orders/orders.page').then((m) => m.AdminOrdersPageComponent),
    data: { sectionId: 'orders', titleKey: 'admin.nav.orders' },
  },
  {
    path: 'contacts',
    loadComponent: () =>
      import('./sections/contacts/contacts.page').then((m) => m.AdminContactsPageComponent),
    data: { sectionId: 'contacts', titleKey: 'admin.nav.contacts' },
  },
  {
    path: 'social',
    loadComponent: () =>
      import('./sections/social-links/social-links.page').then(
        (m) => m.AdminSocialLinksPageComponent,
      ),
    data: { sectionId: 'social-links', titleKey: 'admin.nav.social_links' },
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./sections/settings/settings.page').then((m) => m.AdminSettingsPageComponent),
    data: { sectionId: 'settings', titleKey: 'admin.nav.settings' },
  },
];
