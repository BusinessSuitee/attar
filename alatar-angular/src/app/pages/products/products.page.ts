import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ProductListItem, ProductService } from '../../core/products/product.service';
import { API_BASE_URL } from '../../core/config/api-base-url.token';
import { OrderRequestService } from '../../core/orders/order-request.service';
import { finalize, retry, throwError, timer } from 'rxjs';

type CategoryFilter = 'all' | 'Fruit' | 'Vegetable' | 'Frozen';
type SeasonFilter = 'all' | 'Summer' | 'Winter' | 'AllYear';

interface FilterOption {
  id: CategoryFilter;
  labelKey: string;
  icon: string;
}

interface SeasonOption {
  id: SeasonFilter;
  labelKey: string;
  icon: string;
}

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
  selector: 'app-products-page',
  standalone: true,
  imports: [CommonModule, NavbarComponent, TranslocoPipe],
  templateUrl: './products.page.html',
  styleUrl: './products.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPageComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly orderRequestService = inject(OrderRequestService);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translocoService = inject(TranslocoService);
  readonly isBrowser = typeof window !== 'undefined';
  readonly currentLanguage = signal<'ar' | 'en' | 'ru'>('ar');
  readonly isArabicUi = computed(() => this.currentLanguage() === 'ar');

  readonly activeFilter = signal<CategoryFilter>('all');
  readonly activeSeason = signal<SeasonFilter>('all');
  readonly selectedProduct = signal<ProductListItem | null>(null);
  readonly activeImageIndex = signal<number>(0);
  readonly products = signal<ProductListItem[]>([]);
  readonly isLoading = signal(true);
  readonly loadError = signal('');
  readonly orderRequestForm = signal<OrderRequestFormState>({
    selectedVarieties: [],
    selectedPackagingOptions: [],
    selectedWeightOptions: [],
    selectedSizeOptions: [],
    selectedGradeOptions: [],
    specialSpecification: '',
    requesterName: '',
    phoneNumber: '',
    quantityTons: '1',
  });
  readonly isSubmittingOrderRequest = signal(false);
  readonly orderSubmitError = signal('');
  readonly orderSubmitSuccess = signal('');

  readonly filterOptions: FilterOption[] = [
    { id: 'all', labelKey: 'products_page.filters.all', icon: 'apps' },
    { id: 'Fruit', labelKey: 'products_page.filters.fruits', icon: 'nutrition' },
    { id: 'Vegetable', labelKey: 'products_page.filters.vegetables', icon: 'eco' },
    { id: 'Frozen', labelKey: 'products_page.filters.frozen', icon: 'severe_cold' },
  ];

  readonly seasonOptions: SeasonOption[] = [
    { id: 'all', labelKey: 'products_page.seasons.all', icon: 'calendar_month' },
    { id: 'Summer', labelKey: 'products_page.seasons.summer', icon: 'sunny' },
    { id: 'Winter', labelKey: 'products_page.seasons.winter', icon: 'ac_unit' },
    { id: 'AllYear', labelKey: 'products_page.seasons.all_year', icon: 'autorenew' },
  ];

  readonly showSeasonFilter = computed(() => {
    const f = this.activeFilter();
    return f === 'Fruit' || f === 'Vegetable';
  });

  readonly visibleProducts = computed(() => {
    const catFilter = this.activeFilter();
    const seasonFilter = this.activeSeason();
    let list = this.products();

    if (catFilter === 'Frozen') {
      list = list.filter((p) => p.productState === 'Frozen');
    } else if (catFilter !== 'all') {
      list = list.filter((p) => p.productType === catFilter && p.productState === 'Fresh');
    }

    if (this.showSeasonFilter() && seasonFilter !== 'all') {
      list = list.filter((p) => p.season === seasonFilter);
    }

    return list;
  });

  ngOnInit(): void {
    this.currentLanguage.set(this.normalizeLanguage(this.translocoService.getActiveLang()));

    this.translocoService.langChanges$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((lang) => {
        this.currentLanguage.set(this.normalizeLanguage(lang));
      });

    this.loadProducts();
  }

  setFilter(filter: CategoryFilter): void {
    this.activeFilter.set(filter);
    this.activeSeason.set('all');
  }

  setSeason(season: SeasonFilter): void {
    this.activeSeason.set(season);
  }

  openProduct(product: ProductListItem): void {
    this.selectedProduct.set(product);
    this.activeImageIndex.set(0);
    this.resetOrderRequestForm(product);
    if (this.isBrowser) document.body.style.overflow = 'hidden';
  }

  closeProduct(): void {
    this.selectedProduct.set(null);
    this.resetOrderRequestForm(null);
    if (this.isBrowser) document.body.style.overflow = '';
  }

  setActiveImage(index: number): void {
    this.activeImageIndex.set(index);
  }

  imageUrl(relativePath: string): string {
    if (!relativePath) return '';
    if (relativePath.startsWith('http')) return relativePath;
    return `${this.apiBaseUrl}/${relativePath.replace(/^\//, '')}`;
  }

  hasImages(product: ProductListItem): boolean {
    return (product.imageUrls?.length ?? 0) > 0;
  }

  firstImage(product: ProductListItem): string {
    return this.hasImages(product) ? this.imageUrl(product.imageUrls![0]) : '';
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

  encodeWhatsAppMessage(product: ProductListItem): string {
    const name = this.displayPrimaryName(product);
    const form = this.orderRequestForm();
    const details: string[] = [];

    if (form.selectedVarieties.length > 0) {
      details.push(`الصنف: ${form.selectedVarieties.join('، ')}`);
    }

    if (form.selectedPackagingOptions.length > 0) {
      details.push(`التعبئة: ${form.selectedPackagingOptions.join('، ')}`);
    }

    if (form.selectedWeightOptions.length > 0) {
      details.push(`الوزن: ${form.selectedWeightOptions.join('، ')}`);
    }

    if (form.selectedSizeOptions.length > 0) {
      details.push(`المقاس: ${form.selectedSizeOptions.join('، ')}`);
    }

    if (form.selectedGradeOptions.length > 0) {
      details.push(`الدرجة: ${form.selectedGradeOptions.join('، ')}`);
    }

    if (form.specialSpecification.trim()) {
      details.push(`مواصفة خاصة: ${form.specialSpecification.trim()}`);
    }

    if (form.quantityTons.trim()) {
      details.push(`الكمية المطلوبة: ${form.quantityTons.trim()} طن`);
    }

    if (form.requesterName.trim()) {
      details.push(`الاسم: ${form.requesterName.trim()}`);
    }

    if (form.phoneNumber.trim()) {
      details.push(`الهاتف: ${form.phoneNumber.trim()}`);
    }

    const detailsSuffix = details.length > 0 ? `\n${details.join('\n')}` : '';

    return encodeURIComponent(`أهلاً، أرغب في الاستفسار عن تفاصيل وأسعار: ${name}${detailsSuffix}`);
  }

  onOrderTextFieldInput(
    field: 'requesterName' | 'phoneNumber' | 'quantityTons' | 'specialSpecification',
    value: string,
  ): void {
    this.orderRequestForm.update((current) => ({
      ...current,
      [field]: value,
    }));
    this.orderSubmitError.set('');
    this.orderSubmitSuccess.set('');
  }

  setOrderOption(field: OrderSelectionField, value: string): void {
    const normalizedValue = value.trim();

    if (!normalizedValue) {
      return;
    }

    this.orderRequestForm.update((current) => ({
      ...current,
      [field]: current[field].some((item) => this.sameText(item, normalizedValue))
        ? current[field].filter((item) => !this.sameText(item, normalizedValue))
        : [...current[field], normalizedValue],
    }));

    this.orderSubmitError.set('');
    this.orderSubmitSuccess.set('');
  }

  isOrderOptionSelected(field: OrderSelectionField, value: string): boolean {
    return this.orderRequestForm()[field].some((item) => this.sameText(item, value));
  }

  submitOrderRequest(): void {
    const product = this.selectedProduct();

    if (!product || this.isSubmittingOrderRequest()) {
      return;
    }

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
        specialSpecification: this.normalizeOptionalValue(form.specialSpecification),
        requesterName: form.requesterName,
        phoneNumber: form.phoneNumber,
        quantityTons,
      })
      .pipe(
        finalize(() => {
          this.isSubmittingOrderRequest.set(false);
        }),
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

  private validateOrderRequestForm(
    product: ProductListItem,
    form: OrderRequestFormState,
  ): string | null {
    const requesterName = form.requesterName.trim();
    const phoneNumber = form.phoneNumber.trim();
    const quantityRaw = form.quantityTons.trim();
    const quantity = Number.parseFloat(quantityRaw);

    if (!requesterName) {
      return this.translocoService.translate('products_page.modal.validation.name_required');
    }

    if (requesterName.length < 3) {
      return this.translocoService.translate('products_page.modal.validation.name_min');
    }

    if (!phoneNumber) {
      return this.translocoService.translate('products_page.modal.validation.phone_required');
    }

    if (phoneNumber.length < 7) {
      return this.translocoService.translate('products_page.modal.validation.phone_min');
    }

    if (!quantityRaw || Number.isNaN(quantity) || quantity <= 0) {
      return this.translocoService.translate('products_page.modal.validation.quantity_invalid');
    }

    if (product.varieties.length > 0 && form.selectedVarieties.length === 0) {
      return this.translocoService.translate('products_page.modal.validation.variety_required');
    }

    if (product.packagingOptions.length > 0 && form.selectedPackagingOptions.length === 0) {
      return this.translocoService.translate('products_page.modal.validation.packaging_required');
    }

    if (product.weightOptions.length > 0 && form.selectedWeightOptions.length === 0) {
      return this.translocoService.translate('products_page.modal.validation.weight_required');
    }

    if (product.sizeOptions.length > 0 && form.selectedSizeOptions.length === 0) {
      return this.translocoService.translate('products_page.modal.validation.size_required');
    }

    if (product.gradeOptions.length > 0 && form.selectedGradeOptions.length === 0) {
      return this.translocoService.translate('products_page.modal.validation.grade_required');
    }

    return null;
  }

  displayPrimaryName(product: ProductListItem): string {
    if (this.isArabicUi()) {
      return (product.nameAr || product.name).trim();
    }

    return (product.name || product.nameAr).trim();
  }

  displaySecondaryName(product: ProductListItem): string | null {
    if (!this.isArabicUi()) {
      return null;
    }

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

  displaySecondaryDescription(product: ProductListItem): string | null {
    if (!this.isArabicUi()) {
      return null;
    }

    const secondary = (product.descriptionEn || '').trim();
    const primary = this.displayPrimaryDescription(product);

    return secondary && !this.sameText(secondary, primary) ? secondary : null;
  }

  private resetOrderRequestForm(product: ProductListItem | null, preserveSuccess = false): void {
    this.orderRequestForm.set({
      selectedVarieties: this.defaultSelections(product?.varieties),
      selectedPackagingOptions: this.defaultSelections(product?.packagingOptions),
      selectedWeightOptions: this.defaultSelections(product?.weightOptions),
      selectedSizeOptions: this.defaultSelections(product?.sizeOptions),
      selectedGradeOptions: this.defaultSelections(product?.gradeOptions),
      specialSpecification: '',
      requesterName: '',
      phoneNumber: '',
      quantityTons: '1',
    });

    this.orderSubmitError.set('');

    if (!preserveSuccess) {
      this.orderSubmitSuccess.set('');
    }
  }

  private defaultSelections(values: string[] | undefined): string[] {
    if (!values || values.length !== 1) {
      return [];
    }

    return values[0] ? [values[0]] : [];
  }

  private normalizeOptionalValue(value: string): string | null {
    const normalized = value.trim();
    return normalized === '' ? null : normalized;
  }

  private resolveOrderRequestError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const detail = this.extractProblemDetail(error.error);

      if (detail) {
        return detail;
      }
    }

    return this.translocoService.translate('products_page.modal.request_error');
  }

  private loadProducts(): void {
    this.isLoading.set(true);
    this.loadError.set('');

    this.productService
      .getProducts()
      .pipe(
        retry({
          count: 2,
          delay: (error, retryIndex) => {
            if (!this.shouldRetryProductsLoad(error)) {
              return throwError(() => error);
            }

            return timer(800 * retryIndex);
          },
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (products) => {
          this.products.set(products);
          this.isLoading.set(false);
        },
        error: () => {
          this.loadError.set(this.productsLoadErrorMessage());
          this.isLoading.set(false);
        },
      });
  }

  private shouldRetryProductsLoad(error: unknown): boolean {
    if (!(error instanceof HttpErrorResponse)) {
      return true;
    }

    return [0, 408, 425, 429, 500, 502, 503, 504].includes(error.status);
  }

  private productsLoadErrorMessage(): string {
    switch (this.currentLanguage()) {
      case 'en':
        return 'Unable to load products. Please try again.';
      case 'ru':
        return 'Не удалось загрузить продукты. Пожалуйста, попробуйте снова.';
      default:
        return 'تعذر تحميل المنتجات، حاول مرة أخرى.';
    }
  }

  private normalizeLanguage(language: string | null | undefined): 'ar' | 'en' | 'ru' {
    const normalized = (language || 'ar').toLowerCase();

    if (normalized.startsWith('en')) {
      return 'en';
    }

    if (normalized.startsWith('ru')) {
      return 'ru';
    }

    return 'ar';
  }

  private sameText(left: string, right: string): boolean {
    return left.trim().toLowerCase() === right.trim().toLowerCase();
  }

  private extractProblemDetail(errorBody: unknown): string | null {
    if (!errorBody || typeof errorBody !== 'object') {
      return null;
    }

    const detail = (errorBody as { detail?: unknown }).detail;

    if (typeof detail !== 'string') {
      return null;
    }

    const normalized = detail.trim();
    return normalized === '' ? null : normalized;
  }
}
