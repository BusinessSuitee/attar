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
import { CommonModule } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  ProductSeason,
  ProductState,
  ProductStatus,
  ProductType,
} from '../../../../core/products/product.service';
import { AdminCatalogFilterState } from '../admin-catalog.store';

const STATUSES: ProductStatus[] = ['Valid', 'ComingSoon', 'Invalid'];
const TYPES: ProductType[] = ['Fruit', 'Vegetable'];
const STATES: ProductState[] = ['Fresh', 'Frozen'];
const SEASONS: ProductSeason[] = ['Summer', 'Winter', 'AllYear'];

@Component({
  selector: 'app-products-filters',
  standalone: true,
  imports: [CommonModule, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- ── Desktop row (≥768px) ───────────────── -->
    <div class="products-filters products-filters--desktop">
      <input
        type="search"
        class="products-filters__search"
        [value]="searchValue()"
        [placeholder]="'admin.products.list.search_placeholder' | transloco"
        (input)="onSearchInput($event)"
        [attr.aria-label]="'admin.products.list.search_placeholder' | transloco"
      />

      <div class="products-filters__group">
        <span class="products-filters__label">{{ 'admin.products.list.filter_status' | transloco }}:</span>
        <button type="button" class="products-filters__chip" [class.is-active]="!filter.status" (click)="setStatus(null)">
          {{ 'admin.products.filters.all' | transloco }}
        </button>
        @for (status of statuses; track status) {
          <button type="button" class="products-filters__chip" [class.is-active]="filter.status === status" (click)="setStatus(status)">
            {{ 'admin.products.statuses.' + statusKey(status) | transloco }}
          </button>
        }
      </div>

      <div class="products-filters__group">
        <span class="products-filters__label">{{ 'admin.products.list.filter_type' | transloco }}:</span>
        <button type="button" class="products-filters__chip" [class.is-active]="!filter.type" (click)="setType(null)">
          {{ 'admin.products.filters.all' | transloco }}
        </button>
        @for (type of types; track type) {
          <button type="button" class="products-filters__chip" [class.is-active]="filter.type === type" (click)="setType(type)">
            {{ 'admin.products.types.' + type.toLowerCase() | transloco }}
          </button>
        }
      </div>

      <div class="products-filters__group">
        <span class="products-filters__label">{{ 'admin.products.list.filter_state' | transloco }}:</span>
        <button type="button" class="products-filters__chip" [class.is-active]="!filter.state" (click)="setState(null)">
          {{ 'admin.products.filters.all' | transloco }}
        </button>
        @for (state of states; track state) {
          <button type="button" class="products-filters__chip" [class.is-active]="filter.state === state" (click)="setState(state)">
            {{ 'admin.products.states.' + state.toLowerCase() | transloco }}
          </button>
        }
      </div>

      <div class="products-filters__group">
        <span class="products-filters__label">{{ 'admin.products.list.filter_season' | transloco }}:</span>
        <button type="button" class="products-filters__chip" [class.is-active]="!filter.season" (click)="setSeason(null)">
          {{ 'admin.products.filters.all' | transloco }}
        </button>
        @for (season of seasons; track season) {
          <button type="button" class="products-filters__chip" [class.is-active]="filter.season === season" (click)="setSeason(season)">
            {{ 'admin.products.seasons.' + seasonKey(season) | transloco }}
          </button>
        }
      </div>

      @if (hasActiveFilters) {
        <button type="button" class="products-filters__clear" (click)="clearAll.emit()">
          {{ 'common.clearFilters' | transloco }}
        </button>
      }
    </div>

    <!-- ── Mobile row (≤767px): search + sheet trigger ── -->
    <div class="products-filters products-filters--mobile">
      <input
        type="search"
        class="products-filters__search products-filters__search--full"
        [value]="searchValue()"
        [placeholder]="'admin.products.list.search_placeholder' | transloco"
        (input)="onSearchInput($event)"
        [attr.aria-label]="'admin.products.list.search_placeholder' | transloco"
      />
      <div class="products-filters__mobile-row">
        <button type="button" class="products-filters__sheet-trigger" (click)="openSheet()">
          {{ 'admin.products.list.filter_button' | transloco }}
          @if (activeFilterCount > 0) {
            <span class="products-filters__sheet-count">{{ activeFilterCount }}</span>
          }
        </button>
        @if (hasActiveFilters) {
          <button type="button" class="products-filters__clear" (click)="clearAll.emit()">
            {{ 'common.clearFilters' | transloco }}
          </button>
        }
      </div>
    </div>

    <!-- ── Bottom-sheet dialog (mobile filters) ── -->
    <dialog #sheetDialog class="products-filters__sheet" (cancel)="closeSheet()">
      <div class="products-filters__sheet-inner">
        <div class="products-filters__sheet-header">
          <span class="products-filters__sheet-title">{{ 'admin.products.list.filters_title' | transloco }}</span>
          <button type="button" class="products-filters__sheet-close" (click)="closeSheet()" [attr.aria-label]="'common.aria.dismiss' | transloco">×</button>
        </div>

        <div class="products-filters__sheet-body">
          <div class="products-filters__sheet-group">
            <span class="products-filters__label">{{ 'admin.products.list.filter_status' | transloco }}</span>
            <div class="products-filters__chip-row">
              <button type="button" class="products-filters__chip" [class.is-active]="!filter.status" (click)="setStatus(null)">
                {{ 'admin.products.filters.all' | transloco }}
              </button>
              @for (status of statuses; track status) {
                <button type="button" class="products-filters__chip" [class.is-active]="filter.status === status" (click)="setStatus(status)">
                  {{ 'admin.products.statuses.' + statusKey(status) | transloco }}
                </button>
              }
            </div>
          </div>

          <div class="products-filters__sheet-group">
            <span class="products-filters__label">{{ 'admin.products.list.filter_type' | transloco }}</span>
            <div class="products-filters__chip-row">
              <button type="button" class="products-filters__chip" [class.is-active]="!filter.type" (click)="setType(null)">
                {{ 'admin.products.filters.all' | transloco }}
              </button>
              @for (type of types; track type) {
                <button type="button" class="products-filters__chip" [class.is-active]="filter.type === type" (click)="setType(type)">
                  {{ 'admin.products.types.' + type.toLowerCase() | transloco }}
                </button>
              }
            </div>
          </div>

          <div class="products-filters__sheet-group">
            <span class="products-filters__label">{{ 'admin.products.list.filter_state' | transloco }}</span>
            <div class="products-filters__chip-row">
              <button type="button" class="products-filters__chip" [class.is-active]="!filter.state" (click)="setState(null)">
                {{ 'admin.products.filters.all' | transloco }}
              </button>
              @for (state of states; track state) {
                <button type="button" class="products-filters__chip" [class.is-active]="filter.state === state" (click)="setState(state)">
                  {{ 'admin.products.states.' + state.toLowerCase() | transloco }}
                </button>
              }
            </div>
          </div>

          <div class="products-filters__sheet-group">
            <span class="products-filters__label">{{ 'admin.products.list.filter_season' | transloco }}</span>
            <div class="products-filters__chip-row">
              <button type="button" class="products-filters__chip" [class.is-active]="!filter.season" (click)="setSeason(null)">
                {{ 'admin.products.filters.all' | transloco }}
              </button>
              @for (season of seasons; track season) {
                <button type="button" class="products-filters__chip" [class.is-active]="filter.season === season" (click)="setSeason(season)">
                  {{ 'admin.products.seasons.' + seasonKey(season) | transloco }}
                </button>
              }
            </div>
          </div>
        </div>

        <div class="products-filters__sheet-footer">
          @if (hasActiveFilters) {
            <button type="button" class="products-filters__clear" (click)="clearAll.emit()">
              {{ 'common.clearFilters' | transloco }}
            </button>
          }
          <button type="button" class="products-filters__sheet-done" (click)="closeSheet()">
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

      /* show/hide by breakpoint */
      .products-filters--desktop { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; }
      .products-filters--mobile  { display: none; flex-direction: column; gap: 0.5rem; }
      @media (max-width: 767px) {
        .products-filters--desktop { display: none; }
        .products-filters--mobile  { display: flex; }
      }

      /* ── shared ──────────────────────────────── */
      .products-filters__search {
        height: 44px;
        min-width: 240px;
        flex-grow: 1;
        max-width: 360px;
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: 0.5rem;
        padding: 0 0.875rem;
        font-size: 0.875rem;
        background: #ffffff;
      }
      .products-filters__search--full {
        min-width: 0;
        max-width: none;
        width: 100%;
      }
      .products-filters__search:focus {
        outline: none;
        border-color: #0fbd66;
        box-shadow: 0 0 0 3px rgba(15, 189, 102, 0.2);
      }
      .products-filters__group {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        flex-wrap: wrap;
      }
      .products-filters__label {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--color-text-secondary, #64748b);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-inline-end: 0.25rem;
      }
      .products-filters__chip {
        padding: 0.5rem 0.875rem;
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: 9999px;
        background: transparent;
        color: var(--color-text-primary, #0f172a);
        font-size: 0.8125rem;
        cursor: pointer;
        min-height: 44px;
        transition: background 0.15s ease, border-color 0.15s ease;
      }
      .products-filters__chip:hover {
        background: var(--color-surface-subtle, #f1f5f9);
      }
      .products-filters__chip.is-active {
        background: #0fbd66;
        border-color: #0fbd66;
        color: #ffffff;
      }
      .products-filters__clear {
        background: transparent;
        border: 1px dashed var(--color-border, #e2e8f0);
        color: var(--color-text-secondary, #64748b);
        padding: 0.5rem 0.875rem;
        border-radius: 0.5rem;
        font-size: 0.8125rem;
        cursor: pointer;
        min-height: 44px;
      }
      .products-filters__clear:hover {
        background: var(--color-surface-subtle, #f1f5f9);
      }

      /* ── mobile row ──────────────────────────── */
      .products-filters__mobile-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .products-filters__sheet-trigger {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0 1rem;
        height: 44px;
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: 0.5rem;
        background: #ffffff;
        color: var(--color-text-primary, #0f172a);
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.15s ease;
      }
      .products-filters__sheet-trigger:hover {
        background: var(--color-surface-subtle, #f1f5f9);
      }
      .products-filters__sheet-count {
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

      /* ── bottom-sheet dialog ─────────────────── */
      .products-filters__sheet {
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
      .products-filters__sheet::backdrop {
        background: rgba(15, 23, 42, 0.5);
      }
      .products-filters__sheet-inner {
        display: flex;
        flex-direction: column;
        max-height: 85vh;
      }
      .products-filters__sheet-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem 1.25rem 0.75rem;
        border-bottom: 1px solid var(--color-border, #e2e8f0);
        flex-shrink: 0;
      }
      .products-filters__sheet-title {
        font-size: 1rem;
        font-weight: 700;
        color: var(--color-text-primary, #0f172a);
      }
      .products-filters__sheet-close {
        background: transparent;
        border: none;
        font-size: 1.5rem;
        line-height: 1;
        color: var(--color-text-secondary, #64748b);
        cursor: pointer;
        padding: 0.25rem;
        min-height: 44px;
        min-width: 44px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .products-filters__sheet-body {
        overflow-y: auto;
        flex: 1;
        padding: 1rem 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }
      .products-filters__sheet-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .products-filters__chip-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .products-filters__sheet-footer {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.5rem;
        padding: 0.875rem 1.25rem;
        padding-bottom: max(0.875rem, env(safe-area-inset-bottom));
        border-top: 1px solid var(--color-border, #e2e8f0);
        flex-shrink: 0;
      }
      .products-filters__sheet-done {
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
      .products-filters__sheet-done:hover {
        background: #0a8a4a;
      }
    `,
  ],
})
export class ProductsFiltersComponent {
  @ViewChild('sheetDialog', { static: true }) private sheetDialogRef!: ElementRef<HTMLDialogElement>;

  readonly statuses = STATUSES;
  readonly types = TYPES;
  readonly states = STATES;
  readonly seasons = SEASONS;

  readonly searchValue = signal<string>('');
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  get activeFilterCount(): number {
    const f = this.filter;
    return [f.status, f.type, f.state, f.season].filter(Boolean).length;
  }

  openSheet(): void {
    this.sheetDialogRef.nativeElement.showModal();
  }

  closeSheet(): void {
    this.sheetDialogRef.nativeElement.close();
  }

  private _filter: AdminCatalogFilterState = {
    search: null,
    status: null,
    type: null,
    state: null,
    season: null,
  };

  @Input() set filter(value: AdminCatalogFilterState) {
    this._filter = value;
    if ((value.search ?? '') !== this.searchValue()) {
      this.searchValue.set(value.search ?? '');
    }
  }
  get filter(): AdminCatalogFilterState {
    return this._filter;
  }

  @Input() hasActiveFilters = false;

  @Output() readonly filterChange = new EventEmitter<Partial<AdminCatalogFilterState>>();
  @Output() readonly clearAll = new EventEmitter<void>();

  setStatus(status: ProductStatus | null): void {
    this.filterChange.emit({ status });
  }

  setType(type: ProductType | null): void {
    this.filterChange.emit({ type });
  }

  setState(state: ProductState | null): void {
    this.filterChange.emit({ state });
  }

  setSeason(season: ProductSeason | null): void {
    this.filterChange.emit({ season });
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchValue.set(value);

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.filterChange.emit({ search: value.trim() === '' ? null : value });
      this.debounceTimer = null;
    }, 250);
  }

  statusKey(status: ProductStatus): string {
    return status === 'ComingSoon' ? 'coming_soon' : status.toLowerCase();
  }

  seasonKey(season: ProductSeason): string {
    return season === 'AllYear' ? 'all_year' : season.toLowerCase();
  }
}
