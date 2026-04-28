import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { AdminPageComponent } from '../../layout/admin-page/admin-page.component';
import { AdminPageHeaderComponent } from '../../layout/admin-page-header/admin-page-header.component';
import { AdminSectionCardComponent } from '../../layout/admin-section-card/admin-section-card.component';
import { AdminConfirmDialogComponent } from '../../shared/ui/confirm-dialog.component';
import { ToastService } from '../../shared/toasts/toast.service';

import {
  CreateProductPayload,
  LocalizedProductOption,
  ProductSeason,
  ProductState,
  ProductStatus,
  ProductType,
  UpdateProductPayload,
} from '../../../core/products/product.service';

import { AdminCatalogStore } from './admin-catalog.store';
import { ProductEditStore } from './product-edit.store';
import { OptionsListEditorComponent } from './components/options-list-editor.component';
import { ImageGalleryEditorComponent } from './components/image-gallery-editor.component';

const PRODUCT_TYPES: ProductType[] = ['Fruit', 'Vegetable'];
const PRODUCT_STATES: ProductState[] = ['Fresh', 'Frozen'];
const PRODUCT_SEASONS: ProductSeason[] = ['Summer', 'Winter', 'AllYear'];
const PRODUCT_STATUSES: ProductStatus[] = ['Valid', 'ComingSoon', 'Invalid'];

@Component({
  selector: 'app-admin-product-edit-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslocoPipe,
    AdminPageComponent,
    AdminPageHeaderComponent,
    AdminSectionCardComponent,
    AdminConfirmDialogComponent,
    OptionsListEditorComponent,
    ImageGalleryEditorComponent,
  ],
  providers: [ProductEditStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <admin-page>
      <admin-page-header
        [title]="
          (mode() === 'new'
            ? 'admin.products.form.title_new'
            : 'admin.products.form.title_edit'
          ) | transloco
        "
        [subtitle]="subtitle()"
      >
        <div slot="actions" class="product-edit__header-actions">
          <button type="button" class="product-edit__btn product-edit__btn--ghost" (click)="cancel()">
            {{ 'admin.products.form.cancel' | transloco }}
          </button>
          @if (mode() === 'edit') {
            <button
              type="button"
              class="product-edit__btn product-edit__btn--danger"
              [disabled]="store.isDeleting() || store.isSaving()"
              (click)="askDelete()"
            >
              {{ 'admin.products.form.delete' | transloco }}
            </button>
          }
          <button
            type="button"
            class="product-edit__btn product-edit__btn--primary"
            [disabled]="form.invalid || store.isSaving()"
            (click)="save()"
          >
            @if (store.isSaving()) {
              <span class="material-symbols-outlined product-edit__spin">progress_activity</span>
              {{ 'admin.products.form.saving' | transloco }}
            } @else {
              {{ 'admin.products.form.save' | transloco }}
            }
          </button>
        </div>
      </admin-page-header>

      @if (store.isLoading()) {
        <admin-section-card>
          <p class="product-edit__loading">{{ 'common.loading' | transloco }}</p>
        </admin-section-card>
      } @else if (store.hasError()) {
        <admin-section-card>
          <div class="product-edit__error" role="alert">
            <p>{{ store.errorMessage() || ('common.error.generic' | transloco) }}</p>
            <button type="button" class="product-edit__btn product-edit__btn--ghost" (click)="cancel()">
              {{ 'admin.products.form.cancel' | transloco }}
            </button>
          </div>
        </admin-section-card>
      } @else {
        <form [formGroup]="form" (ngSubmit)="save()" class="product-edit__form">

          <admin-section-card [title]="'admin.products.form.section_basic' | transloco">
            <div class="product-edit__grid">
              <label class="product-edit__field">
                <span class="product-edit__label">
                  {{ 'admin.products.form.field_name_en' | transloco }} *
                </span>
                <input type="text" class="product-edit__input" formControlName="name" />
                @if (showError('name', 'required')) {
                  <small class="product-edit__error-text">
                    {{ 'admin.products.form.err_name_required' | transloco }}
                  </small>
                }
              </label>

              <label class="product-edit__field">
                <span class="product-edit__label">
                  {{ 'admin.products.form.field_name_ar' | transloco }} *
                </span>
                <input
                  type="text"
                  class="product-edit__input"
                  formControlName="nameAr"
                  dir="rtl"
                />
              </label>

              <label class="product-edit__field">
                <span class="product-edit__label">
                  {{ 'admin.products.form.field_sku' | transloco }} *
                </span>
                <input
                  type="text"
                  class="product-edit__input product-edit__input--mono"
                  formControlName="sku"
                  [readOnly]="mode() === 'edit'"
                />
                @if (showError('sku', 'required')) {
                  <small class="product-edit__error-text">
                    {{ 'admin.products.form.err_sku_required' | transloco }}
                  </small>
                }
              </label>

              <label class="product-edit__field">
                <span class="product-edit__label">
                  {{ 'admin.products.form.field_price' | transloco }} *
                </span>
                <input
                  type="number"
                  class="product-edit__input product-edit__input--num"
                  formControlName="price"
                  step="0.01"
                  min="0"
                />
                @if (showError('price', 'min') || showError('price', 'required')) {
                  <small class="product-edit__error-text">
                    {{ 'admin.products.form.err_price_invalid' | transloco }}
                  </small>
                }
              </label>

              <label class="product-edit__field">
                <span class="product-edit__label">
                  {{
                    (mode() === 'new'
                      ? 'admin.products.form.field_opening_stock'
                      : 'admin.products.form.field_stock'
                    ) | transloco
                  }} *
                </span>
                <input
                  type="number"
                  class="product-edit__input product-edit__input--num"
                  formControlName="stock"
                  step="1"
                  min="0"
                />
                @if (showError('stock', 'min') || showError('stock', 'required')) {
                  <small class="product-edit__error-text">
                    {{ 'admin.products.form.err_stock_invalid' | transloco }}
                  </small>
                }
              </label>

              @if (mode() === 'edit') {
                <label class="product-edit__field">
                  <span class="product-edit__label">
                    {{ 'admin.products.form.field_status' | transloco }}
                  </span>
                  <select
                    class="product-edit__input"
                    [value]="status()"
                    [disabled]="isStatusSaving()"
                    (change)="onStatusChange($event)"
                  >
                    @for (s of statuses; track s) {
                      <option [value]="s">
                        {{ 'admin.products.statuses.' + statusKey(s) | transloco }}
                      </option>
                    }
                  </select>
                </label>
              }
            </div>

            <div class="product-edit__grid product-edit__grid--two">
              <label class="product-edit__field">
                <span class="product-edit__label">
                  {{ 'admin.products.form.field_desc_en' | transloco }}
                </span>
                <textarea
                  class="product-edit__textarea"
                  formControlName="descriptionEn"
                  rows="4"
                ></textarea>
              </label>
              <label class="product-edit__field">
                <span class="product-edit__label">
                  {{ 'admin.products.form.field_desc_ar' | transloco }}
                </span>
                <textarea
                  class="product-edit__textarea"
                  formControlName="descriptionAr"
                  dir="rtl"
                  rows="4"
                ></textarea>
              </label>
            </div>
          </admin-section-card>

          <admin-section-card [title]="'admin.products.form.section_classification' | transloco">
            <div class="product-edit__grid">
              <label class="product-edit__field">
                <span class="product-edit__label">
                  {{ 'admin.products.form.field_type' | transloco }}
                </span>
                <select class="product-edit__input" formControlName="productType">
                  @for (t of types; track t) {
                    <option [value]="t">
                      {{ 'admin.products.types.' + t.toLowerCase() | transloco }}
                    </option>
                  }
                </select>
              </label>
              <label class="product-edit__field">
                <span class="product-edit__label">
                  {{ 'admin.products.form.field_state' | transloco }}
                </span>
                <select class="product-edit__input" formControlName="productState">
                  @for (st of states; track st) {
                    <option [value]="st">
                      {{ 'admin.products.states.' + st.toLowerCase() | transloco }}
                    </option>
                  }
                </select>
              </label>
              <label class="product-edit__field">
                <span class="product-edit__label">
                  {{ 'admin.products.form.field_season' | transloco }}
                </span>
                <select class="product-edit__input" formControlName="season">
                  @for (s of seasons; track s) {
                    <option [value]="s">
                      {{ 'admin.products.seasons.' + seasonKey(s) | transloco }}
                    </option>
                  }
                </select>
              </label>
            </div>
          </admin-section-card>

          <admin-section-card [title]="'admin.products.form.section_specs' | transloco">
            <div class="product-edit__options-grid">
              <app-options-list-editor
                [label]="'admin.products.form.field_varieties' | transloco"
                [items]="varieties()"
                (itemsChange)="varieties.set($event)"
              ></app-options-list-editor>

              <app-options-list-editor
                [label]="'admin.products.form.field_packaging' | transloco"
                [items]="packagingOptions()"
                (itemsChange)="packagingOptions.set($event)"
              ></app-options-list-editor>

              <app-options-list-editor
                [label]="'admin.products.form.field_weight' | transloco"
                [items]="weightOptions()"
                (itemsChange)="weightOptions.set($event)"
              ></app-options-list-editor>

              <app-options-list-editor
                [label]="'admin.products.form.field_size' | transloco"
                [items]="sizeOptions()"
                (itemsChange)="sizeOptions.set($event)"
              ></app-options-list-editor>

              <app-options-list-editor
                [label]="'admin.products.form.field_grade' | transloco"
                [items]="gradeOptions()"
                (itemsChange)="gradeOptions.set($event)"
              ></app-options-list-editor>
            </div>
          </admin-section-card>

          <admin-section-card [title]="'admin.products.form.section_images' | transloco">
            <app-image-gallery-editor
              [productId]="productId()"
              [images]="store.product()?.images ?? []"
              [isUploading]="store.isUploading()"
              (upload)="onImageUpload($event)"
              (delete)="onImageDelete($event)"
            ></app-image-gallery-editor>
          </admin-section-card>

          <div class="product-edit__footer">
            <button type="button" class="product-edit__btn product-edit__btn--ghost" (click)="cancel()">
              {{ 'admin.products.form.cancel' | transloco }}
            </button>
            <button
              type="submit"
              class="product-edit__btn product-edit__btn--primary"
              [disabled]="form.invalid || store.isSaving()"
            >
              @if (store.isSaving()) {
                <span class="material-symbols-outlined product-edit__spin">progress_activity</span>
                {{ 'admin.products.form.saving' | transloco }}
              } @else {
                {{ 'admin.products.form.save' | transloco }}
              }
            </button>
          </div>
        </form>
      }
    </admin-page>

    <admin-confirm-dialog
      [open]="deleteOpen()"
      [title]="'admin.products.form.delete_title' | transloco"
      [description]="'admin.products.form.delete_confirm' | transloco"
      [confirmLabel]="'admin.products.list.delete_confirm_action' | transloco"
      [cancelLabel]="'common.actions.cancel' | transloco"
      tone="danger"
      [confirmDisabled]="store.isDeleting()"
      (confirm)="confirmDelete()"
      (cancel)="deleteOpen.set(false)"
    ></admin-confirm-dialog>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .product-edit__header-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .product-edit__btn {
        min-height: 44px;
        padding: 0 1.25rem;
        border-radius: 0.625rem;
        font-weight: 600;
        font-size: 0.875rem;
        cursor: pointer;
        border: 1px solid transparent;
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
      }
      .product-edit__btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .product-edit__btn--primary {
        background: #0fbd66;
        color: #ffffff;
      }
      .product-edit__btn--primary:hover:not(:disabled) {
        background: #0a8a4a;
      }
      .product-edit__btn--ghost {
        background: transparent;
        border-color: var(--color-border, #e2e8f0);
        color: var(--color-text-primary, #0f172a);
      }
      .product-edit__btn--ghost:hover:not(:disabled) {
        background: var(--color-surface-subtle, #f1f5f9);
      }
      .product-edit__btn--danger {
        background: #fff1f2;
        border-color: #fecaca;
        color: #b3142f;
      }
      .product-edit__btn--danger:hover:not(:disabled) {
        background: #fee2e2;
      }
      .product-edit__form {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }
      .product-edit__grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1rem;
      }
      .product-edit__grid--two {
        grid-template-columns: 1fr 1fr;
        margin-top: 1rem;
      }
      @media (max-width: 767px) {
        .product-edit__grid--two {
          grid-template-columns: 1fr;
        }
      }
      .product-edit__field {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
      }
      .product-edit__label {
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--color-text-secondary, #64748b);
      }
      .product-edit__input,
      .product-edit__textarea {
        padding: 0 0.875rem;
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: 0.5rem;
        font-size: 0.875rem;
        background: #ffffff;
        color: var(--color-text-primary, #0f172a);
        font-family: inherit;
      }
      .product-edit__input {
        height: 44px;
      }
      .product-edit__input--mono {
        font-family: ui-monospace, SFMono-Regular, monospace;
        text-transform: uppercase;
      }
      .product-edit__input--num {
        font-variant-numeric: tabular-nums;
      }
      .product-edit__input[readonly] {
        background: var(--color-surface-subtle, #f1f5f9);
        color: var(--color-text-tertiary, #94a3b8);
      }
      .product-edit__textarea {
        padding: 0.625rem 0.875rem;
        line-height: 1.5;
        resize: vertical;
        min-height: 96px;
      }
      .product-edit__input:focus,
      .product-edit__textarea:focus {
        outline: none;
        border-color: #0fbd66;
        box-shadow: 0 0 0 3px rgba(15, 189, 102, 0.18);
      }
      .product-edit__error-text {
        font-size: 0.75rem;
        color: #b3142f;
      }
      .product-edit__options-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1rem;
      }
      .product-edit__footer {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        padding-top: 0.5rem;
      }
      .product-edit__loading,
      .product-edit__error {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: 1rem;
        padding: 2rem;
        text-align: center;
        color: var(--color-text-secondary, #64748b);
      }
      .product-edit__error {
        color: #7f1d1d;
      }
      .product-edit__spin {
        animation: product-edit-spin 0.9s linear infinite;
      }
      @keyframes product-edit-spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class AdminProductEditPageComponent implements OnInit {
  protected readonly store = inject(ProductEditStore);
  private readonly catalog = inject(AdminCatalogStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);

  readonly statuses = PRODUCT_STATUSES;
  readonly types = PRODUCT_TYPES;
  readonly states = PRODUCT_STATES;
  readonly seasons = PRODUCT_SEASONS;

  readonly mode = signal<'new' | 'edit'>('new');
  readonly productId = signal<string | null>(null);
  readonly status = signal<ProductStatus>('Valid');
  readonly isStatusSaving = signal(false);
  readonly deleteOpen = signal(false);

  readonly varieties = signal<LocalizedProductOption[]>([]);
  readonly packagingOptions = signal<LocalizedProductOption[]>([]);
  readonly weightOptions = signal<LocalizedProductOption[]>([]);
  readonly sizeOptions = signal<LocalizedProductOption[]>([]);
  readonly gradeOptions = signal<LocalizedProductOption[]>([]);

  readonly subtitle = computed(() => {
    const product = this.store.product();
    return product ? product.sku : '';
  });

  readonly form = this.fb.group({
    name: this.fb.control('', [Validators.required, Validators.minLength(1)]),
    nameAr: this.fb.control(''),
    sku: this.fb.control('', [Validators.required, Validators.minLength(1)]),
    price: this.fb.control(0, [Validators.required, Validators.min(0)]),
    stock: this.fb.control(0, [Validators.required, Validators.min(0)]),
    descriptionEn: this.fb.control(''),
    descriptionAr: this.fb.control(''),
    productType: this.fb.control<ProductType>('Fruit', [Validators.required]),
    productState: this.fb.control<ProductState>('Fresh', [Validators.required]),
    season: this.fb.control<ProductSeason>('AllYear', [Validators.required]),
  });

  ngOnInit(): void {
    this.catalog.ensureLoaded();

    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const id = params.get('id');
        if (id) {
          this.mode.set('edit');
          this.productId.set(id);
          this.loadForEdit(id);
        } else {
          this.mode.set('new');
          this.productId.set(null);
          this.store.reset();
          this.resetFormForNew();
        }
      });
  }

  private async loadForEdit(productId: string): Promise<void> {
    try {
      const product = await this.store.load(productId);
      this.form.patchValue({
        name: product.name,
        nameAr: product.nameAr,
        sku: product.sku,
        price: product.price,
        stock: product.stockQuantity,
        descriptionEn: product.descriptionEn,
        descriptionAr: product.descriptionAr,
        productType: product.productType,
        productState: product.productState,
        season: product.season,
      });
      this.status.set(product.status);
      this.varieties.set(this.toLocalizedItems(product.varietiesLocalized, product.varieties));
      this.packagingOptions.set(
        this.toLocalizedItems(product.packagingOptionsLocalized, product.packagingOptions),
      );
      this.weightOptions.set(
        this.toLocalizedItems(product.weightOptionsLocalized, product.weightOptions),
      );
      this.sizeOptions.set(
        this.toLocalizedItems(product.sizeOptionsLocalized, product.sizeOptions),
      );
      this.gradeOptions.set(
        this.toLocalizedItems(product.gradeOptionsLocalized, product.gradeOptions),
      );
    } catch {
      // error already surfaced via store.errorMessage
    }
  }

  private resetFormForNew(): void {
    this.form.reset({
      name: '',
      nameAr: '',
      sku: '',
      price: 0,
      stock: 0,
      descriptionEn: '',
      descriptionAr: '',
      productType: 'Fruit',
      productState: 'Fresh',
      season: 'AllYear',
    });
    this.varieties.set([]);
    this.packagingOptions.set([]);
    this.weightOptions.set([]);
    this.sizeOptions.set([]);
    this.gradeOptions.set([]);
    this.status.set('Valid');
  }

  showError(controlName: string, error: string): boolean {
    const control = this.form.get(controlName);
    if (!control) return false;
    return control.hasError(error) && (control.dirty || control.touched);
  }

  statusKey(status: ProductStatus): string {
    return status === 'ComingSoon' ? 'coming_soon' : status.toLowerCase();
  }

  seasonKey(season: ProductSeason): string {
    return season === 'AllYear' ? 'all_year' : season.toLowerCase();
  }

  async save(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.store.isSaving()) return;
    const value = this.form.getRawValue();

    if (this.mode() === 'new') {
      const payload: CreateProductPayload = {
        name: value.name,
        nameAr: value.nameAr,
        sku: value.sku,
        price: Number(value.price),
        openingStock: Math.trunc(Number(value.stock)),
        descriptionEn: value.descriptionEn,
        descriptionAr: value.descriptionAr,
        productType: value.productType,
        productState: value.productState,
        season: value.season,
        varieties: this.localizedToLegacy(this.varieties()),
        varietiesLocalized: this.varieties(),
        packagingOptions: this.localizedToLegacy(this.packagingOptions()),
        packagingOptionsLocalized: this.packagingOptions(),
        weightOptions: this.localizedToLegacy(this.weightOptions()),
        weightOptionsLocalized: this.weightOptions(),
        sizeOptions: this.localizedToLegacy(this.sizeOptions()),
        sizeOptionsLocalized: this.sizeOptions(),
        gradeOptions: this.localizedToLegacy(this.gradeOptions()),
        gradeOptionsLocalized: this.gradeOptions(),
      };

      try {
        const newId = await this.store.create(payload);
        this.toast.success(this.transloco.translate('admin.products.form.toast_created'));
        this.catalog.reload();
        this.router.navigate(['/admin/products', newId, 'edit']);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : this.transloco.translate('common.error.generic');
        this.toast.error(
          message || this.transloco.translate('admin.products.form.toast_create_failed'),
        );
      }
      return;
    }

    const productId = this.productId();
    if (!productId) return;
    const updatePayload: UpdateProductPayload = {
      name: value.name,
      nameAr: value.nameAr,
      price: Number(value.price),
      stockQuantity: Math.trunc(Number(value.stock)),
      descriptionEn: value.descriptionEn,
      descriptionAr: value.descriptionAr,
      productType: value.productType,
      productState: value.productState,
      season: value.season,
      varieties: this.localizedToLegacy(this.varieties()),
      varietiesLocalized: this.varieties(),
      packagingOptions: this.localizedToLegacy(this.packagingOptions()),
      packagingOptionsLocalized: this.packagingOptions(),
      weightOptions: this.localizedToLegacy(this.weightOptions()),
      weightOptionsLocalized: this.weightOptions(),
      sizeOptions: this.localizedToLegacy(this.sizeOptions()),
      sizeOptionsLocalized: this.sizeOptions(),
      gradeOptions: this.localizedToLegacy(this.gradeOptions()),
      gradeOptionsLocalized: this.gradeOptions(),
    };

    try {
      await this.store.update(productId, updatePayload);
      this.toast.success(this.transloco.translate('admin.products.form.toast_updated'));
      this.form.markAsPristine();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : this.transloco.translate('common.error.generic');
      this.toast.error(
        message || this.transloco.translate('admin.products.form.toast_update_failed'),
      );
    }
  }

  async onStatusChange(event: Event): Promise<void> {
    const productId = this.productId();
    if (!productId) return;
    const value = (event.target as HTMLSelectElement).value as ProductStatus;
    if (value === this.status()) return;

    const previous = this.status();
    this.status.set(value);
    this.isStatusSaving.set(true);
    try {
      await this.store.changeStatus(productId, value);
      this.toast.success(
        this.transloco.translate('admin.products.list.toast_status_updated'),
      );
    } catch (error) {
      this.status.set(previous);
      const message =
        error instanceof Error ? error.message : this.transloco.translate('common.error.generic');
      this.toast.error(
        message || this.transloco.translate('admin.products.list.toast_status_failed'),
      );
    } finally {
      this.isStatusSaving.set(false);
    }
  }

  async onImageUpload(files: File[]): Promise<void> {
    const productId = this.productId();
    if (!productId || files.length === 0) return;
    try {
      await this.store.uploadImages(productId, files);
      this.toast.success(this.transloco.translate('admin.products.form.toast_image_uploaded'));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : this.transloco.translate('common.error.generic');
      this.toast.error(
        message || this.transloco.translate('admin.products.form.toast_image_upload_failed'),
      );
    }
  }

  async onImageDelete(imageId: string): Promise<void> {
    const productId = this.productId();
    if (!productId) return;
    try {
      await this.store.deleteImage(productId, imageId);
      this.toast.success(this.transloco.translate('admin.products.form.toast_image_deleted'));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : this.transloco.translate('common.error.generic');
      this.toast.error(
        message || this.transloco.translate('admin.products.form.toast_image_delete_failed'),
      );
    }
  }

  askDelete(): void {
    if (this.mode() !== 'edit') return;
    this.deleteOpen.set(true);
  }

  async confirmDelete(): Promise<void> {
    const productId = this.productId();
    if (!productId) return;
    try {
      await this.store.deleteProduct(productId);
      this.toast.success(this.transloco.translate('admin.products.list.toast_deleted'));
      this.deleteOpen.set(false);
      this.router.navigate(['/admin/products']);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : this.transloco.translate('common.error.generic');
      this.toast.error(
        message || this.transloco.translate('admin.products.list.toast_delete_failed'),
      );
    }
  }

  cancel(): void {
    this.router.navigate(['/admin/products']);
  }

  private toLocalizedItems(
    localized: LocalizedProductOption[] | undefined,
    legacy: string[] | undefined,
  ): LocalizedProductOption[] {
    if (localized && localized.length > 0) {
      return localized.map((option, index) => ({
        key: option.key || `option-${index + 1}`,
        labelEn: option.labelEn ?? '',
        labelAr: option.labelAr ?? '',
      }));
    }
    if (legacy && legacy.length > 0) {
      return legacy
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
        .map((value, index) => ({
          key: this.slugify(value) || `option-${index + 1}`,
          labelEn: value,
          labelAr: '',
        }));
    }
    return [];
  }

  private localizedToLegacy(items: LocalizedProductOption[]): string[] {
    const out: string[] = [];
    const seen = new Set<string>();
    for (const item of items) {
      const value = (item.labelEn || item.labelAr || '').trim();
      if (!value || seen.has(value)) continue;
      seen.add(value);
      out.push(value);
    }
    return out;
  }

  private slugify(value: string): string {
    return (
      value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9؀-ۿ]+/gi, '-')
        .replace(/^-+|-+$/g, '') || 'option'
    );
  }
}
