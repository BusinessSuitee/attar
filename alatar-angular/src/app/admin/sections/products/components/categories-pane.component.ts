import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  ViewChild,
  TemplateRef,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { switchMap } from 'rxjs/operators';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { CategoryDto, CategorySeason, CategoryType } from '../../../../core/categories/category.service';
import {
  CategoriesStore,
  CategorySeasonFilter,
  CategoryTypeFilter,
} from '../categories.store';
import { LocalizedTextPipe } from '../../../../core/i18n/localized-text.pipe';
import { AdminConfirmDialogComponent } from '../../../shared/ui/confirm-dialog.component';
import {
  AdminDataTableColumn,
  AdminDataTableComponent,
} from '../../../shared/ui/data-table.component';
import { ToastService } from '../../../shared/toasts/toast.service';

const TYPE_OPTIONS: CategoryType[] = ['Fruit', 'Vegetable', 'Frozen'];
const SEASON_OPTIONS: CategorySeason[] = ['Summer', 'Winter', 'AllYear'];

@Component({
  selector: 'app-categories-pane',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslocoPipe,
    LocalizedTextPipe,
    AdminConfirmDialogComponent,
    AdminDataTableComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="categories-pane">
      <header class="categories-pane__header">
        <div class="categories-pane__filters">
          <span class="categories-pane__filter-label">{{ 'admin.products.categories.filter_type' | transloco }}:</span>
          <button
            type="button"
            class="categories-pane__chip"
            [class.is-active]="store.typeFilter() === 'all'"
            (click)="store.setTypeFilter('all')"
          >
            {{ 'admin.products.filters.all' | transloco }}
          </button>
          @for (type of typeOptions; track type) {
            <button
              type="button"
              class="categories-pane__chip"
              [class.is-active]="store.typeFilter() === type"
              (click)="store.setTypeFilter(type)"
            >
              {{ 'admin.products.types.' + typeKey(type) | transloco }}
            </button>
          }

          <span class="categories-pane__divider" aria-hidden="true">·</span>
          <span class="categories-pane__filter-label">{{ 'admin.products.categories.filter_season' | transloco }}:</span>
          <button
            type="button"
            class="categories-pane__chip"
            [class.is-active]="store.seasonFilter() === 'all'"
            (click)="store.setSeasonFilter('all')"
          >
            {{ 'admin.products.filters.all' | transloco }}
          </button>
          @for (season of seasonOptions; track season) {
            <button
              type="button"
              class="categories-pane__chip"
              [class.is-active]="store.seasonFilter() === season"
              (click)="store.setSeasonFilter(season)"
            >
              {{ 'admin.products.seasons.' + seasonKey(season) | transloco }}
            </button>
          }
        </div>

        <button type="button" class="categories-pane__add" (click)="openCreate()">
          + {{ 'admin.products.categories.add' | transloco }}
        </button>
      </header>

      <admin-data-table
        [items]="store.visibleItems()"
        [columns]="columns"
        [isLoading]="store.isLoading()"
        [hasError]="store.hasError()"
        [errorMessage]="store.errorMessage() || ''"
        [emptyMessage]="'admin.products.categories.empty' | transloco"
        [retryLabel]="'common.retry' | transloco"
        [trackBy]="trackById"
        (retry)="store.reload()"
      ></admin-data-table>
    </div>

    <ng-template #nameCell let-row>
      <strong>{{ { en: row.name, ar: row.nameAr } | localizedText }}</strong>
    </ng-template>
    <ng-template #typeCell let-row>
      {{ 'admin.products.types.' + typeKey(row.type) | transloco }}
    </ng-template>
    <ng-template #seasonCell let-row>
      {{ 'admin.products.seasons.' + seasonKey(row.season) | transloco }}
    </ng-template>
    <ng-template #actionsCell let-row>
      <div class="categories-pane__row-actions">
        <button
          type="button"
          class="categories-pane__row-btn"
          (click)="openEdit(row); $event.stopPropagation()"
        >
          {{ 'admin.products.categories.edit' | transloco }}
        </button>
        <button
          type="button"
          class="categories-pane__row-btn categories-pane__row-btn--danger"
          (click)="askDelete(row); $event.stopPropagation()"
        >
          {{ 'admin.products.categories.delete' | transloco }}
        </button>
      </div>
    </ng-template>

    <admin-confirm-dialog
      [open]="formDialogOpen()"
      [title]="formDialogTitle()"
      [confirmLabel]="('admin.products.categories.save' | transloco)"
      [cancelLabel]="('admin.products.categories.cancel' | transloco)"
      [confirmDisabled]="form.invalid || isSubmitting()"
      (confirm)="submitForm()"
      (cancel)="closeForm()"
    >
      <form [formGroup]="form" class="categories-pane__form" (ngSubmit)="submitForm()">
        <label class="categories-pane__field">
          <span>{{ 'admin.products.categories.field_name_en' | transloco }}</span>
          <input type="text" formControlName="name" />
        </label>
        <label class="categories-pane__field">
          <span>{{ 'admin.products.categories.field_name_ar' | transloco }}</span>
          <input type="text" formControlName="nameAr" dir="rtl" />
        </label>
        <label class="categories-pane__field">
          <span>{{ 'admin.products.categories.field_type' | transloco }}</span>
          <select formControlName="type">
            @for (type of typeOptions; track type) {
              <option [value]="type">{{ 'admin.products.types.' + typeKey(type) | transloco }}</option>
            }
          </select>
        </label>
        <label class="categories-pane__field">
          <span>{{ 'admin.products.categories.field_season' | transloco }}</span>
          <select formControlName="season">
            @for (season of seasonOptions; track season) {
              <option [value]="season">{{ 'admin.products.seasons.' + seasonKey(season) | transloco }}</option>
            }
          </select>
        </label>
      </form>
    </admin-confirm-dialog>

    <admin-confirm-dialog
      [open]="deleteDialogOpen()"
      [title]="('admin.products.categories.delete_title' | transloco)"
      [description]="('admin.products.categories.delete_confirm' | transloco)"
      [confirmLabel]="('admin.products.categories.delete' | transloco)"
      [cancelLabel]="('admin.products.categories.cancel' | transloco)"
      tone="danger"
      [confirmDisabled]="isSubmitting()"
      (confirm)="confirmDelete()"
      (cancel)="closeDelete()"
    ></admin-confirm-dialog>
  `,
  styles: [
    `
      :host { display: block; }
      .categories-pane {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .categories-pane__header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
        flex-wrap: wrap;
      }
      @media (max-width: 767px) {
        .categories-pane__header {
          flex-direction: column;
          align-items: stretch;
        }
        .categories-pane__add {
          align-self: flex-end;
        }
      }
      .categories-pane__filters {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .categories-pane__filter-label {
        font-size: 0.8125rem;
        color: var(--color-text-secondary, #64748b);
        font-weight: 600;
      }
      .categories-pane__divider {
        color: var(--color-text-tertiary, #94a3b8);
        margin: 0 0.25rem;
      }
      .categories-pane__chip {
        padding: 0.5rem 0.875rem;
        border-radius: 9999px;
        background: transparent;
        border: 1px solid var(--color-border, #e2e8f0);
        color: var(--color-text-primary, #0f172a);
        font-size: 0.8125rem;
        font-weight: 500;
        cursor: pointer;
        min-height: 44px;
        transition: background 0.15s ease, border-color 0.15s ease;
      }
      .categories-pane__chip:hover {
        background: var(--color-surface-subtle, #f1f5f9);
      }
      .categories-pane__chip.is-active {
        background: #0fbd66;
        border-color: #0fbd66;
        color: #ffffff;
      }
      .categories-pane__add {
        background: #0fbd66;
        color: #ffffff;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 0.625rem;
        font-weight: 600;
        cursor: pointer;
        min-height: 40px;
      }
      .categories-pane__add:hover {
        background: #0a8a4a;
      }
      .categories-pane__row-actions {
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
      }
      .categories-pane__row-btn {
        background: transparent;
        border: 1px solid var(--color-border, #e2e8f0);
        padding: 0.375rem 0.75rem;
        border-radius: 0.5rem;
        font-size: 0.8125rem;
        cursor: pointer;
        min-height: 44px;
      }
      .categories-pane__row-btn:hover {
        background: var(--color-surface-subtle, #f1f5f9);
      }
      .categories-pane__row-btn--danger {
        color: #b3142f;
        border-color: #fecaca;
      }
      .categories-pane__row-btn--danger:hover {
        background: #fef2f2;
      }
      .categories-pane__form {
        display: flex;
        flex-direction: column;
        gap: 0.875rem;
      }
      .categories-pane__field {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
        font-size: 0.8125rem;
      }
      .categories-pane__field span {
        font-weight: 600;
        color: var(--color-text-secondary, #64748b);
      }
      .categories-pane__field input,
      .categories-pane__field select {
        height: 44px;
        padding: 0 0.75rem;
        border-radius: 0.5rem;
        border: 1px solid var(--color-border, #e2e8f0);
        font-size: 0.875rem;
        background: #ffffff;
      }
      .categories-pane__field input:focus,
      .categories-pane__field select:focus {
        outline: none;
        border-color: #0fbd66;
        box-shadow: 0 0 0 3px rgba(15, 189, 102, 0.2);
      }
    `,
  ],
})
export class CategoriesPaneComponent implements OnInit {
  protected readonly store = inject(CategoriesStore);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('nameCell', { static: true }) private nameCell!: TemplateRef<{ $implicit: CategoryDto }>;
  @ViewChild('typeCell', { static: true }) private typeCell!: TemplateRef<{ $implicit: CategoryDto }>;
  @ViewChild('seasonCell', { static: true }) private seasonCell!: TemplateRef<{ $implicit: CategoryDto }>;
  @ViewChild('actionsCell', { static: true }) private actionsCell!: TemplateRef<{ $implicit: CategoryDto }>;

  readonly typeOptions = TYPE_OPTIONS;
  readonly seasonOptions = SEASON_OPTIONS;

  readonly editingCategory = signal<CategoryDto | null>(null);
  readonly formDialogOpen = signal(false);
  readonly deleteTarget = signal<CategoryDto | null>(null);
  readonly deleteDialogOpen = signal(false);
  readonly isSubmitting = signal(false);

  readonly form = this.fb.group({
    name: this.fb.control('', [Validators.required, Validators.minLength(2)]),
    nameAr: this.fb.control('', [Validators.required, Validators.minLength(2)]),
    type: this.fb.control<CategoryType>('Fruit', [Validators.required]),
    season: this.fb.control<CategorySeason>('AllYear', [Validators.required]),
  });

  columns: AdminDataTableColumn<CategoryDto>[] = [];

  ngOnInit(): void {
    this.store.ensureLoaded();

    this.transloco.langChanges$
      .pipe(
        switchMap((lang) => this.transloco.load(lang)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.buildColumns());
  }

  private buildColumns(): void {
    this.columns = [
      {
        key: 'name',
        headerKey: this.transloco.translate('admin.products.categories.col_name'),
        cell: this.nameCell,
      },
      {
        key: 'type',
        headerKey: this.transloco.translate('admin.products.categories.col_type'),
        cell: this.typeCell,
      },
      {
        key: 'season',
        headerKey: this.transloco.translate('admin.products.categories.col_season'),
        cell: this.seasonCell,
      },
      {
        key: 'actions',
        headerKey: '',
        cell: this.actionsCell,
        align: 'end',
      },
    ];
    this.cdr.markForCheck();
  }

  trackById = (row: CategoryDto): string => row.id;

  typeKey(type: CategoryType | CategoryTypeFilter): string {
    if (type === 'all') return 'all';
    return type.toLowerCase();
  }

  seasonKey(season: CategorySeason | CategorySeasonFilter): string {
    if (season === 'all') return 'all';
    return season === 'AllYear' ? 'all_year' : season.toLowerCase();
  }

  formDialogTitle(): string {
    const editing = this.editingCategory();
    return editing
      ? this.transloco.translate('admin.products.categories.edit_title')
      : this.transloco.translate('admin.products.categories.create_title');
  }

  openCreate(): void {
    this.editingCategory.set(null);
    this.form.reset({ name: '', nameAr: '', type: 'Fruit', season: 'AllYear' });
    this.formDialogOpen.set(true);
  }

  openEdit(category: CategoryDto): void {
    this.editingCategory.set(category);
    this.form.reset({
      name: category.name,
      nameAr: category.nameAr,
      type: category.type,
      season: category.season,
    });
    this.formDialogOpen.set(true);
  }

  closeForm(): void {
    if (this.isSubmitting()) return;
    this.formDialogOpen.set(false);
  }

  submitForm(): void {
    if (this.form.invalid || this.isSubmitting()) return;
    const value = this.form.getRawValue();
    const editing = this.editingCategory();

    this.isSubmitting.set(true);
    const promise = editing
      ? this.store.update(editing.id, value)
      : this.store.create(value);

    promise
      .then(() => {
        this.toast.success(
          this.transloco.translate(
            editing
              ? 'admin.products.categories.toast_updated'
              : 'admin.products.categories.toast_created',
          ),
        );
        this.formDialogOpen.set(false);
        this.editingCategory.set(null);
      })
      .catch((message: string) => {
        this.toast.error(message || this.transloco.translate('common.error.generic'));
      })
      .finally(() => this.isSubmitting.set(false));
  }

  askDelete(category: CategoryDto): void {
    this.deleteTarget.set(category);
    this.deleteDialogOpen.set(true);
  }

  closeDelete(): void {
    if (this.isSubmitting()) return;
    this.deleteDialogOpen.set(false);
    this.deleteTarget.set(null);
  }

  confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.store
      .delete(target.id)
      .then(() => {
        this.toast.success(this.transloco.translate('admin.products.categories.toast_deleted'));
        this.deleteDialogOpen.set(false);
        this.deleteTarget.set(null);
      })
      .catch((message: string) => {
        this.toast.error(message || this.transloco.translate('admin.products.categories.delete_failed'));
      })
      .finally(() => this.isSubmitting.set(false));
  }
}
