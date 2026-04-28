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
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { startWith } from 'rxjs';

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
const PRODUCT_DRAFT_KEY = 'alatar.admin.product-draft';
const PRODUCT_DRAFT_VERSION = 1;
const PRODUCT_DRAFT_SAVE_DELAY_MS = 250;

type ProductMode = 'new' | 'edit';
type DraftState = 'idle' | 'saved' | 'restored' | 'error';

type ProductDraftSnapshot = {
  name: string;
  nameAr: string;
  sku: string;
  price: number;
  stock: number;
  descriptionEn: string;
  descriptionAr: string;
  productType: ProductType;
  productState: ProductState;
  season: ProductSeason;
  varieties: LocalizedProductOption[];
  packagingOptions: LocalizedProductOption[];
  weightOptions: LocalizedProductOption[];
  sizeOptions: LocalizedProductOption[];
  gradeOptions: LocalizedProductOption[];
};

type PersistedProductDraft = {
  version: number;
  savedAt: string;
  data: ProductDraftSnapshot;
};

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
  templateUrl: './product-edit.page.html',
  styleUrl: './product-edit.page.css',
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

  readonly mode = signal<ProductMode>('new');
  readonly productId = signal<string | null>(null);
  readonly status = signal<ProductStatus>('Valid');
  readonly isStatusSaving = signal(false);
  readonly deleteOpen = signal(false);
  readonly imageDeletingId = signal<string | null>(null);

  readonly varieties = signal<LocalizedProductOption[]>([]);
  readonly packagingOptions = signal<LocalizedProductOption[]>([]);
  readonly weightOptions = signal<LocalizedProductOption[]>([]);
  readonly sizeOptions = signal<LocalizedProductOption[]>([]);
  readonly gradeOptions = signal<LocalizedProductOption[]>([]);

  readonly baselineSnapshot = signal<ProductDraftSnapshot | null>(null);
  readonly draftState = signal<DraftState>('idle');
  readonly draftSavedAt = signal<string | null>(null);

  private readonly draftSyncEnabled = signal(false);
  private draftSaveTimer: ReturnType<typeof setTimeout> | null = null;

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

  private readonly activeLang = toSignal(
    this.transloco.langChanges$.pipe(startWith(this.transloco.getActiveLang())),
    { initialValue: this.transloco.getActiveLang() },
  );

  private readonly formValue = toSignal(
    this.form.valueChanges.pipe(startWith(this.form.getRawValue())),
    { initialValue: this.form.getRawValue() },
  );

  readonly draftKey = computed(() => this.composeDraftKey(this.mode(), this.productId()));

  readonly currentSnapshot = computed<ProductDraftSnapshot>(() => {
    const value = this.formValue();

    return this.buildSnapshot({
      name: value.name,
      nameAr: value.nameAr,
      sku: value.sku,
      price: value.price,
      stock: value.stock,
      descriptionEn: value.descriptionEn,
      descriptionAr: value.descriptionAr,
      productType: value.productType,
      productState: value.productState,
      season: value.season,
      varieties: this.varieties(),
      packagingOptions: this.packagingOptions(),
      weightOptions: this.weightOptions(),
      sizeOptions: this.sizeOptions(),
      gradeOptions: this.gradeOptions(),
    });
  });

  readonly completion = computed(() => {
    const snapshot = this.currentSnapshot();
    const checks = [
      snapshot.name.trim().length > 0,
      snapshot.sku.trim().length > 0,
      Number.isFinite(snapshot.price) && snapshot.price >= 0,
      Number.isFinite(snapshot.stock) && snapshot.stock >= 0,
    ];
    const total = checks.length;
    const complete = checks.filter(Boolean).length;
    const percent = Math.round((complete / total) * 100);

    return { complete, total, percent };
  });

  readonly optionCount = computed(
    () =>
      this.varieties().length +
      this.packagingOptions().length +
      this.weightOptions().length +
      this.sizeOptions().length +
      this.gradeOptions().length,
  );

  readonly imageCount = computed(() => this.store.product()?.images?.length ?? 0);

  readonly hasUnsavedChanges = computed(() => {
    const baseline = this.baselineSnapshot();
    if (!baseline) {
      return false;
    }

    return !this.snapshotsEqual(baseline, this.currentSnapshot());
  });

  readonly missingFieldKeys = computed(() => {
    const snapshot = this.currentSnapshot();
    const missing: string[] = [];

    if (!snapshot.name.trim()) {
      missing.push('admin.products.form.field_name_en');
    }

    if (!snapshot.sku.trim()) {
      missing.push('admin.products.form.field_sku');
    }

    if (!Number.isFinite(snapshot.price) || snapshot.price < 0) {
      missing.push('admin.products.form.field_price');
    }

    if (!Number.isFinite(snapshot.stock) || snapshot.stock < 0) {
      missing.push('admin.products.form.field_stock');
    }

    return missing;
  });

  readonly formattedDraftTime = computed(() => {
    const savedAt = this.draftSavedAt();
    if (!savedAt) {
      return '';
    }

    return this.formatTimestamp(savedAt);
  });

  constructor() {
    effect(() => {
      if (!this.draftSyncEnabled()) {
        return;
      }

      const baseline = this.baselineSnapshot();
      const snapshot = this.currentSnapshot();
      const key = this.draftKey();

      if (!baseline) {
        return;
      }

      this.queueDraftSave(key, baseline, snapshot);
    });

    this.destroyRef.onDestroy(() => {
      this.cancelQueuedDraftSave();
    });
  }

  ngOnInit(): void {
    this.catalog.ensureLoaded();

    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.mode.set('edit');
        this.productId.set(id);
        void this.loadForEdit(id);
        return;
      }

      this.mode.set('new');
      this.productId.set(null);
      this.store.reset();
      this.loadForNew();
    });
  }

  private async loadForEdit(productId: string): Promise<void> {
    this.prepareDraftHydration();

    try {
      const product = await this.store.load(productId);
      const snapshot = this.buildSnapshot({
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
        varieties: this.toLocalizedItems(product.varietiesLocalized, product.varieties),
        packagingOptions: this.toLocalizedItems(
          product.packagingOptionsLocalized,
          product.packagingOptions,
        ),
        weightOptions: this.toLocalizedItems(product.weightOptionsLocalized, product.weightOptions),
        sizeOptions: this.toLocalizedItems(product.sizeOptionsLocalized, product.sizeOptions),
        gradeOptions: this.toLocalizedItems(product.gradeOptionsLocalized, product.gradeOptions),
      });

      this.status.set(product.status);
      this.applySnapshot(snapshot);
      this.baselineSnapshot.set(snapshot);
      this.form.markAsPristine();
      this.restoreDraftIfAvailable();
    } catch {
      // error already surfaced via store.errorMessage
    } finally {
      this.draftSyncEnabled.set(!this.store.hasError());
    }
  }

  private loadForNew(): void {
    this.prepareDraftHydration();

    const snapshot = this.buildSnapshot({
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
      varieties: [],
      packagingOptions: [],
      weightOptions: [],
      sizeOptions: [],
      gradeOptions: [],
    });

    this.store.reset();
    this.status.set('Valid');
    this.applySnapshot(snapshot);
    this.baselineSnapshot.set(snapshot);
    this.form.markAsPristine();
    this.restoreDraftIfAvailable();
    this.draftSyncEnabled.set(true);
  }

  private prepareDraftHydration(): void {
    this.cancelQueuedDraftSave();
    this.draftSyncEnabled.set(false);
    this.draftState.set('idle');
    this.draftSavedAt.set(null);
  }

  private restoreDraftIfAvailable(): void {
    const draft = this.readDraft(this.draftKey());
    if (!draft) {
      return;
    }

    this.applySnapshot(draft.data);
    this.draftState.set('restored');
    this.draftSavedAt.set(draft.savedAt);
    this.form.markAsDirty();
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

  normalizeSku(): void {
    const control = this.form.controls.sku;
    const next = control.value.trim().toUpperCase();
    if (next !== control.value) {
      control.setValue(next);
    }
  }

  async save(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.store.isSaving()) return;

    this.normalizeSku();
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
        this.clearDraft(this.composeDraftKey('new', null));
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
      this.markCurrentSnapshotAsSaved();
      this.toast.success(this.transloco.translate('admin.products.form.toast_updated'));
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
      this.toast.success(this.transloco.translate('admin.products.list.toast_status_updated'));
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
    if (!productId || this.imageDeletingId()) return;

    this.imageDeletingId.set(imageId);

    try {
      await this.store.deleteImage(productId, imageId);
      this.toast.success(this.transloco.translate('admin.products.form.toast_image_deleted'));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : this.transloco.translate('common.error.generic');
      this.toast.error(
        message || this.transloco.translate('admin.products.form.toast_image_delete_failed'),
      );
    } finally {
      this.imageDeletingId.set(null);
    }
  }

  discardLocalDraft(): void {
    const baseline = this.baselineSnapshot();
    if (!baseline) {
      return;
    }

    this.clearDraft(this.draftKey());
    this.applySnapshot(baseline);
    this.form.markAsPristine();
    this.draftState.set('idle');
    this.draftSavedAt.set(null);
    this.toast.success(this.transloco.translate('admin.products.form.toast_draft_cleared'));
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
      this.clearDraft(this.composeDraftKey('edit', productId));
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

  private applySnapshot(snapshot: ProductDraftSnapshot): void {
    this.form.reset({
      name: snapshot.name,
      nameAr: snapshot.nameAr,
      sku: snapshot.sku,
      price: snapshot.price,
      stock: snapshot.stock,
      descriptionEn: snapshot.descriptionEn,
      descriptionAr: snapshot.descriptionAr,
      productType: snapshot.productType,
      productState: snapshot.productState,
      season: snapshot.season,
    });

    this.varieties.set(this.cloneOptions(snapshot.varieties));
    this.packagingOptions.set(this.cloneOptions(snapshot.packagingOptions));
    this.weightOptions.set(this.cloneOptions(snapshot.weightOptions));
    this.sizeOptions.set(this.cloneOptions(snapshot.sizeOptions));
    this.gradeOptions.set(this.cloneOptions(snapshot.gradeOptions));
  }

  private buildSnapshot(value: Partial<ProductDraftSnapshot>): ProductDraftSnapshot {
    return {
      name: value.name ?? '',
      nameAr: value.nameAr ?? '',
      sku: value.sku ?? '',
      price: Number(value.price ?? 0),
      stock: Math.trunc(Number(value.stock ?? 0)),
      descriptionEn: value.descriptionEn ?? '',
      descriptionAr: value.descriptionAr ?? '',
      productType: value.productType ?? 'Fruit',
      productState: value.productState ?? 'Fresh',
      season: value.season ?? 'AllYear',
      varieties: this.cloneOptions(value.varieties ?? []),
      packagingOptions: this.cloneOptions(value.packagingOptions ?? []),
      weightOptions: this.cloneOptions(value.weightOptions ?? []),
      sizeOptions: this.cloneOptions(value.sizeOptions ?? []),
      gradeOptions: this.cloneOptions(value.gradeOptions ?? []),
    };
  }

  private cloneOptions(items: LocalizedProductOption[]): LocalizedProductOption[] {
    return items.map((item) => ({
      key: item.key,
      labelEn: item.labelEn,
      labelAr: item.labelAr,
    }));
  }

  private markCurrentSnapshotAsSaved(): void {
    const snapshot = this.currentSnapshot();
    this.baselineSnapshot.set(snapshot);
    this.form.markAsPristine();
    this.clearDraft(this.draftKey());
    this.draftState.set('idle');
    this.draftSavedAt.set(null);
  }

  private queueDraftSave(
    key: string,
    baseline: ProductDraftSnapshot,
    snapshot: ProductDraftSnapshot,
  ): void {
    this.cancelQueuedDraftSave();

    this.draftSaveTimer = setTimeout(() => {
      this.persistDraft(key, baseline, snapshot);
    }, PRODUCT_DRAFT_SAVE_DELAY_MS);
  }

  private cancelQueuedDraftSave(): void {
    if (this.draftSaveTimer !== null) {
      clearTimeout(this.draftSaveTimer);
      this.draftSaveTimer = null;
    }
  }

  private persistDraft(
    key: string,
    baseline: ProductDraftSnapshot,
    snapshot: ProductDraftSnapshot,
  ): void {
    this.draftSaveTimer = null;

    if (!this.canUseLocalStorage()) {
      return;
    }

    try {
      if (this.snapshotsEqual(baseline, snapshot)) {
        localStorage.removeItem(key);
        if (this.draftState() !== 'restored') {
          this.draftState.set('idle');
        }
        this.draftSavedAt.set(null);
        return;
      }

      const record: PersistedProductDraft = {
        version: PRODUCT_DRAFT_VERSION,
        savedAt: new Date().toISOString(),
        data: snapshot,
      };

      localStorage.setItem(key, JSON.stringify(record));
      this.draftState.set('saved');
      this.draftSavedAt.set(record.savedAt);
    } catch {
      this.draftState.set('error');
      this.draftSavedAt.set(null);
    }
  }

  private readDraft(key: string): PersistedProductDraft | null {
    if (!this.canUseLocalStorage()) {
      return null;
    }

    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as Partial<PersistedProductDraft>;
      if (parsed.version !== PRODUCT_DRAFT_VERSION || !parsed.data || !parsed.savedAt) {
        localStorage.removeItem(key);
        return null;
      }

      return {
        version: PRODUCT_DRAFT_VERSION,
        savedAt: parsed.savedAt,
        data: this.buildSnapshot(parsed.data),
      };
    } catch {
      return null;
    }
  }

  private clearDraft(key: string): void {
    if (!this.canUseLocalStorage()) {
      return;
    }

    try {
      localStorage.removeItem(key);
    } catch {
      this.draftState.set('error');
    }
  }

  private snapshotsEqual(a: ProductDraftSnapshot, b: ProductDraftSnapshot): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  private composeDraftKey(mode: ProductMode, productId: string | null): string {
    return `${PRODUCT_DRAFT_KEY}:${mode}:${productId ?? 'new'}`;
  }

  private canUseLocalStorage(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  private formatTimestamp(value: string): string {
    const locale = this.activeLang() === 'ar' ? 'ar-EG' : 'en-US';
    const date = new Date(value);

    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
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
        .replace(/[^a-z0-9\u0600-\u06ff]+/gi, '-')
        .replace(/^-+|-+$/g, '') || 'option'
    );
  }
}
