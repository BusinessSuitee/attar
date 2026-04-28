import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  signal,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ContactStatus } from '../../../../core/contacts/contact.service';
import {
  ContactServiceTypeFilter,
  ContactsDateRange,
  ContactsFilterState,
} from '../contacts.store';

const STATUSES: ContactStatus[] = ['in_progress', 'contacted', 'sale_confirmed'];
const SERVICE_TYPES: NonNullable<ContactServiceTypeFilter>[] = ['export', 'local'];
const RANGES: NonNullable<ContactsDateRange>[] = ['today', '7d', '30d'];

@Component({
  selector: 'app-contacts-filters',
  standalone: true,
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- ── Desktop (≥768px) ───────────────────── -->
    <div class="contacts-filters contacts-filters--desktop">
      <input
        type="search"
        class="contacts-filters__search"
        [value]="searchValue()"
        [placeholder]="'admin.contacts.filters.search_placeholder' | transloco"
        (input)="onSearchInput($event)"
        [attr.aria-label]="'admin.contacts.filters.search_placeholder' | transloco"
      />

      <div class="contacts-filters__group">
        <span class="contacts-filters__label"
          >{{ 'admin.contacts.filters.status_label' | transloco }}:</span
        >
        <button
          type="button"
          class="contacts-filters__chip"
          [class.is-active]="!filter.status"
          (click)="setStatus(null)"
        >
          {{ 'admin.contacts.filters.all' | transloco }}
        </button>
        @for (s of statuses; track s) {
          <button
            type="button"
            class="contacts-filters__chip"
            [class.is-active]="filter.status === s"
            (click)="setStatus(s)"
          >
            {{ 'admin.contacts.status.' + s | transloco }}
          </button>
        }
      </div>

      <div class="contacts-filters__group">
        <span class="contacts-filters__label"
          >{{ 'admin.contacts.filters.service_label' | transloco }}:</span
        >
        <button
          type="button"
          class="contacts-filters__chip"
          [class.is-active]="!filter.serviceType"
          (click)="setServiceType(null)"
        >
          {{ 'admin.contacts.filters.all' | transloco }}
        </button>
        @for (t of serviceTypes; track t) {
          <button
            type="button"
            class="contacts-filters__chip"
            [class.is-active]="filter.serviceType === t"
            (click)="setServiceType(t)"
          >
            {{ 'admin.contacts.service_type.' + t | transloco }}
          </button>
        }
      </div>

      <div class="contacts-filters__group">
        <span class="contacts-filters__label"
          >{{ 'admin.contacts.filters.range_label' | transloco }}:</span
        >
        <button
          type="button"
          class="contacts-filters__chip"
          [class.is-active]="!filter.range"
          (click)="setRange(null)"
        >
          {{ 'admin.contacts.filters.all' | transloco }}
        </button>
        @for (r of ranges; track r) {
          <button
            type="button"
            class="contacts-filters__chip"
            [class.is-active]="filter.range === r"
            (click)="setRange(r)"
          >
            {{ 'admin.contacts.filters.range_' + r | transloco }}
          </button>
        }
      </div>

      @if (hasActiveFilters) {
        <button type="button" class="contacts-filters__clear" (click)="clearAll.emit()">
          {{ 'common.clearFilters' | transloco }}
        </button>
      }
    </div>

    <!-- ── Mobile (≤767px) ────────────────────── -->
    <div class="contacts-filters contacts-filters--mobile">
      <input
        type="search"
        class="contacts-filters__search contacts-filters__search--full"
        [value]="searchValue()"
        [placeholder]="'admin.contacts.filters.search_placeholder' | transloco"
        (input)="onSearchInput($event)"
        [attr.aria-label]="'admin.contacts.filters.search_placeholder' | transloco"
      />
      <div class="contacts-filters__mobile-row">
        <button type="button" class="contacts-filters__sheet-trigger" (click)="openSheet()">
          <span class="material-symbols-outlined" style="font-size:1rem">filter_list</span>
          {{ 'admin.contacts.filters.filter_button' | transloco }}
          @if (activeFilterCount > 0) {
            <span class="contacts-filters__sheet-count">{{ activeFilterCount }}</span>
          }
        </button>
        @if (hasActiveFilters) {
          <button type="button" class="contacts-filters__clear" (click)="clearAll.emit()">
            {{ 'common.clearFilters' | transloco }}
          </button>
        }
      </div>
    </div>

    <!-- ── Bottom-sheet (mobile) ──────────────── -->
    <dialog #sheetDialog class="contacts-filters__sheet" (cancel)="closeSheet()">
      <div class="contacts-filters__sheet-inner">
        <div class="contacts-filters__sheet-header">
          <span class="contacts-filters__sheet-title">{{
            'admin.contacts.filters.sheet_title' | transloco
          }}</span>
          <button
            type="button"
            class="contacts-filters__sheet-close"
            (click)="closeSheet()"
            [attr.aria-label]="'common.aria.dismiss' | transloco"
          >
            ×
          </button>
        </div>

        <div class="contacts-filters__sheet-body">
          <div class="contacts-filters__sheet-group">
            <span class="contacts-filters__label">{{
              'admin.contacts.filters.status_label' | transloco
            }}</span>
            <div class="contacts-filters__chip-row">
              <button
                type="button"
                class="contacts-filters__chip"
                [class.is-active]="!filter.status"
                (click)="setStatus(null)"
              >
                {{ 'admin.contacts.filters.all' | transloco }}
              </button>
              @for (s of statuses; track s) {
                <button
                  type="button"
                  class="contacts-filters__chip"
                  [class.is-active]="filter.status === s"
                  (click)="setStatus(s)"
                >
                  {{ 'admin.contacts.status.' + s | transloco }}
                </button>
              }
            </div>
          </div>

          <div class="contacts-filters__sheet-group">
            <span class="contacts-filters__label">{{
              'admin.contacts.filters.service_label' | transloco
            }}</span>
            <div class="contacts-filters__chip-row">
              <button
                type="button"
                class="contacts-filters__chip"
                [class.is-active]="!filter.serviceType"
                (click)="setServiceType(null)"
              >
                {{ 'admin.contacts.filters.all' | transloco }}
              </button>
              @for (t of serviceTypes; track t) {
                <button
                  type="button"
                  class="contacts-filters__chip"
                  [class.is-active]="filter.serviceType === t"
                  (click)="setServiceType(t)"
                >
                  {{ 'admin.contacts.service_type.' + t | transloco }}
                </button>
              }
            </div>
          </div>

          <div class="contacts-filters__sheet-group">
            <span class="contacts-filters__label">{{
              'admin.contacts.filters.range_label' | transloco
            }}</span>
            <div class="contacts-filters__chip-row">
              <button
                type="button"
                class="contacts-filters__chip"
                [class.is-active]="!filter.range"
                (click)="setRange(null)"
              >
                {{ 'admin.contacts.filters.all' | transloco }}
              </button>
              @for (r of ranges; track r) {
                <button
                  type="button"
                  class="contacts-filters__chip"
                  [class.is-active]="filter.range === r"
                  (click)="setRange(r)"
                >
                  {{ 'admin.contacts.filters.range_' + r | transloco }}
                </button>
              }
            </div>
          </div>
        </div>

        <div class="contacts-filters__sheet-footer">
          @if (hasActiveFilters) {
            <button type="button" class="contacts-filters__clear" (click)="clearAll.emit()">
              {{ 'common.clearFilters' | transloco }}
            </button>
          }
          <button type="button" class="contacts-filters__sheet-done" (click)="closeSheet()">
            {{ 'common.done' | transloco }}
          </button>
        </div>
      </div>
    </dialog>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .contacts-filters--desktop {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.75rem;
      }
      .contacts-filters--mobile {
        display: none;
        flex-direction: column;
        gap: 0.5rem;
      }
      @media (max-width: 767px) {
        .contacts-filters--desktop {
          display: none;
        }
        .contacts-filters--mobile {
          display: flex;
        }
      }

      .contacts-filters__search {
        height: 44px;
        min-width: 220px;
        flex-grow: 1;
        max-width: 340px;
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: 0.5rem;
        padding: 0 0.875rem;
        font-size: 0.875rem;
        background: #ffffff;
      }
      .contacts-filters__search--full {
        min-width: 0;
        max-width: none;
        width: 100%;
      }
      .contacts-filters__search:focus {
        outline: none;
        border-color: #0fbd66;
        box-shadow: 0 0 0 3px rgba(15, 189, 102, 0.2);
      }
      .contacts-filters__group {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        flex-wrap: wrap;
      }
      .contacts-filters__label {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--color-text-secondary, #64748b);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-inline-end: 0.25rem;
      }
      .contacts-filters__chip {
        padding: 0.375rem 0.75rem;
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: 9999px;
        background: transparent;
        color: var(--color-text-primary, #0f172a);
        font-size: 0.8125rem;
        cursor: pointer;
        min-height: 44px;
        transition:
          background 0.15s ease,
          border-color 0.15s ease;
      }
      .contacts-filters__chip:hover {
        background: var(--color-surface-subtle, #f1f5f9);
      }
      .contacts-filters__chip.is-active {
        background: #0fbd66;
        border-color: #0fbd66;
        color: #ffffff;
      }
      .contacts-filters__clear {
        background: transparent;
        border: 1px dashed var(--color-border, #e2e8f0);
        color: var(--color-text-secondary, #64748b);
        padding: 0.375rem 0.75rem;
        border-radius: 0.5rem;
        font-size: 0.8125rem;
        cursor: pointer;
        min-height: 44px;
      }
      .contacts-filters__clear:hover {
        background: var(--color-surface-subtle, #f1f5f9);
      }

      .contacts-filters__mobile-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        width: 100%;
      }
      .contacts-filters__mobile-row > * {
        flex: 1;
        justify-content: center;
      }
      .contacts-filters__sheet-trigger {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.375rem;
        padding: 0 1rem;
        height: 44px;
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: 0.5rem;
        background: #ffffff;
        color: var(--color-text-primary, #0f172a);
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
      }
      .contacts-filters__sheet-trigger:hover {
        background: var(--color-surface-subtle, #f1f5f9);
      }
      .contacts-filters__sheet-count {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.375rem;
        height: 1.375rem;
        border-radius: 9999px;
        background: #0fbd66;
        color: #ffffff;
        font-size: 0.6875rem;
        font-weight: 700;
      }

      .contacts-filters__sheet {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        top: auto;
        max-width: 100%;
        width: 100%;
        margin: 0;
        padding: 0;
        border: none;
        border-radius: 1.25rem 1.25rem 0 0;
        max-height: 85vh;
        background: var(--color-surface-card, #ffffff);
        box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.12);
      }
      .contacts-filters__sheet::backdrop {
        background: rgba(15, 23, 42, 0.5);
      }
      .contacts-filters__sheet-inner {
        display: flex;
        flex-direction: column;
        max-height: 85vh;
      }
      .contacts-filters__sheet-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem 1.25rem 0.75rem;
        border-bottom: 1px solid var(--color-border, #e2e8f0);
        flex-shrink: 0;
      }
      .contacts-filters__sheet-title {
        font-size: 1rem;
        font-weight: 700;
        color: var(--color-text-primary, #0f172a);
      }
      .contacts-filters__sheet-close {
        background: transparent;
        border: none;
        font-size: 1.5rem;
        line-height: 1;
        color: var(--color-text-secondary, #64748b);
        cursor: pointer;
        min-height: 44px;
        min-width: 44px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .contacts-filters__sheet-body {
        overflow-y: auto;
        flex: 1;
        padding: 1rem 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }
      .contacts-filters__sheet-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .contacts-filters__chip-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .contacts-filters__sheet-footer {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.5rem;
        padding: 0.875rem 1.25rem;
        padding-bottom: max(0.875rem, env(safe-area-inset-bottom));
        border-top: 1px solid var(--color-border, #e2e8f0);
        flex-shrink: 0;
      }
      .contacts-filters__sheet-done {
        background: #0fbd66;
        color: #ffffff;
        border: none;
        padding: 0 1.25rem;
        height: 44px;
        border-radius: 0.625rem;
        font-weight: 600;
        font-size: 0.875rem;
        cursor: pointer;
        min-width: 80px;
      }
      .contacts-filters__sheet-done:hover {
        background: #0a8a4a;
      }
    `,
  ],
})
export class ContactsFiltersComponent {
  @ViewChild('sheetDialog', { static: true })
  private sheetDialogRef!: ElementRef<HTMLDialogElement>;

  readonly statuses = STATUSES;
  readonly serviceTypes = SERVICE_TYPES;
  readonly ranges = RANGES;
  readonly searchValue = signal<string>('');
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  private _filter: ContactsFilterState = {
    search: null,
    status: null,
    serviceType: null,
    range: null,
  };

  @Input() set filter(value: ContactsFilterState) {
    this._filter = value;
    const incoming = value.search ?? '';
    if (incoming !== this.searchValue()) this.searchValue.set(incoming);
  }
  get filter(): ContactsFilterState {
    return this._filter;
  }

  @Input() hasActiveFilters = false;

  @Output() readonly filterChange = new EventEmitter<Partial<ContactsFilterState>>();
  @Output() readonly clearAll = new EventEmitter<void>();

  get activeFilterCount(): number {
    return [this.filter.status, this.filter.serviceType, this.filter.range].filter(Boolean)
      .length;
  }

  openSheet(): void {
    this.sheetDialogRef.nativeElement.showModal();
  }
  closeSheet(): void {
    this.sheetDialogRef.nativeElement.close();
  }

  setStatus(status: ContactStatus | null): void {
    this.filterChange.emit({ status });
  }
  setServiceType(serviceType: ContactServiceTypeFilter): void {
    this.filterChange.emit({ serviceType });
  }
  setRange(range: ContactsDateRange): void {
    this.filterChange.emit({ range });
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchValue.set(value);
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.filterChange.emit({ search: value.trim() === '' ? null : value });
      this.debounceTimer = null;
    }, 250);
  }
}
