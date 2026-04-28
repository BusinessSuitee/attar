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
    path: 'products/:id',
    loadComponent: () =>
      import('./pages/product-detail/product-detail.page').then(
        (module) => module.ProductDetailPageComponent,
      ),
  },
  {
    path: 'seasons',
    loadComponent: () =>
      import('./pages/seasons/seasons.page').then((module) => module.SeasonsPageComponent),
    title: 'Season Calendar — Alatar Sons',
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
      import('./admin/shell/admin-shell.component').then((m) => m.AdminShellComponent),
    loadChildren: () => import('./admin/admin.routes').then((m) => m.adminRoutes),
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
