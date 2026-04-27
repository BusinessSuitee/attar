import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ActivatedRoute,
  ActivatedRouteSnapshot,
  NavigationEnd,
  Router,
  RouterLink,
} from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { filter } from 'rxjs';

interface Crumb {
  labelKey?: string;
  label?: string;
  link: string | null;
}

@Component({
  selector: 'app-admin-breadcrumbs',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="admin-breadcrumbs" aria-label="Breadcrumbs">
      <ol class="admin-breadcrumbs__list">
        @for (crumb of crumbs(); track $index; let last = $last) {
          <li class="admin-breadcrumbs__item">
            @if (crumb.link && !last) {
              <a [routerLink]="crumb.link" class="admin-breadcrumbs__link">
                @if (crumb.labelKey) {
                  {{ crumb.labelKey | transloco }}
                } @else {
                  {{ crumb.label }}
                }
              </a>
            } @else {
              <span class="admin-breadcrumbs__current" [attr.aria-current]="last ? 'page' : null">
                @if (crumb.labelKey) {
                  {{ crumb.labelKey | transloco }}
                } @else {
                  {{ crumb.label }}
                }
              </span>
            }
            @if (!last) {
              <span class="admin-breadcrumbs__sep" aria-hidden="true">›</span>
            }
          </li>
        }
      </ol>
    </nav>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .admin-breadcrumbs__list {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        list-style: none;
        margin: 0;
        padding: 0;
        font-size: 0.875rem;
        flex-wrap: wrap;
      }
      .admin-breadcrumbs__item {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
      }
      .admin-breadcrumbs__link {
        color: #64748b;
        text-decoration: none;
        font-weight: 500;
        transition: color 120ms ease;
      }
      .admin-breadcrumbs__link:hover {
        color: #0f172a;
      }
      .admin-breadcrumbs__current {
        color: #0f172a;
        font-weight: 700;
      }
      .admin-breadcrumbs__sep {
        color: #cbd5e1;
        font-weight: 600;
      }
    `,
  ],
})
export class AdminBreadcrumbsComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly crumbs = signal<Crumb[]>([]);

  constructor() {
    this.recompute();
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.recompute());
  }

  private recompute(): void {
    const result: Crumb[] = [
      { labelKey: 'admin.shell.brand_name', link: '/admin' },
    ];

    let snapshot: ActivatedRouteSnapshot | null = this.route.snapshot.root;
    let url = '';

    while (snapshot) {
      const segment = snapshot.url.map((s) => s.path).join('/');
      if (segment) {
        url += '/' + segment;
      }

      const labelKey = snapshot.data?.['titleKey'] as string | undefined;
      const label = snapshot.data?.['title'] as string | undefined;

      if (labelKey || label) {
        result.push({ labelKey, label, link: url || null });
      }

      snapshot = snapshot.firstChild;
    }

    this.crumbs.set(result);
  }
}
