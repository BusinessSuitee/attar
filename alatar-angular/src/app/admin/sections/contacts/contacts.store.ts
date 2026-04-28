import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ParamMap, Params } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';

import {
  ContactListItem,
  ContactService,
  ContactStatus,
} from '../../../core/contacts/contact.service';
import { BackendErrorTranslator } from '../../../core/api/backend-error-translator.service';
import { optimistic } from '../../shared/stores/optimistic.helper';
import { ToastService } from '../../shared/toasts/toast.service';

export type ContactServiceTypeFilter = 'export' | 'local' | null;
export type ContactsDateRange = 'today' | '7d' | '30d' | null;

export interface ContactsFilterState {
  search: string | null;
  status: ContactStatus | null;
  serviceType: ContactServiceTypeFilter;
  range: ContactsDateRange;
}

const EMPTY_FILTER: ContactsFilterState = {
  search: null,
  status: null,
  serviceType: null,
  range: null,
};

const CONTACT_STATUSES: ContactStatus[] = ['in_progress', 'contacted', 'sale_confirmed'];
const SERVICE_TYPES: NonNullable<ContactServiceTypeFilter>[] = ['export', 'local'];
const DATE_RANGES: NonNullable<ContactsDateRange>[] = ['today', '7d', '30d'];

export function parseContactsFilterState(params: ParamMap): ContactsFilterState {
  return {
    search: nonEmpty(params.get('q')),
    status: pickEnum<ContactStatus>(params.get('status'), CONTACT_STATUSES),
    serviceType: pickEnum<NonNullable<ContactServiceTypeFilter>>(
      params.get('type'),
      SERVICE_TYPES,
    ),
    range: pickEnum<NonNullable<ContactsDateRange>>(params.get('range'), DATE_RANGES),
  };
}

export function serializeContactsFilterState(state: ContactsFilterState): Params {
  return {
    q: state.search ?? null,
    status: state.status ?? null,
    type: state.serviceType ?? null,
    range: state.range ?? null,
  };
}

const LOAD_PAGE_SIZE = 100;
const MAX_PAGES = 50;

@Injectable({ providedIn: 'root' })
export class AdminContactsStore {
  private readonly contactService = inject(ContactService);
  private readonly toast = inject(ToastService);
  private readonly errors = inject(BackendErrorTranslator);
  private readonly transloco = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _all = signal<ContactListItem[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _hasLoaded = signal(false);
  private readonly _hasError = signal(false);
  private readonly _errorMessage = signal<string | null>(null);
  private readonly _filter = signal<ContactsFilterState>({ ...EMPTY_FILTER });
  private readonly _page = signal(1);
  private readonly _pageSize = signal(20);

  readonly all = this._all.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly hasError = this._hasError.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();
  readonly filter = this._filter.asReadonly();
  readonly page = this._page.asReadonly();
  readonly pageSize = this._pageSize.asReadonly();

  readonly filteredItems = computed(() => {
    const f = this._filter();
    const all = this._all();
    const search = (f.search ?? '').trim().toLowerCase();
    const now = Date.now();

    return all.filter((item) => {
      const status = this.contactService.normalizeStatus(item.status);
      if (f.status && status !== f.status) return false;

      if (f.serviceType) {
        const type = isExportContact(item) ? 'export' : 'local';
        if (type !== f.serviceType) return false;
      }

      if (f.range) {
        const created = new Date(item.createdAtUtc).getTime();
        if (f.range === 'today') {
          const d = new Date();
          const todayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
          if (created < todayStart) return false;
        } else if (f.range === '7d') {
          if (created < now - 7 * 864e5) return false;
        } else if (f.range === '30d') {
          if (created < now - 30 * 864e5) return false;
        }
      }

      if (search) {
        const hay = [
          (item.fullName ?? '').toLowerCase(),
          (item.phoneNumber ?? '').toLowerCase(),
          (item.companyName ?? '').toLowerCase(),
          (item.country ?? '').toLowerCase(),
          (item.crop ?? '').toLowerCase(),
        ];
        if (!hay.some((h) => h.includes(search))) return false;
      }

      return true;
    });
  });

  readonly totalFilteredCount = computed(() => this.filteredItems().length);

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredItems().length / this._pageSize())),
  );

  readonly pagedItems = computed(() => {
    const start = (this._page() - 1) * this._pageSize();
    return this.filteredItems().slice(start, start + this._pageSize());
  });

  readonly hasActiveFilters = computed(() => {
    const f = this._filter();
    return Boolean(f.search || f.status || f.serviceType || f.range);
  });

  readonly kpis = computed(() => {
    const all = this._all();
    const cutoff7d = Date.now() - 7 * 864e5;
    let inProgress = 0;
    let contacted = 0;
    let saleConfirmed7d = 0;

    for (const item of all) {
      const s = this.contactService.normalizeStatus(item.status);
      if (s === 'in_progress') inProgress++;
      if (s === 'contacted') contacted++;
      if (s === 'sale_confirmed' && new Date(item.createdAtUtc).getTime() >= cutoff7d) {
        saleConfirmed7d++;
      }
    }

    return { total: all.length, inProgress, contacted, saleConfirmed7d };
  });

  readonly customerRequestCounts = computed(() => {
    const counts = new Map<string, number>();
    for (const item of this._all()) {
      const phone = (item.phoneNumber ?? '').trim();
      if (phone) counts.set(phone, (counts.get(phone) ?? 0) + 1);
    }
    return counts;
  });

  ensureLoaded(): void {
    if (this._hasLoaded() || this._isLoading()) return;
    this.loadNextPage(1, []);
  }

  reload(): void {
    if (this._isLoading()) return;
    this._hasLoaded.set(false);
    this.loadNextPage(1, []);
  }

  setFilter(updater: (prev: ContactsFilterState) => ContactsFilterState): void {
    this._filter.update(updater);
    this._page.set(1);
  }

  replaceFilter(state: ContactsFilterState): void {
    this._filter.set(state);
  }

  clearFilters(): void {
    this._filter.set({ ...EMPTY_FILTER });
    this._page.set(1);
  }

  setPage(page: number): void {
    this._page.set(page);
  }

  setPageSize(size: number): void {
    this._pageSize.set(size);
    this._page.set(1);
  }

  updateStatus(id: string, newStatus: ContactStatus): void {
    const item = this._all().find((i) => i.id === id);
    if (!item) return;
    const previousStatus = item.status;
    const nextBackendStatus = toBackendStatus(newStatus);

    optimistic({
      applyLocally: () => this.patchItemStatus(id, nextBackendStatus),
      callServer: () => this.contactService.updateContactStatus(id, newStatus),
      rollback: () => this.patchItemStatus(id, previousStatus),
      toastService: this.toast,
      successMessage: this.transloco.translate('admin.contacts.toast.status_updated'),
      failureMessage: this.transloco.translate('admin.contacts.toast.status_failed'),
      retryLabel: this.transloco.translate('common.retry'),
    });
  }

  deleteContact(id: string, onSuccess?: () => void): void {
    this.contactService.deleteContact(id).subscribe({
      next: () => {
        this._all.update((items) => items.filter((i) => i.id !== id));
        this.toast.success(this.transloco.translate('admin.contacts.toast.deleted'));
        onSuccess?.();
      },
      error: () => {
        this.toast.error(this.transloco.translate('admin.contacts.toast.delete_failed'));
      },
    });
  }

  private patchItemStatus(id: string, status: string): void {
    this._all.update((items) =>
      items.map((i) => (i.id === id ? { ...i, status } : i)),
    );
  }

  private loadNextPage(page: number, accumulated: ContactListItem[]): void {
    this._isLoading.set(true);
    if (page === 1) {
      this._hasError.set(false);
      this._errorMessage.set(null);
    }

    this.contactService
      .getContacts(page, LOAD_PAGE_SIZE)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const all = [...accumulated, ...response.items];
          if (page < Math.min(response.totalPages, MAX_PAGES)) {
            this.loadNextPage(page + 1, all);
          } else {
            this._all.set(all);
            this._hasLoaded.set(true);
            this._isLoading.set(false);
          }
        },
        error: (error: unknown) => {
          this._hasError.set(true);
          this._errorMessage.set(this.errors.translate(error));
          this._isLoading.set(false);
        },
      });
  }
}

export function isExportContact(item: ContactListItem): boolean {
  return (item.serviceType ?? '').trim().toLowerCase() === 'export';
}

function toBackendStatus(status: ContactStatus): string {
  switch (status) {
    case 'contacted':
      return 'Contacted';
    case 'sale_confirmed':
      return 'SaleConfirmed';
    default:
      return 'InProgress';
  }
}

function nonEmpty(value: string | null): string | null {
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function pickEnum<T extends string>(value: string | null, allowed: readonly T[]): T | null {
  if (value === null) return null;
  return (allowed as readonly string[]).includes(value) ? (value as T) : null;
}
