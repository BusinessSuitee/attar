import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { AdminPageComponent } from '../../layout/admin-page/admin-page.component';
import { AdminPageHeaderComponent } from '../../layout/admin-page-header/admin-page-header.component';
import { AdminSectionCardComponent } from '../../layout/admin-section-card/admin-section-card.component';

import { ContactListItem } from '../../../core/contacts/contact.service';
import {
  AdminContactsStore,
  ContactsFilterState,
  parseContactsFilterState,
  serializeContactsFilterState,
} from './contacts.store';

import { ContactsKpiStripComponent } from './components/contacts-kpi-strip.component';
import { ContactsFiltersComponent } from './components/contacts-filters.component';
import { ContactsListTableComponent } from './components/contacts-list-table.component';
import { ContactDetailDrawerComponent } from './components/contact-detail-drawer.component';

@Component({
  selector: 'app-admin-contacts-page',
  standalone: true,
  imports: [
    TranslocoPipe,
    AdminPageComponent,
    AdminPageHeaderComponent,
    AdminSectionCardComponent,
    ContactsKpiStripComponent,
    ContactsFiltersComponent,
    ContactsListTableComponent,
    ContactDetailDrawerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <admin-page>
      <admin-page-header
        [title]="'admin.contacts.title' | transloco"
        [subtitle]="'admin.contacts.subtitle' | transloco"
      >
        <button
          slot="actions"
          type="button"
          class="admin-contacts__refresh-btn"
          (click)="reload()"
        >
          <span class="material-symbols-outlined" [class.spinning]="store.isLoading()">refresh</span>
          {{ 'admin.contacts.refresh' | transloco }}
        </button>
      </admin-page-header>

      <app-contacts-kpi-strip [kpis]="store.kpis()"></app-contacts-kpi-strip>

      <admin-section-card>
        <app-contacts-filters
          [filter]="store.filter()"
          [hasActiveFilters]="store.hasActiveFilters()"
          (filterChange)="onFilterChange($event)"
          (clearAll)="onClearFilters()"
        ></app-contacts-filters>

        <div class="admin-contacts__table-wrap">
          <app-contacts-list-table
            [items]="store.pagedItems()"
            [isLoading]="store.isLoading()"
            [hasError]="store.hasError()"
            [errorMessage]="store.errorMessage() || ''"
            [emptyMessage]="emptyMessage()"
            [customerRequestCounts]="store.customerRequestCounts()"
            [page]="store.page()"
            [pageSize]="store.pageSize()"
            [totalPages]="store.totalPages()"
            [totalFilteredCount]="store.totalFilteredCount()"
            (rowClick)="openDrawer($event)"
            (retry)="store.reload()"
            (pageChange)="store.setPage($event)"
            (pageSizeChange)="store.setPageSize($event)"
          ></app-contacts-list-table>
        </div>
      </admin-section-card>
    </admin-page>

    <app-contact-detail-drawer
      [contact]="selectedContact()"
      [open]="drawerOpen()"
      [customerRequestCounts]="store.customerRequestCounts()"
      (closed)="onDrawerClosed()"
      (filterByPhone)="filterByPhone($event)"
    ></app-contact-detail-drawer>
  `,
  styles: [
    `
      :host { display: block; }

      .admin-contacts__refresh-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        background: transparent;
        border: 1px solid var(--color-border, #e2e8f0);
        color: var(--color-text-secondary, #64748b);
        padding: 0.5rem 0.875rem;
        border-radius: 0.625rem;
        font-weight: 600;
        font-size: 0.875rem;
        cursor: pointer;
        min-height: 44px;
        transition: background 0.15s ease, color 0.15s ease;
      }
      .admin-contacts__refresh-btn:hover {
        background: var(--color-surface-subtle, #f1f5f9);
        color: var(--color-text-primary, #0f172a);
      }
      .admin-contacts__refresh-btn .material-symbols-outlined { font-size: 1.125rem; }
      .spinning { animation: spin 1s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }
      @media (prefers-reduced-motion: reduce) { .spinning { animation: none; } }

      .admin-contacts__table-wrap { margin-top: 1rem; }
    `,
  ],
})
export class AdminContactsPageComponent implements OnInit {
  protected readonly store = inject(AdminContactsStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly transloco = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);

  readonly selectedContactId = signal<string | null>(null);
  readonly selectedContact = computed(() => {
    const id = this.selectedContactId();
    if (!id) return null;
    return this.store.all().find((c) => c.id === id) ?? null;
  });
  readonly drawerOpen = signal(false);

  private isApplyingFromUrl = false;

  constructor() {
    effect(() => {
      const filter = this.store.filter();
      if (this.isApplyingFromUrl) return;
      const queryParams = serializeContactsFilterState(filter);
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
        const next = parseContactsFilterState(params);
        const current = this.store.filter();
        if (this.filterEquals(current, next)) return;
        this.isApplyingFromUrl = true;
        this.store.replaceFilter(next);
        queueMicrotask(() => (this.isApplyingFromUrl = false));
      });

    this.store.ensureLoaded();
  }

  emptyMessage(): string {
    return this.store.hasActiveFilters()
      ? this.transloco.translate('admin.contacts.list.empty_filtered')
      : this.transloco.translate('admin.contacts.list.empty');
  }

  onFilterChange(patch: Partial<ContactsFilterState>): void {
    this.store.setFilter((prev) => ({ ...prev, ...patch }));
  }

  onClearFilters(): void {
    this.store.clearFilters();
  }

  openDrawer(contact: ContactListItem): void {
    this.selectedContactId.set(contact.id);
    this.drawerOpen.set(true);
  }

  onDrawerClosed(): void {
    this.drawerOpen.set(false);
    this.selectedContactId.set(null);
  }

  reload(): void {
    this.store.reload();
  }

  filterByPhone(phone: string): void {
    this.onDrawerClosed();
    this.store.setFilter((prev) => ({ ...prev, search: phone }));
  }

  private filterEquals(a: ContactsFilterState, b: ContactsFilterState): boolean {
    return (
      a.search === b.search &&
      a.status === b.status &&
      a.serviceType === b.serviceType &&
      a.range === b.range
    );
  }
}
