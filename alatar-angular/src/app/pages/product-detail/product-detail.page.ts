import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
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
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { finalize } from 'rxjs';

import { NavbarComponent } from '../../components/navbar/navbar.component';
import { API_BASE_URL } from '../../core/config/api-base-url.token';
import { OrderRequestService } from '../../core/orders/order-request.service';
import { ProductListItem } from '../../core/products/product.service';
import { ProductsStore } from '../../core/products/products.store';

type OrderSelectionField =
  | 'selectedVarieties'
  | 'selectedPackagingOptions'
  | 'selectedWeightOptions'
  | 'selectedSizeOptions'
  | 'selectedGradeOptions';

interface OrderRequestFormState {
  selectedVarieties: string[];
  selectedPackagingOptions: string[];
  selectedWeightOptions: string[];
  selectedSizeOptions: string[];
  selectedGradeOptions: string[];
  specialSpecification: string;
  requesterName: string;
  phoneNumber: string;
  quantityTons: string;
}

@Component({
  selector: 'app-product-detail-page',
  standalone: true,
  imports: [CommonModule, NavbarComponent, RouterModule, TranslocoPipe],
  templateUrl: './product-detail.page.html',
  styleUrl: './product-detail.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productsStore = inject(ProductsStore);
  private readonly orderRequestService = inject(OrderRequestService);
  private readonly translocoService = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  readonly currentLanguage = signal<'ar' | 'en' | 'ru'>('ar');
  readonly isArabicUi = computed(() => this.currentLanguage() === 'ar');

  readonly storeIsLoading = this.productsStore.isLoading;
  readonly storeHasError = this.productsStore.hasError;

  readonly productId = signal<string>('');
  readonly product = computed<ProductListItem | undefined>(() => {
    const id = this.productId();
    if (!id) return undefined;
    return this.productsStore.products().find((p) => p.id === id);
  });
  readonly notFound = computed(
    () => this.productsStore.hasLoaded() && !this.productsStore.hasError() && !this.product(),
  );

  readonly activeImageIndex = signal(0);

  readonly orderRequestForm = signal<OrderRequestFormState>(this.emptyForm());
  readonly isSubmittingOrderRequest = signal(false);
  readonly orderSubmitError = signal('');
  readonly orderSubmitSuccess = signal('');

  readonly relatedProducts = computed(() => {
    const current = this.product();
    if (!current) return [] as ProductListItem[];
    const list = this.productsStore.products();
    return list
      .filter(
        (p) =>
          p.id !== current.id &&
          p.productType === current.productType &&
          p.productState === current.productState,
      )
      .slice(0, 6);
  });

  constructor() {
    effect(() => {
      const product = this.product();
      if (product) {
        this.resetOrderRequestForm(product);
        this.activeImageIndex.set(0);
      }
    });
  }

  ngOnInit(): void {
    this.currentLanguage.set(this.normalizeLanguage(this.translocoService.getActiveLang()));

    this.translocoService.langChanges$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((lang) => this.currentLanguage.set(this.normalizeLanguage(lang)));

    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('id') ?? '';
      this.productId.set(id);
    });

    this.productsStore.ensureLoaded();
  }

  reload(): void {
    this.productsStore.reload();
  }

  imageUrl(relativePath: string): string {
    if (!relativePath) return '';
    if (relativePath.startsWith('http')) return relativePath;
    return `${this.apiBaseUrl}/${relativePath.replace(/^\//, '')}`;
  }

  hasImages(product: ProductListItem): boolean {
    return (product.imageUrls?.filter((url) => !!url && url.trim().length > 0).length ?? 0) > 0;
  }

  validImageUrls(product: ProductListItem): string[] {
    return (product.imageUrls ?? []).filter((url) => !!url && url.trim().length > 0);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const parent = img.parentElement;
    if (parent && !parent.querySelector('.image-error-fallback')) {
      const fallback = document.createElement('div');
      fallback.className =
        'image-error-fallback flex h-full w-full items-center justify-center text-slate-300';
      fallback.innerHTML = '<span class="material-symbols-outlined" style="font-size:96px">image</span>';
      parent.appendChild(fallback);
    }
  }

  setActiveImage(index: number): void {
    this.activeImageIndex.set(index);
  }

  displayPrimaryName(product: ProductListItem): string {
    if (this.isArabicUi()) {
      return (product.nameAr || product.name).trim();
    }
    return (product.name || product.nameAr).trim();
  }

  displaySecondaryName(product: ProductListItem): string | null {
    if (!this.isArabicUi()) return null;
    const secondary = (product.name || '').trim();
    const primary = this.displayPrimaryName(product);
    return secondary && !this.sameText(secondary, primary) ? secondary : null;
  }

  displayPrimaryDescription(product: ProductListItem): string {
    if (this.isArabicUi()) {
      const arabic = (product.descriptionAr || '').trim();
      return arabic || (product.descriptionEn || '').trim();
    }
    const english = (product.descriptionEn || '').trim();
    return english || (product.descriptionAr || '').trim();
  }

  seasonLabelKey(season: string): string {
    const map: Record<string, string> = {
      Summer: 'products_page.seasons.summer',
      Winter: 'products_page.seasons.winter',
      AllYear: 'products_page.seasons.all_year',
    };
    return map[season] ?? 'products_page.seasons.all_year';
  }

  categoryLabelKey(product: ProductListItem): string {
    if (product.productState === 'Frozen') return 'products_page.filters.frozen';
    if (product.productType === 'Fruit') return 'products_page.filters.fruits';
    return 'products_page.filters.vegetables';
  }

  categoryBadgeColor(product: ProductListItem): string {
    if (product.productState === 'Frozen') return 'bg-teal-700';
    if (product.productType === 'Fruit') return 'bg-orange-500';
    return 'bg-green-600';
  }

  onOrderTextFieldInput(
    field: 'requesterName' | 'phoneNumber' | 'quantityTons' | 'specialSpecification',
    value: string,
  ): void {
    this.orderRequestForm.update((current) => ({ ...current, [field]: value }));
    this.orderSubmitError.set('');
    this.orderSubmitSuccess.set('');
  }

  setOrderOption(field: OrderSelectionField, value: string): void {
    const normalized = value.trim();
    if (!normalized) return;

    this.orderRequestForm.update((current) => ({
      ...current,
      [field]: current[field].some((item) => this.sameText(item, normalized))
        ? current[field].filter((item) => !this.sameText(item, normalized))
        : [...current[field], normalized],
    }));

    this.orderSubmitError.set('');
    this.orderSubmitSuccess.set('');
  }

  isOrderOptionSelected(field: OrderSelectionField, value: string): boolean {
    return this.orderRequestForm()[field].some((item) => this.sameText(item, value));
  }

  submitOrderRequest(): void {
    const product = this.product();
    if (!product || this.isSubmittingOrderRequest()) return;

    const form = this.orderRequestForm();
    const validationMessage = this.validateOrderRequestForm(product, form);
    if (validationMessage) {
      this.orderSubmitError.set(validationMessage);
      this.orderSubmitSuccess.set('');
      return;
    }

    const quantityTons = Number.parseFloat(form.quantityTons.trim());

    this.isSubmittingOrderRequest.set(true);
    this.orderSubmitError.set('');
    this.orderSubmitSuccess.set('');

    this.orderRequestService
      .createOrderRequest({
        productId: product.id,
        selectedVarieties: [...form.selectedVarieties],
        selectedPackagingOptions: [...form.selectedPackagingOptions],
        selectedWeightOptions: [...form.selectedWeightOptions],
        selectedSizeOptions: [...form.selectedSizeOptions],
        selectedGradeOptions: [...form.selectedGradeOptions],
        specialSpecification: this.normalizeOptional(form.specialSpecification),
        requesterName: form.requesterName,
        phoneNumber: form.phoneNumber,
        quantityTons,
      })
      .pipe(
        finalize(() => this.isSubmittingOrderRequest.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.orderSubmitSuccess.set(
            this.translocoService.translate('products_page.modal.request_success'),
          );
          this.orderSubmitError.set('');
          this.resetOrderRequestForm(product, true);
        },
        error: (error: unknown) => {
          this.orderSubmitSuccess.set('');
          this.orderSubmitError.set(this.resolveOrderRequestError(error));
        },
      });
  }

  whatsAppHref(product: ProductListItem): string {
    const message = this.encodeWhatsAppMessage(product);
    return `https://wa.me/?text=${message}`;
  }

  private encodeWhatsAppMessage(product: ProductListItem): string {
    const name = this.displayPrimaryName(product);
    const form = this.orderRequestForm();
    const details: string[] = [];

    if (form.selectedVarieties.length > 0) details.push(`الصنف: ${form.selectedVarieties.join('، ')}`);
    if (form.selectedPackagingOptions.length > 0)
      details.push(`التعبئة: ${form.selectedPackagingOptions.join('، ')}`);
    if (form.selectedWeightOptions.length > 0)
      details.push(`الوزن: ${form.selectedWeightOptions.join('، ')}`);
    if (form.selectedSizeOptions.length > 0)
      details.push(`المقاس: ${form.selectedSizeOptions.join('، ')}`);
    if (form.selectedGradeOptions.length > 0)
      details.push(`الدرجة: ${form.selectedGradeOptions.join('، ')}`);
    if (form.specialSpecification.trim())
      details.push(`مواصفة خاصة: ${form.specialSpecification.trim()}`);
    if (form.quantityTons.trim()) details.push(`الكمية المطلوبة: ${form.quantityTons.trim()} طن`);
    if (form.requesterName.trim()) details.push(`الاسم: ${form.requesterName.trim()}`);
    if (form.phoneNumber.trim()) details.push(`الهاتف: ${form.phoneNumber.trim()}`);

    const suffix = details.length > 0 ? `\n${details.join('\n')}` : '';
    return encodeURIComponent(`أهلاً، أرغب في الاستفسار عن تفاصيل وأسعار: ${name}${suffix}`);
  }

  private validateOrderRequestForm(
    product: ProductListItem,
    form: OrderRequestFormState,
  ): string | null {
    const requesterName = form.requesterName.trim();
    const phoneNumber = form.phoneNumber.trim();
    const quantityRaw = form.quantityTons.trim();
    const quantity = Number.parseFloat(quantityRaw);

    if (!requesterName)
      return this.translocoService.translate('products_page.modal.validation.name_required');
    if (requesterName.length < 3)
      return this.translocoService.translate('products_page.modal.validation.name_min');
    if (!phoneNumber)
      return this.translocoService.translate('products_page.modal.validation.phone_required');
    if (phoneNumber.length < 7)
      return this.translocoService.translate('products_page.modal.validation.phone_min');
    if (!quantityRaw || Number.isNaN(quantity) || quantity <= 0)
      return this.translocoService.translate('products_page.modal.validation.quantity_invalid');
    if (product.varieties.length > 0 && form.selectedVarieties.length === 0)
      return this.translocoService.translate('products_page.modal.validation.variety_required');
    if (product.packagingOptions.length > 0 && form.selectedPackagingOptions.length === 0)
      return this.translocoService.translate('products_page.modal.validation.packaging_required');
    if (product.weightOptions.length > 0 && form.selectedWeightOptions.length === 0)
      return this.translocoService.translate('products_page.modal.validation.weight_required');
    if (product.sizeOptions.length > 0 && form.selectedSizeOptions.length === 0)
      return this.translocoService.translate('products_page.modal.validation.size_required');
    if (product.gradeOptions.length > 0 && form.selectedGradeOptions.length === 0)
      return this.translocoService.translate('products_page.modal.validation.grade_required');

    return null;
  }

  private resolveOrderRequestError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const detail = (error.error as { detail?: unknown } | null)?.detail;
      if (typeof detail === 'string' && detail.trim()) return detail.trim();
    }
    return this.translocoService.translate('products_page.modal.request_error');
  }

  private resetOrderRequestForm(product: ProductListItem, preserveSuccess = false): void {
    this.orderRequestForm.set({
      selectedVarieties: this.defaultSelections(product.varieties),
      selectedPackagingOptions: this.defaultSelections(product.packagingOptions),
      selectedWeightOptions: this.defaultSelections(product.weightOptions),
      selectedSizeOptions: this.defaultSelections(product.sizeOptions),
      selectedGradeOptions: this.defaultSelections(product.gradeOptions),
      specialSpecification: '',
      requesterName: '',
      phoneNumber: '',
      quantityTons: '1',
    });
    this.orderSubmitError.set('');
    if (!preserveSuccess) this.orderSubmitSuccess.set('');
  }

  private defaultSelections(values: string[] | undefined): string[] {
    if (!values || values.length !== 1) return [];
    return values[0] ? [values[0]] : [];
  }

  private emptyForm(): OrderRequestFormState {
    return {
      selectedVarieties: [],
      selectedPackagingOptions: [],
      selectedWeightOptions: [],
      selectedSizeOptions: [],
      selectedGradeOptions: [],
      specialSpecification: '',
      requesterName: '',
      phoneNumber: '',
      quantityTons: '1',
    };
  }

  private normalizeOptional(value: string): string | null {
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }

  private sameText(a: string, b: string): boolean {
    return a.trim().toLowerCase() === b.trim().toLowerCase();
  }

  private normalizeLanguage(language: string | null | undefined): 'ar' | 'en' | 'ru' {
    const normalized = (language || 'ar').toLowerCase();
    if (normalized.startsWith('en')) return 'en';
    if (normalized.startsWith('ru')) return 'ru';
    return 'ar';
  }

  trackChip = (_: number, value: string): string => value;
}
