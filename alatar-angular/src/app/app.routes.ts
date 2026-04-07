import { Routes } from '@angular/router';
import { adminAuthGuard } from './core/auth/admin-auth.guard';
import { guestOnlyGuard } from './core/auth/guest-only.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home.page').then((module) => module.HomePageComponent),
  },
  {
    path: 'about',
    loadComponent: () =>
      import('./pages/about/about.page').then((module) => module.AboutPageComponent),
  },
  {
    path: 'partners',
    loadComponent: () =>
      import('./pages/partners/partners.page').then((module) => module.PartnersPageComponent),
  },
  {
    path: 'stations',
    loadComponent: () =>
      import('./pages/stations/stations.page').then((module) => module.StationsPageComponent),
  },
  {
    path: 'products',
    loadComponent: () =>
      import('./pages/products/products.page').then((module) => module.ProductsPageComponent),
  },
  {
    path: 'certificates',
    loadComponent: () =>
      import('./pages/certificates/certificates.page').then(
        (module) => module.CertificatesPageComponent,
      ),
  },
  {
    path: 'gallery',
    loadComponent: () =>
      import('./pages/gallery/gallery.page').then((module) => module.GalleryPageComponent),
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./pages/contact/contact.page').then((module) => module.ContactPageComponent),
  },
  {
    path: 'contacts',
    redirectTo: 'contact',
    pathMatch: 'full',
  },
  {
    path: 'admin/login',
    canActivate: [guestOnlyGuard],
    loadComponent: () =>
      import('./pages/admin-login/admin-login.page').then(
        (module) => module.AdminLoginPageComponent,
      ),
  },
  {
    path: 'admin',
    canActivate: [adminAuthGuard],
    loadComponent: () =>
      import('./pages/admin-dashboard/admin-dashboard.page').then(
        (module) => module.AdminDashboardPageComponent,
      ),
  },
  {
    path: 'admin/contacts',
    canActivate: [adminAuthGuard],
    loadComponent: () =>
      import('./pages/admin-dashboard/admin-dashboard.page').then(
        (module) => module.AdminDashboardPageComponent,
      ),
  },
  {
    path: 'admin/orders',
    canActivate: [adminAuthGuard],
    loadComponent: () =>
      import('./pages/admin-dashboard/admin-dashboard.page').then(
        (module) => module.AdminDashboardPageComponent,
      ),
  },
  {
    path: 'admin/products',
    canActivate: [adminAuthGuard],
    loadComponent: () =>
      import('./pages/admin-dashboard/admin-dashboard.page').then(
        (module) => module.AdminDashboardPageComponent,
      ),
  },
  {
    path: 'admin/settings',
    canActivate: [adminAuthGuard],
    loadComponent: () =>
      import('./pages/admin-dashboard/admin-dashboard.page').then(
        (module) => module.AdminDashboardPageComponent,
      ),
  },
  {
    path: 'admin/contact',
    redirectTo: 'admin/contacts',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
