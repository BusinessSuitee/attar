import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { finalize } from 'rxjs';

import { NavbarComponent } from '../../components/navbar/navbar.component';
import { API_BASE_URL } from '../../core/config/api-base-url.token';
import { ProductListItem } from '../../core/products/product.service';
import { ProductsStore } from '../../core/products/products.store';
import { getAvailableMonths, getCategoryAccent } from '../../core/products/season-calendar.utils';
import {
  CreateOrderRequestPayload,
  OrderRequestService,
} from '../../core/orders/order-request.service';
import { PublicProductCard } from '../products/public-catalog.store';
import { ProductGalleryComponent } from './components/product-gallery.component';
import {
  ProductInfo,
  ProductInfoPanelComponent,
} from './components/product-info-panel.component';
import { RelatedProductsComponent } from './components/related-products.component';

type OrderSelectionField =
  | 'selectedVarieties'
  | 'selectedPackagingOptions'
  | 'selectedWeightOptions'
  | 'selectedSizeOptions'
  | 'selectedGradeOptions';

interface OrderFormState {
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
  imports: [
    NavbarComponent,
    RouterLink,
    TranslocoPipe,
    ProductGalleryComponent,
    ProductInfoPanelComponent,
    RelatedProductsComponent,
  ],
  templateUrl: './product-detail.page.html',
  styleUrl: './product-detail.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  protected readonly productsStore = inject(ProductsStore);
  private readonly orderRequestService = inject(OrderRequestService);
  private readonly transloco = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly platformId = inject(PLATFORM_ID);

  readonly productId = signal<string>('');
  readonly currentMonth = signal<number | null>(null);

  readonly orderForm = signal<OrderFormState>(this.emptyForm());
  readonly isSubmitting = signal(false);
  readonly submitError = signal('');
  readonly submitSuccess = signal('');
  readonly formTouched = signal(false);

  readonly product = computed<ProductListItem | undefined>(() => {
    const id = this.productId();
    if (!id) return undefined;
    return this.productsStore.products().find((p) => p.id === id);
  });

  readonly notFound = computed(
    () => this.productsStore.hasLoaded() && !this.productsStore.hasError() && !this.product(),
  );

  readonly resolvedImageUrls = computed<string[]>(() => {
    const p = this.product();
    if (!p?.imageUrls) return [];
    return p.imageUrls.filter((u) => !!u && u.trim().length > 0);
  });

  readonly accentColor = computed<string>(() => {
    const p = this.product();
    return p ? getCategoryAccent(p.productType, p.productState) : '#0fbd66';
  });

  readonly availableMonths = computed<number[]>(() => {
    const p = this.product();
    return p ? getAvailableMonths(p.season) : [];
  });

  readonly atmosphericImage = computed<string | null>(() => {
    const urls = this.resolvedImageUrls();
    if (urls.length === 0) return null;
    return this.resolveUrl(urls[0]);
  });

  readonly story = computed<string>(() => {
    const p = this.product();
    if (!p) return '';
    if (this.isArabic()) return (p.descriptionAr || p.descriptionEn || '').trim();
    return (p.descriptionEn || p.descriptionAr || '').trim();
  });

  readonly infoPanelData = computed<ProductInfo | null>(() => {
    const p = this.product();
    const month = this.currentMonth();
    if (!p) return null;
    return {
      id: p.id,
      name: p.name,
      nameAr: p.nameAr,
      status: p.status,
      productType: p.productType,
      productState: p.productState,
      season: p.season,
      varieties: p.varieties,
      packagingOptions: p.packagingOptions,
      weightOptions: p.weightOptions,
      sizeOptions: p.sizeOptions,
      gradeOptions: p.gradeOptions,
      isInSeasonNow:
        p.status === 'Valid' &&
        month !== null &&
        getAvailableMonths(p.season).includes(month),
    };
  });

  readonly relatedProducts = computed<PublicProductCard[]>(() => {
    const current = this.product();
    const month = this.currentMonth();
    if (!current) return [];
    return this.productsStore
      .products()
      .filter(
        (p) =>
          p.id !== current.id &&
          p.status !== 'Invalid' &&
          p.productType === current.productType &&
          p.productState === current.productState,
      )
      .slice(0, 4)
      .map<PublicProductCard>((p) => ({
        id: p.id,
        name: p.name,
        nameAr: p.nameAr,
        status: p.status,
        productType: p.productType,
        productState: p.productState,
        season: p.season,
        thumbnailUrl: p.imageUrls?.[0] ?? null,
        isInSeasonNow:
          p.status === 'Valid' &&
          month !== null &&
          getAvailableMonths(p.season).includes(month),
        accentColor: getCategoryAccent(p.productType, p.productState),
      }));
  });

  readonly displayName = computed<string>(() => {
    const p = this.product();
    if (!p) return '';
    return this.isArabic() ? p.nameAr || p.name : p.name || p.nameAr;
  });

  readonly hasOrderSpecs = computed<boolean>(() => {
    const p = this.product();
    if (!p) return false;
    return (
      p.varieties.length > 0 ||
      p.packagingOptions.length > 0 ||
      p.weightOptions.length > 0 ||
      p.sizeOptions.length > 0 ||
      p.gradeOptions.length > 0
    );
  });

  constructor() {
    afterNextRender(() => {
      if (isPlatformBrowser(this.platformId)) {
        this.currentMonth.set(new Date().getMonth() + 1);
      }
    });
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('id') ?? '';
      this.productId.set(id);
      this.resetForm();
    });
    this.productsStore.ensureLoaded();
  }

  setOrderOption(field: OrderSelectionField, value: string): void {
    const normalized = value.trim();
    if (!normalized) return;
    this.orderForm.update((current) => ({
      ...current,
      [field]: current[field].some((item) => this.sameText(item, normalized))
        ? current[field].filter((item) => !this.sameText(item, normalized))
        : [...current[field], normalized],
    }));
    this.submitError.set('');
    this.submitSuccess.set('');
  }

  isOptionSelected(field: OrderSelectionField, value: string): boolean {
    return this.orderForm()[field].some((item) => this.sameText(item, value));
  }

  onFieldInput(
    field: 'requesterName' | 'phoneNumber' | 'quantityTons' | 'specialSpecification',
    value: string,
  ): void {
    this.orderForm.update((c) => ({ ...c, [field]: value }));
    this.submitError.set('');
    this.submitSuccess.set('');
  }

  submitOrder(): void {
    const product = this.product();
    if (!product || this.isSubmitting()) return;

    this.formTouched.set(true);
    const form = this.orderForm();
    const error = this.validateForm(product, form);
    if (error) {
      this.submitError.set(error);
      return;
    }

    const quantityTons = Number.parseFloat(form.quantityTons.trim());
    this.isSubmitting.set(true);
    this.submitError.set('');
    this.submitSuccess.set('');

    const payload: CreateOrderRequestPayload = {
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
    };

    this.orderRequestService
      .createOrderRequest(payload)
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.submitSuccess.set(
            this.transloco.translate('products_page.modal.request_success'),
          );
          this.submitError.set('');
          this.resetForm();
        },
        error: () => {
          this.submitError.set(
            this.transloco.translate('products_page.modal.request_error'),
          );
        },
      });
  }

  whatsAppHref(): string {
    const product = this.product();
    if (!product) return '#';
    const name = this.displayName();
    const form = this.orderForm();
    const lines: string[] = [`أهلاً، أرغب في الاستفسار عن: ${name}`];
    if (form.selectedVarieties.length)
      lines.push(`الصنف: ${form.selectedVarieties.join('، ')}`);
    if (form.selectedPackagingOptions.length)
      lines.push(`التعبئة: ${form.selectedPackagingOptions.join('، ')}`);
    if (form.selectedWeightOptions.length)
      lines.push(`الوزن: ${form.selectedWeightOptions.join('، ')}`);
    if (form.selectedSizeOptions.length)
      lines.push(`المقاس: ${form.selectedSizeOptions.join('، ')}`);
    if (form.selectedGradeOptions.length)
      lines.push(`الدرجة: ${form.selectedGradeOptions.join('، ')}`);
    if (form.quantityTons.trim())
      lines.push(`الكمية: ${form.quantityTons.trim()} طن`);
    if (form.specialSpecification.trim())
      lines.push(`مواصفة خاصة: ${form.specialSpecification.trim()}`);
    return `https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`;
  }

  private validateForm(product: ProductListItem, form: OrderFormState): string | null {
    const name = form.requesterName.trim();
    const phone = form.phoneNumber.trim();
    const qty = form.quantityTons.trim();

    if (!name) return this.transloco.translate('products_page.modal.validation.name_required');
    if (name.length < 3) return this.transloco.translate('products_page.modal.validation.name_min');
    if (!phone) return this.transloco.translate('products_page.modal.validation.phone_required');
    if (phone.length < 7) return this.transloco.translate('products_page.modal.validation.phone_min');
    const qtyNum = Number.parseFloat(qty);
    if (!qty || Number.isNaN(qtyNum) || qtyNum <= 0)
      return this.transloco.translate('products_page.modal.validation.quantity_invalid');
    if (product.varieties.length > 0 && form.selectedVarieties.length === 0)
      return this.transloco.translate('products_page.modal.validation.variety_required');
    if (product.packagingOptions.length > 0 && form.selectedPackagingOptions.length === 0)
      return this.transloco.translate('products_page.modal.validation.packaging_required');
    if (product.weightOptions.length > 0 && form.selectedWeightOptions.length === 0)
      return this.transloco.translate('products_page.modal.validation.weight_required');
    if (product.sizeOptions.length > 0 && form.selectedSizeOptions.length === 0)
      return this.transloco.translate('products_page.modal.validation.size_required');
    if (product.gradeOptions.length > 0 && form.selectedGradeOptions.length === 0)
      return this.transloco.translate('products_page.modal.validation.grade_required');
    return null;
  }

  private resetForm(): void {
    const p = this.product();
    this.orderForm.set({
      selectedVarieties: this.defaultSelection(p?.varieties),
      selectedPackagingOptions: this.defaultSelection(p?.packagingOptions),
      selectedWeightOptions: this.defaultSelection(p?.weightOptions),
      selectedSizeOptions: this.defaultSelection(p?.sizeOptions),
      selectedGradeOptions: this.defaultSelection(p?.gradeOptions),
      specialSpecification: '',
      requesterName: '',
      phoneNumber: '',
      quantityTons: '1',
    });
    this.submitError.set('');
    this.submitSuccess.set('');
    this.formTouched.set(false);
  }

  private emptyForm(): OrderFormState {
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

  private defaultSelection(values?: string[]): string[] {
    return values?.length === 1 && values[0] ? [values[0]] : [];
  }

  private normalizeOptional(value: string): string | null {
    const t = value.trim();
    return t === '' ? null : t;
  }

  private sameText(a: string, b: string): boolean {
    return a.trim().toLowerCase() === b.trim().toLowerCase();
  }

  isArabic(): boolean {
    return (this.transloco.getActiveLang() || 'ar').toLowerCase().startsWith('ar');
  }

  private resolveUrl(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${this.apiBaseUrl}/${url.replace(/^\//, '')}`;
  }
}
