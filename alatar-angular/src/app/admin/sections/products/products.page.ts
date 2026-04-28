import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { AdminPageComponent } from '../../layout/admin-page/admin-page.component';
import { AdminPageHeaderComponent } from '../../layout/admin-page-header/admin-page-header.component';
import { AdminSectionCardComponent } from '../../layout/admin-section-card/admin-section-card.component';
import { AdminConfirmDialogComponent } from '../../shared/ui/confirm-dialog.component';

import { ProductListItem, ProductStatus } from '../../../core/products/product.service';
import {
  AdminCatalogFilterState,
  AdminCatalogStore,
  parseFilterState,
  serializeFilterState,
} from './admin-catalog.store';

import { ProductsFiltersComponent } from './components/products-filters.component';
import { ProductsListTableComponent } from './components/products-list-table.component';
import { CategoriesPaneComponent } from './components/categories-pane.component';

@Component({
  selector: 'app-admin-products-page',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoPipe,
    AdminPageComponent,
    AdminPageHeaderComponent,
    AdminSectionCardComponent,
    ProductsFiltersComponent,
    ProductsListTableComponent,
    CategoriesPaneComponent,
    AdminConfirmDialogComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <admin-page>
      <admin-page-header
        [title]="'admin.products.title' | transloco"
        [subtitle]="'admin.products.subtitle' | transloco"
      >
        <button slot="actions" type="button" class="admin-products__cta" (click)="goToNew()">
          + {{ 'admin.products.list.add' | transloco }}
        </button>
      </admin-page-header>

      <admin-section-card>
        <app-products-filters
          [filter]="store.filter()"
          [hasActiveFilters]="store.hasActiveFilters()"
          (filterChange)="onFilterChange($event)"
          (clearAll)="onClearFilters()"
        ></app-products-filters>

        <div class="admin-products__table-wrap">
          <app-products-list-table
            [items]="store.visibleItems()"
            [isLoading]="store.isLoading()"
            [hasError]="store.hasError()"
            [errorMessage]="store.errorMessage() || ''"
            [emptyMessage]="emptyMessage()"
            [deletingIds]="store.deletingIds()"
            (rowClick)="openProduct($event)"
            (retry)="store.reload()"
            (statusChange)="onStatusChange($event)"
            (deleteRequest)="onDeleteRequest($event)"
          ></app-products-list-table>
        </div>
      </admin-section-card>

      <details class="admin-products__categories-disclosure">
        <summary class="admin-products__categories-summary">
          <span class="material-symbols-outlined admin-products__categories-icon">expand_more</span>
          <span class="admin-products__categories-heading">{{ 'admin.products.categories.section_title' | transloco }}</span>
          <span class="admin-products__categories-desc">{{ 'admin.products.categories.section_description' | transloco }}</span>
        </summary>
        <div class="admin-products__categories-body">
          <app-categories-pane></app-categories-pane>
        </div>
      </details>
    </admin-page>

    <!-- Delete confirmation dialog -->
    <admin-confirm-dialog
      [open]="productToDelete() !== null"
      [title]="'admin.products.list.delete_title' | transloco"
      [description]="'admin.products.list.delete_confirm' | transloco"
      [confirmLabel]="'admin.products.list.delete_confirm_action' | transloco"
      [cancelLabel]="'common.actions.cancel' | transloco"
      tone="danger"
      (confirm)="onDeleteConfirmed()"
      (cancel)="productToDelete.set(null)"
    ></admin-confirm-dialog>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .admin-products__cta {
        background: #0fbd66;
        color: #ffffff;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 0.625rem;
        font-weight: 600;
        cursor: pointer;
        min-height: 44px;
      }
      .admin-products__cta:hover {
        background: #0a8a4a;
      }
      .admin-products__table-wrap {
        margin-top: 1rem;
      }

      /* ── categories disclosure ──────── */
      .admin-products__categories-disclosure {
        background: var(--color-surface-card, #ffffff);
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: 1rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        overflow: hidden;
      }
      .admin-products__categories-summary {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem 1.5rem;
        cursor: pointer;
        list-style: none;
        user-select: none;
        min-height: 56px;
      }
      .admin-products__categories-summary::-webkit-details-marker {
        display: none;
      }
      .admin-products__categories-summary:hover {
        background: var(--color-surface-subtle, #f8fafc);
      }
      .admin-products__categories-icon {
        color: var(--color-text-secondary, #64748b);
        font-size: 1.25rem;
        transition: transform 200ms ease;
        flex-shrink: 0;
      }
      .admin-products__categories-disclosure[open] .admin-products__categories-icon {
        transform: rotate(180deg);
      }
      .admin-products__categories-heading {
        font-size: 1rem;
        font-weight: 700;
        color: var(--color-text-primary, #0f172a);
      }
      .admin-products__categories-desc {
        font-size: 0.8125rem;
        color: var(--color-text-secondary, #64748b);
        flex: 1;
      }
      @media (max-width: 767px) {
        .admin-products__categories-desc {
          display: none;
        }
      }
      .admin-products__categories-body {
        padding: 1.5rem;
        border-top: 1px solid var(--color-border, #e2e8f0);
      }
    `,
  ],
})
export class AdminProductsPageComponent implements OnInit {
  protected readonly store = inject(AdminCatalogStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly transloco = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);

  readonly productToDelete = signal<ProductListItem | null>(null);

  private isApplyingFromUrl = false;

  constructor() {
    effect(() => {
      const filter = this.store.filter();
      if (this.isApplyingFromUrl) return;
      const queryParams = serializeFilterState(filter);
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams,
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    });
  }

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const next = parseFilterState(params);
        const current = this.store.filter();
        if (this.equals(current, next)) return;
        this.isApplyingFromUrl = true;
        this.store.replaceFilter(next);
        queueMicrotask(() => (this.isApplyingFromUrl = false));
      });

    this.store.ensureLoaded();
  }

  emptyMessage(): string {
    return this.store.hasActiveFilters()
      ? this.transloco.translate('admin.products.list.empty_filtered')
      : this.transloco.translate('admin.products.list.empty');
  }

  onFilterChange(patch: Partial<AdminCatalogFilterState>): void {
    this.store.setFilter((prev) => ({ ...prev, ...patch }));
  }

  onClearFilters(): void {
    this.store.clearFilters();
  }

  onStatusChange(event: { productId: string; status: ProductStatus }): void {
    this.store.applyOptimisticStatus(event.productId, event.status);
  }

  onDeleteRequest(product: ProductListItem): void {
    this.productToDelete.set(product);
  }

  onDeleteConfirmed(): void {
    const product = this.productToDelete();
    if (!product) return;
    this.productToDelete.set(null);
    this.store.deleteProduct(product.id);
  }

  openProduct(product: ProductListItem): void {
    this.router.navigate(['/admin/products', product.id, 'edit']);
  }

  goToNew(): void {
    this.router.navigate(['/admin/products/new']);
  }

  private equals(a: AdminCatalogFilterState, b: AdminCatalogFilterState): boolean {
    return (
      a.search === b.search &&
      a.status === b.status &&
      a.type === b.type &&
      a.state === b.state &&
      a.season === b.season
    );
  }
}
