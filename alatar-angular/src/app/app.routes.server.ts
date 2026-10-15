import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'gallery', renderMode: RenderMode.Server },
  { path: 'stations', renderMode: RenderMode.Server },
  {
    path: 'products',
    renderMode: RenderMode.Server,
  },
  {
    path: 'products/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'admin',
    renderMode: RenderMode.Server,
  },
  {
    path: 'admin/**',
    renderMode: RenderMode.Server,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
