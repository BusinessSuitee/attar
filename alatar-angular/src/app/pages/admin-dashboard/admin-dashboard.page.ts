import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, finalize, map, of, switchMap } from 'rxjs';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { AuthService, AuthenticatedAdmin } from '../../core/auth/auth.service';
import {
  ContactListItem,
  ContactService,
  ContactStatus,
} from '../../core/contacts/contact.service';
import { API_BASE_URL } from '../../core/config/api-base-url.token';
import {
  OrderRequestListItem,
  OrderRequestService,
  OrderRequestStatus,
} from '../../core/orders/order-request.service';
import {
  CreateProductPayload,
  ProductListItem,
  ProductSeason,
  ProductService,
  ProductState,
  ProductType,
} from '../../core/products/product.service';

type DashboardSectionKey = 'overview' | 'orders' | 'products' | 'contacts' | 'settings';

type ProductFormStep = 1 | 2 | 3 | 4;

type ImagePreview = {
  file: File;
  url: string;
  name: string;
  size: string;
};

type DashboardSection = {
  key: DashboardSectionKey;
  label: string;
  icon: string;
};

type ContactsView = 'rows' | 'cards';

type ContactStatusOption = {
  value: ContactStatus;
  label: string;
};

type OrderStatusOption = {
  value: OrderRequestStatus;
  label: string;
};

type ProductFormState = {
  name: string;
  nameAr: string;
  sku: string;
  price: string;
  openingStock: string;
  descriptionEn: string;
  descriptionAr: string;
  productType: ProductType;
  productState: ProductState;
  season: ProductSeason;
  varieties: string[];
  packagingOptions: string[];
  weightOptions: string[];
  sizeOptions: string[];
  gradeOptions: string[];
};

type ProductOptionField =
  | 'varieties'
  | 'packagingOptions'
  | 'weightOptions'
  | 'sizeOptions'
  | 'gradeOptions';

type ProductTextField = Exclude<keyof ProductFormState, ProductOptionField>;

type CategoryItem = {
  id: string;
  name: string;
  colorClass: string;
};

type ProductWithCategories = ProductListItem & {
  categories: CategoryItem[];
};

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './admin-dashboard.page.html',
  styleUrl: './admin-dashboard.page.css',
})
export class AdminDashboardPageComponent {
  private readonly authService = inject(AuthService);
  private readonly contactService = inject(ContactService);
  private readonly orderRequestService = inject(OrderRequestService);
  private readonly productService = inject(ProductService);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = typeof window !== 'undefined';
  private readonly desktopBreakpoint = 1100;
  private readonly categoryStorageKey = 'alatar.admin.product.categories';
  private readonly productCategoryStorageKey = 'alatar.admin.product.category-links';
  private readonly sectionRouteMap: Record<DashboardSectionKey, string> = {
    overview: '/admin',
    orders: '/admin/orders',
    products: '/admin/products',
    contacts: '/admin/contacts',
    settings: '/admin/settings',
  };

  private readonly categoryColorClasses = [
    'category-pill--green',
    'category-pill--orange',
    'category-pill--blue',
    'category-pill--purple',
  ] as const;
  private readonly priceFormatter = new Intl.NumberFormat('ar-EG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  private readonly dateTimeFormatter = new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  private readonly defaultCategories: CategoryItem[] = [
    { id: 'citrus', name: 'موالح', colorClass: 'category-pill--green' },
    { id: 'grapes', name: 'عنب', colorClass: 'category-pill--purple' },
    { id: 'potatoes', name: 'بطاطس', colorClass: 'category-pill--orange' },
  ];

  private contactsLoadedOnce = false;
  private ordersLoadedOnce = false;
  private productsLoadedOnce = false;

  private readonly profileSignal = signal<AuthenticatedAdmin | null>(null);
  private readonly contactsSignal = signal<ContactListItem[]>([]);
  private readonly orderRequestsSignal = signal<OrderRequestListItem[]>([]);
  private readonly productsSignal = signal<ProductListItem[]>([]);
  private readonly productFormSignal = signal<ProductFormState>({
    name: '',
    nameAr: '',
    sku: '',
    price: '',
    openingStock: '',
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
  private readonly productOptionDraftsSignal = signal<Record<ProductOptionField, string>>({
    varieties: '',
    packagingOptions: '',
    weightOptions: '',
    sizeOptions: '',
    gradeOptions: '',
  });
  private readonly selectedProductImagesSignal = signal<readonly File[]>([]);
  private readonly imagePreviewsSignal = signal<readonly ImagePreview[]>([]);
  private readonly productImageIndexSignal = signal<Record<string, number>>({});
  private readonly currentStepSignal = signal<ProductFormStep>(1);
  private readonly isDraggingOverSignal = signal(false);
  private readonly categoriesSignal = signal<CategoryItem[]>(this.readCategoriesFromStorage());
  private readonly selectedCategoryIdsSignal = signal<ReadonlySet<string>>(new Set<string>());
  private readonly productCategoryMapSignal = signal<Record<string, string[]>>(
    this.readProductCategoryMapFromStorage(),
  );
  private readonly newCategoryNameSignal = signal('');
  private readonly isLoadingSignal = signal(false);
  private readonly isContactsLoadingSignal = signal(false);
  private readonly isOrdersLoadingSignal = signal(false);
  private readonly isProductsLoadingSignal = signal(false);
  private readonly isCreatingProductSignal = signal(false);
  private readonly isUpdatingProductSignal = signal(false);
  private readonly editingProductSignal = signal<ProductListItem | null>(null);
  private readonly existingImagePreviewsSignal = signal<Array<{ id: string; url: string }>>([]);
  private readonly loadErrorSignal = signal('');
  private readonly contactsLoadErrorSignal = signal('');
  private readonly ordersLoadErrorSignal = signal('');
  private readonly productsLoadErrorSignal = signal('');
  private readonly productSubmitErrorSignal = signal('');
  private readonly productSubmitSuccessSignal = signal('');
  private readonly isSidebarOpenSignal = signal(
    this.isBrowser ? window.innerWidth >= this.desktopBreakpoint : false,
  );
  private readonly contactsViewSignal = signal<ContactsView>('rows');
  private readonly currentPageSignal = signal(1);
  private readonly totalPagesSignal = signal(0);
  private readonly totalCountSignal = signal(0);
  private readonly ordersCurrentPageSignal = signal(1);
  private readonly ordersTotalPagesSignal = signal(0);
  private readonly ordersTotalCountSignal = signal(0);
  private readonly activeSectionSignal = signal<DashboardSectionKey>('products');
  private readonly updatingStatusIdsSignal = signal<ReadonlySet<string>>(new Set<string>());
  private readonly updatingOrderStatusIdsSignal = signal<ReadonlySet<string>>(new Set<string>());
  private readonly deletingOrderRequestIdsSignal = signal<ReadonlySet<string>>(new Set<string>());
  private readonly deletingContactIdsSignal = signal<ReadonlySet<string>>(new Set<string>());

  private readonly productsWithCategoriesSignal = computed<ProductWithCategories[]>(() => {
    const products = this.productsSignal();
    const categories = this.categoriesSignal();
    const links = this.productCategoryMapSignal();
    const categoriesById = new Map(categories.map((category) => [category.id, category]));

    return products.map((product) => {
      const normalizedSku = this.normalizeSku(product.sku);
      const categoryIds = links[normalizedSku] ?? [];
      const linkedCategories = categoryIds
        .map((categoryId) => categoriesById.get(categoryId))
        .filter((category): category is CategoryItem => category !== undefined);

      return { ...product, categories: linkedCategories };
    });
  });

  readonly pageSize = 50;

  readonly statusOptions: ContactStatusOption[] = [
    { value: 'in_progress', label: 'جاري التواصل' },
    { value: 'contacted', label: 'تم التواصل' },
    { value: 'sale_confirmed', label: 'تم تأكيد البيع' },
  ];

  readonly orderStatusOptions: OrderStatusOption[] = [
    { value: 'new', label: 'جديد' },
    { value: 'in_review', label: 'قيد المراجعة' },
    { value: 'contacted', label: 'تم التواصل' },
    { value: 'confirmed', label: 'تم التأكيد' },
    { value: 'closed', label: 'مغلق' },
  ];

  readonly productTypeOptions: Array<{ value: ProductType; label: string }> = [
    { value: 'Fruit', label: 'Fruit / فاكهة' },
    { value: 'Vegetable', label: 'Vegetable / خضار' },
  ];

  readonly productStateOptions: Array<{ value: ProductState; label: string }> = [
    { value: 'Fresh', label: 'Fresh / طازج' },
    { value: 'Frozen', label: 'Frozen / مجمد' },
  ];

  readonly productSeasonOptions: Array<{ value: ProductSeason; label: string }> = [
    { value: 'Summer', label: 'Summer / صيفي' },
    { value: 'Winter', label: 'Winter / شتوي' },
    { value: 'AllYear', label: 'All year / طول العام' },
  ];

  readonly sections: DashboardSection[] = [
    { key: 'orders', label: 'لوحة التحكم', icon: 'dashboard' },
    { key: 'products', label: 'إضافة منتج', icon: 'add_box' },
    { key: 'contacts', label: 'التواصل', icon: 'contact_phone' },
    { key: 'settings', label: 'الإعدادات', icon: 'settings' },
  ];

  get profile(): AuthenticatedAdmin | null {
    return this.profileSignal();
  }

  get contacts(): ContactListItem[] {
    return this.contactsSignal();
  }

  get orderRequests(): OrderRequestListItem[] {
    return this.orderRequestsSignal();
  }

  get productsWithCategories(): ProductWithCategories[] {
    return this.productsWithCategoriesSignal();
  }

  get productForm(): ProductFormState {
    return this.productFormSignal();
  }

  get productOptionDrafts(): Record<ProductOptionField, string> {
    return this.productOptionDraftsSignal();
  }

  get selectedProductImages(): readonly File[] {
    return this.selectedProductImagesSignal();
  }

  get imagePreviews(): readonly ImagePreview[] {
    return this.imagePreviewsSignal();
  }

  get existingImagePreviews(): Array<{ id: string; url: string }> {
    return this.existingImagePreviewsSignal();
  }

  get currentStep(): ProductFormStep {
    return this.currentStepSignal();
  }

  get isDraggingOver(): boolean {
    return this.isDraggingOverSignal();
  }

  get stepProgress(): number {
    return (this.currentStepSignal() / 4) * 100;
  }

  get categories(): CategoryItem[] {
    return this.categoriesSignal();
  }

  get newCategoryName(): string {
    return this.newCategoryNameSignal();
  }

  get isLoading(): boolean {
    return this.isLoadingSignal();
  }

  get isContactsLoading(): boolean {
    return this.isContactsLoadingSignal();
  }

  get isOrdersLoading(): boolean {
    return this.isOrdersLoadingSignal();
  }

  get isProductsLoading(): boolean {
    return this.isProductsLoadingSignal();
  }

  get isCreatingProduct(): boolean {
    return this.isCreatingProductSignal();
  }

  get isUpdatingProduct(): boolean {
    return this.isUpdatingProductSignal();
  }

  get editingProduct(): ProductListItem | null {
    return this.editingProductSignal();
  }

  get loadError(): string {
    return this.loadErrorSignal();
  }

  get contactsLoadError(): string {
    return this.contactsLoadErrorSignal();
  }

  get ordersLoadError(): string {
    return this.ordersLoadErrorSignal();
  }

  get productsLoadError(): string {
    return this.productsLoadErrorSignal();
  }

  get productSubmitError(): string {
    return this.productSubmitErrorSignal();
  }

  get productSubmitSuccess(): string {
    return this.productSubmitSuccessSignal();
  }

  get isSidebarOpen(): boolean {
    return this.isSidebarOpenSignal();
  }

  get contactsView(): ContactsView {
    return this.contactsViewSignal();
  }

  get currentPage(): number {
    return this.currentPageSignal();
  }

  get totalPages(): number {
    return this.totalPagesSignal();
  }

  get totalCount(): number {
    return this.totalCountSignal();
  }

  get ordersCurrentPage(): number {
    return this.ordersCurrentPageSignal();
  }

  get ordersTotalPages(): number {
    return this.ordersTotalPagesSignal();
  }

  get ordersTotalCount(): number {
    return this.ordersTotalCountSignal();
  }

  get activeSection(): DashboardSectionKey {
    return this.activeSectionSignal();
  }

  get hasContacts(): boolean {
    return this.contacts.length > 0;
  }

  get hasOrderRequests(): boolean {
    return this.orderRequests.length > 0;
  }

  get hasProducts(): boolean {
    return this.productsWithCategories.length > 0;
  }

  get hasCategories(): boolean {
    return this.categories.length > 0;
  }

  get selectedCategoriesCount(): number {
    return this.selectedCategoryIdsSignal().size;
  }

  get productDivisionLabel(): string {
    const form = this.productFormSignal();
    const typeLabel = form.productType === 'Fruit' ? 'فواكه' : 'خضروات';
    const stateLabel = form.productState === 'Fresh' ? 'طازج' : 'مجمد';

    let seasonLabel = 'طول العام';
    if (form.season === 'Summer') {
      seasonLabel = 'صيفي';
    } else if (form.season === 'Winter') {
      seasonLabel = 'شتوي';
    }

    return `${stateLabel} / ${typeLabel} / ${seasonLabel}`;
  }

  get canGoPrevious(): boolean {
    return this.currentPage > 1;
  }

  get canGoNext(): boolean {
    return this.totalPages > 0 && this.currentPage < this.totalPages;
  }

  get canGoPreviousOrders(): boolean {
    return this.ordersCurrentPage > 1;
  }

  get canGoNextOrders(): boolean {
    return this.ordersTotalPages > 0 && this.ordersCurrentPage < this.ordersTotalPages;
  }

  constructor() {
    if (!this.isBrowser) {
      return;
    }

    setTimeout(() => {
      this.syncSectionWithRoute();
      this.loadProfile();
    }, 0);

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.syncSectionWithRoute();
      });
  }

  loadProfile(): void {
    this.isLoadingSignal.set(true);
    this.loadErrorSignal.set('');

    this.authService
      .getCurrentAdmin()
      .pipe(
        finalize(() => {
          this.isLoadingSignal.set(false);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (profile) => {
          this.profileSignal.set(profile);
        },
        error: () => {
          this.profileSignal.set(null);
          this.loadErrorSignal.set('تعذر تحميل بيانات الجلسة. حاول تسجيل الدخول مرة أخرى.');
        },
      });
  }

  loadContacts(page = this.currentPage, forceRefresh = false): void {
    const normalizedPage = page < 1 ? 1 : page;

    if (!forceRefresh && this.contactsLoadedOnce && normalizedPage === this.currentPage) {
      return;
    }

    this.isContactsLoadingSignal.set(true);
    this.contactsLoadErrorSignal.set('');

    this.contactService
      .getContacts(normalizedPage, this.pageSize)
      .pipe(
        finalize(() => {
          this.isContactsLoadingSignal.set(false);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          this.contactsSignal.set(response.items);
          this.totalCountSignal.set(response.totalCount);
          this.currentPageSignal.set(response.page);
          this.totalPagesSignal.set(response.totalPages);
          this.contactsLoadedOnce = true;
        },
        error: () => {
          this.contactsSignal.set([]);
          this.totalCountSignal.set(0);
          this.totalPagesSignal.set(0);
          this.contactsLoadedOnce = false;
          this.contactsLoadErrorSignal.set('تعذر تحميل بيانات التواصل.');
        },
      });
  }

  loadOrderRequests(page = this.ordersCurrentPage, forceRefresh = false): void {
    const normalizedPage = page < 1 ? 1 : page;

    if (!forceRefresh && this.ordersLoadedOnce && normalizedPage === this.ordersCurrentPage) {
      return;
    }

    this.isOrdersLoadingSignal.set(true);
    this.ordersLoadErrorSignal.set('');

    this.orderRequestService
      .getOrderRequests(normalizedPage, this.pageSize)
      .pipe(
        finalize(() => {
          this.isOrdersLoadingSignal.set(false);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          this.orderRequestsSignal.set(response.items);
          this.ordersTotalCountSignal.set(response.totalCount);
          this.ordersCurrentPageSignal.set(response.page);
          this.ordersTotalPagesSignal.set(response.totalPages);
          this.ordersLoadedOnce = true;
        },
        error: () => {
          this.orderRequestsSignal.set([]);
          this.ordersTotalCountSignal.set(0);
          this.ordersCurrentPageSignal.set(1);
          this.ordersTotalPagesSignal.set(0);
          this.ordersLoadedOnce = false;
          this.ordersLoadErrorSignal.set('تعذر تحميل طلبات المنتجات.');
        },
      });
  }

  loadProducts(forceRefresh = false): void {
    if (!forceRefresh && this.productsLoadedOnce) {
      return;
    }

    this.isProductsLoadingSignal.set(true);
    this.productsLoadErrorSignal.set('');

    this.productService
      .getProducts()
      .pipe(
        finalize(() => {
          this.isProductsLoadingSignal.set(false);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (products) => {
          this.productsSignal.set(products);
          this.syncProductImageIndexes(products);
          this.productsLoadedOnce = true;
        },
        error: () => {
          this.productsSignal.set([]);
          this.productImageIndexSignal.set({});
          this.productsLoadedOnce = false;
          this.productsLoadErrorSignal.set('تعذر تحميل المنتجات.');
        },
      });
  }

  loadNextPage(): void {
    if (!this.canGoNext) {
      return;
    }

    this.loadContacts(this.currentPage + 1, true);
  }

  loadPreviousPage(): void {
    if (!this.canGoPrevious) {
      return;
    }

    this.loadContacts(this.currentPage - 1, true);
  }

  refreshContacts(): void {
    this.loadContacts(this.currentPage, true);
  }

  refreshOrderRequests(): void {
    this.loadOrderRequests(this.ordersCurrentPage, true);
  }

  refreshProducts(): void {
    this.loadProducts(true);
  }

  loadNextOrdersPage(): void {
    if (!this.canGoNextOrders) {
      return;
    }

    this.loadOrderRequests(this.ordersCurrentPage + 1, true);
  }

  loadPreviousOrdersPage(): void {
    if (!this.canGoPreviousOrders) {
      return;
    }

    this.loadOrderRequests(this.ordersCurrentPage - 1, true);
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/admin/login');
  }

  selectSection(sectionKey: DashboardSectionKey): void {
    this.activeSectionSignal.set(sectionKey);

    if (sectionKey === 'orders') {
      this.loadOrderRequests(1, !this.ordersLoadedOnce);
    } else if (sectionKey === 'contacts') {
      this.loadContacts(1, !this.contactsLoadedOnce);
    } else if (sectionKey === 'products') {
      this.loadProducts(!this.productsLoadedOnce);
    }

    const targetRoute = this.sectionRouteMap[sectionKey];
    const currentRoute = this.normalizeRoutePath(this.router.url);

    if (currentRoute !== targetRoute) {
      void this.router.navigateByUrl(targetRoute);
    }

    if (this.isBrowser && window.innerWidth < this.desktopBreakpoint) {
      this.isSidebarOpenSignal.set(false);
    }
  }

  toggleSidebar(): void {
    this.isSidebarOpenSignal.set(!this.isSidebarOpenSignal());
  }

  closeSidebar(): void {
    this.isSidebarOpenSignal.set(false);
  }

  setContactsView(view: ContactsView): void {
    this.contactsViewSignal.set(view);
  }

  openAddProductForm(): void {
    if (this.activeSectionSignal() !== 'products') {
      this.selectSection('products');
    } else {
      this.loadProducts(!this.productsLoadedOnce);
    }

    this.cancelEdit();

    if (!this.isBrowser) {
      return;
    }

    requestAnimationFrame(() => {
      const formElement = document.getElementById('add-product-form');
      formElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  startEditProduct(product: ProductWithCategories): void {
    if (this.activeSectionSignal() !== 'products') {
      this.selectSection('products');
    }

    this.editingProductSignal.set(product);

    this.productFormSignal.set({
      name: product.name,
      nameAr: product.nameAr,
      sku: product.sku,
      price: product.price.toString(),
      openingStock: product.stockQuantity.toString(), // Used for mapping but won't be sent in update payload
      descriptionEn: product.descriptionEn,
      descriptionAr: product.descriptionAr,
      productType: product.productType,
      productState: product.productState,
      season: product.season,
      varieties: [...product.varieties],
      packagingOptions: [...product.packagingOptions],
      weightOptions: [...product.weightOptions],
      sizeOptions: [...product.sizeOptions],
      gradeOptions: [...product.gradeOptions],
    });

    const categoryIds = new Set(product.categories.map((c) => c.id));
    this.selectedCategoryIdsSignal.set(categoryIds);

    // Load existing images if available
    const existingImages = product.images ?? [];
    const formattedImages = existingImages.map((img) => ({
      id: img.id,
      url: this.resolveImageUrl(img.url),
    }));

    this.existingImagePreviewsSignal.set(formattedImages);
    this.imagePreviewsSignal.set([]);
    this.selectedProductImagesSignal.set([]);

    this.currentStepSignal.set(1);
    this.productSubmitErrorSignal.set('');
    this.productSubmitSuccessSignal.set('');

    if (this.isBrowser) {
      requestAnimationFrame(() => {
        const formElement = document.getElementById('add-product-form');
        formElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }

  cancelEdit(): void {
    this.editingProductSignal.set(null);
    this.resetProductForm();
    this.existingImagePreviewsSignal.set([]);
    this.productSubmitErrorSignal.set('');
    this.productSubmitSuccessSignal.set('');
  }

  deleteExistingImage(imageId: string): void {
    const product = this.editingProductSignal();
    if (!product) return;

    if (this.isBrowser) {
      const confirmed = window.confirm('هل أنت متأكد من حذف هذه الصورة نهائياً؟');
      if (!confirmed) return;
    }

    this.productSubmitErrorSignal.set('');

    this.productService
      .deleteProductImage(product.id, imageId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.existingImagePreviewsSignal.update((current) =>
            current.filter((img) => img.id !== imageId),
          );
          this.productSubmitSuccessSignal.set('تم حذف الصورة بنجاح.');
          setTimeout(() => this.productSubmitSuccessSignal.set(''), 3000);
          this.loadProducts(true);
        },
        error: () => {
          this.productSubmitErrorSignal.set('تعذر حذف الصورة. حاول مرة أخرى.');
        },
      });
  }

  onProductFieldInput(field: ProductTextField, value: string): void {
    let nextValue = value;

    if (field === 'sku') {
      nextValue = value.toUpperCase().replace(/\s+/g, '-');
    }

    this.productFormSignal.update((current) => ({ ...current, [field]: nextValue }));
    this.productSubmitErrorSignal.set('');
    this.productSubmitSuccessSignal.set('');
  }

  onProductOptionDraftInput(field: ProductOptionField, value: string): void {
    this.productOptionDraftsSignal.update((current) => ({ ...current, [field]: value }));
    this.productSubmitErrorSignal.set('');
    this.productSubmitSuccessSignal.set('');
  }

  addProductOption(field: ProductOptionField): void {
    const draft = this.productOptionDraftsSignal()[field].trim();

    if (!draft) {
      return;
    }

    this.productFormSignal.update((current) => {
      const normalized = draft.toLowerCase();
      const exists = current[field].some((item) => item.trim().toLowerCase() === normalized);

      if (exists) {
        return current;
      }

      return {
        ...current,
        [field]: [...current[field], draft],
      };
    });

    this.productOptionDraftsSignal.update((current) => ({ ...current, [field]: '' }));
    this.productSubmitErrorSignal.set('');
    this.productSubmitSuccessSignal.set('');
  }

  onProductOptionEnter(event: Event, field: ProductOptionField): void {
    event.preventDefault();
    this.addProductOption(field);
  }

  removeProductOption(field: ProductOptionField, index: number): void {
    this.productFormSignal.update((current) => ({
      ...current,
      [field]: current[field].filter((_, itemIndex) => itemIndex !== index),
    }));
    this.productSubmitErrorSignal.set('');
    this.productSubmitSuccessSignal.set('');
  }

  onProductImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const files = input?.files;

    if (!files || files.length === 0) {
      return;
    }

    this.addFilesWithPreviews(Array.from(files));
    this.productSubmitErrorSignal.set('');
    this.productSubmitSuccessSignal.set('');

    if (input) {
      input.value = '';
    }
  }

  removeSelectedProductImage(index: number): void {
    const previews = this.imagePreviewsSignal();
    if (previews[index]) {
      URL.revokeObjectURL(previews[index].url);
    }
    this.imagePreviewsSignal.update((current) => current.filter((_, i) => i !== index));
    this.selectedProductImagesSignal.update((current) =>
      current.filter((_, fileIndex) => fileIndex !== index),
    );
    this.productSubmitErrorSignal.set('');
    this.productSubmitSuccessSignal.set('');
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOverSignal.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOverSignal.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOverSignal.set(false);

    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) {
      return;
    }

    const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length > 0) {
      this.addFilesWithPreviews(imageFiles);
    }
  }

  nextStep(): void {
    const current = this.currentStepSignal();
    if (current < 4 && this.canProceedFromStep(current)) {
      this.currentStepSignal.set((current + 1) as ProductFormStep);
    }
  }

  prevStep(): void {
    const current = this.currentStepSignal();
    if (current > 1) {
      this.currentStepSignal.set((current - 1) as ProductFormStep);
    }
  }

  goToStep(step: ProductFormStep): void {
    const current = this.currentStepSignal();
    if (step <= current || this.canProceedFromStep((step - 1) as ProductFormStep)) {
      this.currentStepSignal.set(step);
    }
  }

  canProceedFromStep(step: ProductFormStep): boolean {
    const draft = this.productFormSignal();
    switch (step) {
      case 1:
        return (
          draft.name.trim().length > 0 &&
          draft.nameAr.trim().length > 0 &&
          draft.sku.trim().length > 0
        );
      case 2:
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  }

  isStepCompleted(step: ProductFormStep): boolean {
    const current = this.currentStepSignal();
    return step < current;
  }

  isStepActive(step: ProductFormStep): boolean {
    return this.currentStepSignal() === step;
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  private addFilesWithPreviews(files: File[]): void {
    const newPreviews: ImagePreview[] = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      size: this.formatFileSize(file.size),
    }));

    this.selectedProductImagesSignal.update((current) => [...current, ...files]);
    this.imagePreviewsSignal.update((current) => [...current, ...newPreviews]);
  }

  onCategoryNameInput(value: string): void {
    this.newCategoryNameSignal.set(value);
    this.productSubmitErrorSignal.set('');
  }

  addCategory(): void {
    const candidateName = this.newCategoryNameSignal().trim();

    if (!candidateName) {
      this.productSubmitErrorSignal.set('اكتب اسم الفئة أولاً.');
      return;
    }

    const exists = this.categoriesSignal().some(
      (category) => category.name.trim().toLowerCase() === candidateName.toLowerCase(),
    );

    if (exists) {
      this.productSubmitErrorSignal.set('هذه الفئة موجودة بالفعل.');
      return;
    }

    const nextCategory: CategoryItem = {
      id: this.createLocalId(),
      name: candidateName,
      colorClass: this.pickCategoryColorClass(this.categoriesSignal().length),
    };

    const nextCategories = [...this.categoriesSignal(), nextCategory];
    this.categoriesSignal.set(nextCategories);
    this.newCategoryNameSignal.set('');
    this.persistCategories(nextCategories);
  }

  toggleCategorySelection(categoryId: string): void {
    this.selectedCategoryIdsSignal.update((current) => {
      const next = new Set(current);

      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }

      return next;
    });
  }

  isCategorySelected(categoryId: string): boolean {
    return this.selectedCategoryIdsSignal().has(categoryId);
  }

  onSubmitProduct(event: Event): void {
    event.preventDefault();
    if (this.editingProductSignal() !== null) {
      this.updateProduct();
    } else {
      this.createProduct();
    }
  }

  onContactStatusChange(contact: ContactListItem, rawValue: string): void {
    const nextStatus = rawValue as ContactStatus;
    const currentStatus = this.statusValue(contact);

    if (
      nextStatus === currentStatus ||
      this.isStatusUpdating(contact.id) ||
      this.isContactDeleting(contact.id)
    ) {
      return;
    }

    this.updatingStatusIdsSignal.update((current) => {
      const next = new Set(current);
      next.add(contact.id);
      return next;
    });
    this.contactsLoadErrorSignal.set('');

    this.contactService
      .updateContactStatus(contact.id, nextStatus)
      .pipe(
        finalize(() => {
          this.updatingStatusIdsSignal.update((current) => {
            const next = new Set(current);
            next.delete(contact.id);
            return next;
          });
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          const backendStatus = this.toBackendStatus(nextStatus);
          this.contactsSignal.update((items) =>
            items.map((item) =>
              item.id === contact.id ? { ...item, status: backendStatus } : item,
            ),
          );
        },
        error: () => {
          this.contactsLoadErrorSignal.set('تعذر تحديث حالة التواصل.');
        },
      });
  }

  onOrderStatusChange(orderRequest: OrderRequestListItem, rawValue: string): void {
    const nextStatus = rawValue as OrderRequestStatus;
    const currentStatus = this.orderStatusValue(orderRequest);
    const previousBackendStatus = orderRequest.status;
    const nextBackendStatus = this.toBackendOrderStatus(nextStatus);

    if (
      nextStatus === currentStatus ||
      this.isOrderStatusUpdating(orderRequest.id) ||
      this.isOrderDeleting(orderRequest.id)
    ) {
      return;
    }

    this.orderRequestsSignal.update((items) =>
      items.map((item) =>
        item.id === orderRequest.id ? { ...item, status: nextBackendStatus } : item,
      ),
    );

    this.updatingOrderStatusIdsSignal.update((current) => {
      const next = new Set(current);
      next.add(orderRequest.id);
      return next;
    });
    this.ordersLoadErrorSignal.set('');

    this.orderRequestService
      .updateOrderRequestStatus(orderRequest.id, nextStatus)
      .pipe(
        finalize(() => {
          this.updatingOrderStatusIdsSignal.update((current) => {
            const next = new Set(current);
            next.delete(orderRequest.id);
            return next;
          });
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          // Optimistic update already applied above.
        },
        error: () => {
          this.orderRequestsSignal.update((items) =>
            items.map((item) =>
              item.id === orderRequest.id ? { ...item, status: previousBackendStatus } : item,
            ),
          );
          this.ordersLoadErrorSignal.set('تعذر تحديث حالة الطلب.');
        },
      });
  }

  onDeleteOrderRequest(orderRequest: OrderRequestListItem): void {
    if (this.isOrderDeleting(orderRequest.id) || this.isOrderStatusUpdating(orderRequest.id)) {
      return;
    }

    if (this.isBrowser) {
      const confirmed = window.confirm(
        `هل أنت متأكد من حذف طلب "${orderRequest.productNameSnapshot}" للعميل "${orderRequest.requesterName}"؟`,
      );

      if (!confirmed) {
        return;
      }
    }

    this.deletingOrderRequestIdsSignal.update((current) => {
      const next = new Set(current);
      next.add(orderRequest.id);
      return next;
    });
    this.ordersLoadErrorSignal.set('');

    this.orderRequestService
      .deleteOrderRequest(orderRequest.id)
      .pipe(
        finalize(() => {
          this.deletingOrderRequestIdsSignal.update((current) => {
            const next = new Set(current);
            next.delete(orderRequest.id);
            return next;
          });
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          const targetPage =
            this.orderRequestsSignal().length === 1 && this.ordersCurrentPageSignal() > 1
              ? this.ordersCurrentPageSignal() - 1
              : this.ordersCurrentPageSignal();

          this.loadOrderRequests(targetPage, true);
        },
        error: () => {
          this.ordersLoadErrorSignal.set('تعذر حذف الطلب. حاول مرة أخرى.');
        },
      });
  }

  isStatusUpdating(contactId: string): boolean {
    return this.updatingStatusIdsSignal().has(contactId);
  }

  isOrderStatusUpdating(orderRequestId: string): boolean {
    return this.updatingOrderStatusIdsSignal().has(orderRequestId);
  }

  isOrderDeleting(orderRequestId: string): boolean {
    return this.deletingOrderRequestIdsSignal().has(orderRequestId);
  }

  onDeleteContact(contact: ContactListItem): void {
    if (this.isContactDeleting(contact.id) || this.isStatusUpdating(contact.id)) {
      return;
    }

    if (this.isBrowser) {
      const confirmed = window.confirm(`هل أنت متأكد من حذف جهة التواصل "${contact.fullName}"؟`);

      if (!confirmed) {
        return;
      }
    }

    this.deletingContactIdsSignal.update((current) => {
      const next = new Set(current);
      next.add(contact.id);
      return next;
    });
    this.contactsLoadErrorSignal.set('');

    this.contactService
      .deleteContact(contact.id)
      .pipe(
        finalize(() => {
          this.deletingContactIdsSignal.update((current) => {
            const next = new Set(current);
            next.delete(contact.id);
            return next;
          });
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          const remainingContacts = this.contactsSignal().filter((item) => item.id !== contact.id);
          const nextTotalCount = Math.max(0, this.totalCountSignal() - 1);
          const nextTotalPages = nextTotalCount > 0 ? Math.ceil(nextTotalCount / this.pageSize) : 0;

          this.contactsSignal.set(remainingContacts);
          this.totalCountSignal.set(nextTotalCount);
          this.totalPagesSignal.set(nextTotalPages);

          if (remainingContacts.length === 0 && this.currentPageSignal() > 1) {
            this.loadContacts(this.currentPageSignal() - 1, true);
          }
        },
        error: () => {
          this.contactsLoadErrorSignal.set('تعذر حذف جهة التواصل.');
        },
      });
  }

  isContactDeleting(contactId: string): boolean {
    return this.deletingContactIdsSignal().has(contactId);
  }

  statusValue(contact: ContactListItem): ContactStatus {
    return this.contactService.normalizeStatus(contact.status);
  }

  statusLabel(contact: ContactListItem): string {
    return (
      this.statusOptions.find((x) => x.value === this.statusValue(contact))?.label ?? 'جاري التواصل'
    );
  }

  statusBadgeClass(contact: ContactListItem): string {
    const status = this.statusValue(contact);

    if (status === 'sale_confirmed') {
      return 'state state--ok';
    }

    if (status === 'contacted') {
      return 'state state--ship';
    }

    return 'state state--review';
  }

  statusSelectClass(contact: ContactListItem): string {
    const status = this.statusValue(contact);

    if (status === 'sale_confirmed') {
      return 'status-select--ok';
    }

    if (status === 'contacted') {
      return 'status-select--contacted';
    }

    return 'status-select--in-progress';
  }

  trackByContactId(_: number, contact: ContactListItem): string {
    return contact.id;
  }

  trackByOrderRequestId(_: number, orderRequest: OrderRequestListItem): string {
    return orderRequest.id;
  }

  trackByProductId(_: number, product: ProductWithCategories): string {
    return product.id;
  }

  trackByCategoryId(_: number, category: CategoryItem): string {
    return category.id;
  }

  serviceTypeLabel(contact: ContactListItem): string {
    return this.isExportContact(contact) ? 'تصدير' : 'توريد محلي';
  }

  displayValue(value: string | null): string {
    if (!value) {
      return '-';
    }

    const normalized = value.trim();
    return normalized === '' ? '-' : normalized;
  }

  quantityLabel(quantityTons: number | null): string {
    return quantityTons === null ? '-' : `${quantityTons} طن`;
  }

  orderStatusValue(orderRequest: OrderRequestListItem): OrderRequestStatus {
    return this.orderRequestService.normalizeStatus(orderRequest.status);
  }

  orderStatusLabel(orderRequest: OrderRequestListItem): string {
    return (
      this.orderStatusOptions.find((option) => option.value === this.orderStatusValue(orderRequest))
        ?.label ?? 'جديد'
    );
  }

  orderStatusBadgeClass(orderRequest: OrderRequestListItem): string {
    const status = this.orderStatusValue(orderRequest);

    switch (status) {
      case 'in_review':
        return 'state state--review';
      case 'contacted':
        return 'state state--ship';
      case 'confirmed':
        return 'state state--ok';
      case 'closed':
        return 'state state--closed';
      default:
        return 'state state--new';
    }
  }

  orderStatusSelectClass(orderRequest: OrderRequestListItem): string {
    const status = this.orderStatusValue(orderRequest);

    switch (status) {
      case 'in_review':
        return 'order-status-select--in-review';
      case 'contacted':
        return 'order-status-select--contacted';
      case 'confirmed':
        return 'order-status-select--confirmed';
      case 'closed':
        return 'order-status-select--closed';
      default:
        return 'order-status-select--new';
    }
  }

  formatOrderCreatedAt(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return this.dateTimeFormatter.format(date);
  }

  formatPrice(price: number): string {
    return this.priceFormatter.format(price);
  }

  formatProductDivision(product: ProductListItem): string {
    return `${product.productType} / ${product.productState} / ${product.season}`;
  }

  formatArrayPreview(values: string[]): string {
    if (values.length === 0) {
      return '-';
    }

    if (values.length <= 3) {
      return values.join(' - ');
    }

    return `${values.slice(0, 3).join(' - ')} +${values.length - 3}`;
  }

  productImageUrls(product: ProductListItem): string[] {
    return this.resolveProductImageUrls(product.imageUrls);
  }

  hasProductImages(product: ProductListItem): boolean {
    return this.productImageUrls(product).length > 0;
  }

  currentProductImageIndex(product: ProductListItem): number {
    const images = this.productImageUrls(product);

    if (images.length === 0) {
      return 0;
    }

    const current = this.productImageIndexSignal()[product.id] ?? 0;

    if (current < 0 || current >= images.length) {
      return 0;
    }

    return current;
  }

  currentProductImageUrl(product: ProductListItem): string | null {
    const images = this.productImageUrls(product);
    if (images.length === 0) {
      return null;
    }

    return images[this.currentProductImageIndex(product)];
  }

  nextProductImage(product: ProductListItem): void {
    const images = this.productImageUrls(product);

    if (images.length <= 1) {
      return;
    }

    const current = this.currentProductImageIndex(product);
    const next = (current + 1) % images.length;
    this.setProductImageIndex(product.id, next);
  }

  previousProductImage(product: ProductListItem): void {
    const images = this.productImageUrls(product);

    if (images.length <= 1) {
      return;
    }

    const current = this.currentProductImageIndex(product);
    const next = (current - 1 + images.length) % images.length;
    this.setProductImageIndex(product.id, next);
  }

  goToProductImage(product: ProductListItem, index: number): void {
    const images = this.productImageUrls(product);

    if (images.length === 0 || index < 0 || index >= images.length) {
      return;
    }

    this.setProductImageIndex(product.id, index);
  }

  private createProduct(): void {
    if (this.isCreatingProductSignal()) {
      return;
    }

    const draft = this.productFormSignal();
    const payload = this.buildProductPayload(draft);

    if (!payload) {
      return;
    }

    const selectedImages = [...this.selectedProductImagesSignal()];
    const withImagesSuccessText =
      selectedImages.length > 0
        ? `تمت إضافة المنتج ورفع ${selectedImages.length} صورة بنجاح.`
        : 'تمت إضافة المنتج بنجاح.';

    this.isCreatingProductSignal.set(true);
    this.productSubmitErrorSignal.set('');
    this.productSubmitSuccessSignal.set('');

    this.productService
      .createProduct(payload)
      .pipe(
        switchMap((created) => {
          if (selectedImages.length === 0) {
            return of(created);
          }

          return this.productService
            .uploadProductImages(created.productId, selectedImages)
            .pipe(map(() => created));
        }),
        finalize(() => {
          this.isCreatingProductSignal.set(false);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          const categoryIds = [...this.selectedCategoryIdsSignal()];
          if (categoryIds.length > 0) {
            this.productCategoryMapSignal.update((current) => ({
              ...current,
              [payload.sku]: categoryIds,
            }));
            this.persistProductCategoryMap();
          }

          this.resetProductForm();
          this.productSubmitSuccessSignal.set(withImagesSuccessText);
          this.loadProducts(true);
        },
        error: () => {
          this.productSubmitErrorSignal.set(
            'تعذر إضافة المنتج أو رفع الصور. تأكد من صحة البيانات أو تكرار SKU.',
          );
        },
      });
  }

  private updateProduct(): void {
    const product = this.editingProductSignal();
    if (this.isUpdatingProductSignal() || !product) {
      return;
    }

    const draft = this.productFormSignal();
    const payload = this.buildProductPayload(draft);

    if (!payload) {
      return;
    }

    const selectedImages = [...this.selectedProductImagesSignal()];
    const withImagesSuccessText =
      selectedImages.length > 0
        ? `تم تعديل المنتج ورفع ${selectedImages.length} صور جديدة بنجاح.`
        : 'تم تعديل المنتج بنجاح.';

    this.isUpdatingProductSignal.set(true);
    this.productSubmitErrorSignal.set('');
    this.productSubmitSuccessSignal.set('');

    const updatePayload = {
      ...payload,
      stockQuantity: payload.openingStock,
    };

    this.productService
      .updateProduct(product.id, updatePayload)
      .pipe(
        switchMap((updated) => {
          if (selectedImages.length === 0) {
            return of(updated);
          }

          return this.productService
            .uploadProductImages(updated.productId, selectedImages)
            .pipe(map(() => updated));
        }),
        finalize(() => {
          this.isUpdatingProductSignal.set(false);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          const categoryIds = [...this.selectedCategoryIdsSignal()];
          if (categoryIds.length > 0) {
            this.productCategoryMapSignal.update((current) => ({
              ...current,
              [payload.sku]: categoryIds,
            }));
            this.persistProductCategoryMap();
          }

          this.cancelEdit();
          this.productSubmitSuccessSignal.set(withImagesSuccessText);
          setTimeout(() => this.productSubmitSuccessSignal.set(''), 3000);
          this.loadProducts(true);
        },
        error: () => {
          this.productSubmitErrorSignal.set('تعذر تعديل المنتج أو رفع الصور.');
        },
      });
  }

  private resetProductForm(): void {
    this.productFormSignal.set({
      name: '',
      nameAr: '',
      sku: '',
      price: '',
      openingStock: '',
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
    this.productOptionDraftsSignal.set({
      varieties: '',
      packagingOptions: '',
      weightOptions: '',
      sizeOptions: '',
      gradeOptions: '',
    });
    // Revoke all image preview URLs
    for (const preview of this.imagePreviewsSignal()) {
      URL.revokeObjectURL(preview.url);
    }
    this.selectedProductImagesSignal.set([]);
    this.imagePreviewsSignal.set([]);
    this.currentStepSignal.set(1);
    this.selectedCategoryIdsSignal.set(new Set<string>());
  }

  private buildProductPayload(draft: ProductFormState): CreateProductPayload | null {
    const name = draft.name.trim();
    const nameAr = draft.nameAr.trim();
    const sku = this.normalizeSku(draft.sku);
    const price = draft.price.trim() === '' ? 0 : Number(draft.price);
    const openingStock = draft.openingStock.trim() === '' ? 0 : Number(draft.openingStock);
    const descriptionEn = draft.descriptionEn.trim();
    const descriptionAr = draft.descriptionAr.trim();
    const varieties = [...draft.varieties];
    const packagingOptions = [...draft.packagingOptions];
    const weightOptions = [...draft.weightOptions];
    const sizeOptions = [...draft.sizeOptions];
    const gradeOptions = [...draft.gradeOptions];

    if (!name) {
      this.productSubmitErrorSignal.set('اسم المنتج مطلوب.');
      return null;
    }

    if (!nameAr) {
      this.productSubmitErrorSignal.set('الاسم العربي للمنتج مطلوب.');
      return null;
    }

    if (!sku) {
      this.productSubmitErrorSignal.set('SKU مطلوب.');
      return null;
    }

    if (!Number.isFinite(price) || price < 0) {
      this.productSubmitErrorSignal.set('السعر غير صحيح.');
      return null;
    }

    if (!Number.isInteger(openingStock) || openingStock < 0) {
      this.productSubmitErrorSignal.set('المخزون الافتتاحي يجب أن يكون رقمًا صحيحًا.');
      return null;
    }

    return {
      name,
      nameAr,
      sku,
      price,
      openingStock,
      descriptionEn,
      descriptionAr,
      productType: draft.productType,
      productState: draft.productState,
      season: draft.season,
      varieties,
      packagingOptions,
      weightOptions,
      sizeOptions,
      gradeOptions,
    };
  }

  private syncSectionWithRoute(): void {
    const routePath = this.normalizeRoutePath(this.router.url);
    const nextSection = this.resolveSectionByRoute(routePath);

    if (this.activeSectionSignal() !== nextSection) {
      this.activeSectionSignal.set(nextSection);
    }

    if (nextSection === 'orders' && !this.ordersLoadedOnce) {
      this.loadOrderRequests(1, true);
    }

    if (nextSection === 'contacts' && !this.contactsLoadedOnce) {
      this.loadContacts(1, true);
    }

    if (nextSection === 'products' && !this.productsLoadedOnce) {
      this.loadProducts(true);
    }
  }

  private resolveSectionByRoute(routePath: string): DashboardSectionKey {
    switch (routePath) {
      case '/admin':
        return 'products';
      case '/admin/orders':
        return 'orders';
      case '/admin/products':
        return 'products';
      case '/admin/contacts':
        return 'contacts';
      case '/admin/settings':
        return 'settings';
      default:
        return 'products';
    }
  }

  private normalizeRoutePath(url: string): string {
    const path = url.split('?')[0].split('#')[0];
    return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
  }

  private isExportContact(contact: ContactListItem): boolean {
    return contact.serviceType.trim().toLowerCase() === 'export';
  }

  private toBackendStatus(status: ContactStatus): string {
    switch (status) {
      case 'contacted':
        return 'Contacted';
      case 'sale_confirmed':
        return 'SaleConfirmed';
      default:
        return 'InProgress';
    }
  }

  private toBackendOrderStatus(status: OrderRequestStatus): string {
    switch (status) {
      case 'in_review':
        return 'InReview';
      case 'contacted':
        return 'Contacted';
      case 'confirmed':
        return 'Confirmed';
      case 'closed':
        return 'Closed';
      default:
        return 'New';
    }
  }

  private createLocalId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    return `cat-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  }

  private pickCategoryColorClass(index: number): string {
    return this.categoryColorClasses[index % this.categoryColorClasses.length];
  }

  private normalizeSku(sku: string): string {
    return sku.trim().toUpperCase();
  }

  private resolveProductImageUrls(imageUrls: string[] | undefined): string[] {
    if (!imageUrls || imageUrls.length === 0) {
      return [];
    }

    return imageUrls
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .map((item) => this.resolveImageUrl(item));
  }

  private resolveImageUrl(pathOrUrl: string): string {
    if (
      /^(https?:)?\/\//i.test(pathOrUrl) ||
      pathOrUrl.startsWith('data:') ||
      pathOrUrl.startsWith('blob:')
    ) {
      return pathOrUrl;
    }

    const base = this.apiBaseUrl.trim().replace(/\/+$/, '');

    if (!base) {
      return pathOrUrl;
    }

    if (pathOrUrl.startsWith('/')) {
      return `${base}${pathOrUrl}`;
    }

    return `${base}/${pathOrUrl}`;
  }

  private setProductImageIndex(productId: string, index: number): void {
    this.productImageIndexSignal.update((current) => ({
      ...current,
      [productId]: index,
    }));
  }

  private syncProductImageIndexes(products: ProductListItem[]): void {
    const current = this.productImageIndexSignal();
    const next: Record<string, number> = {};

    for (const product of products) {
      const imageCount = this.resolveProductImageUrls(product.imageUrls).length;

      if (imageCount === 0) {
        continue;
      }

      const currentIndex = current[product.id] ?? 0;
      next[product.id] = currentIndex >= 0 && currentIndex < imageCount ? currentIndex : 0;
    }

    this.productImageIndexSignal.set(next);
  }

  private readCategoriesFromStorage(): CategoryItem[] {
    if (!this.isBrowser || typeof localStorage === 'undefined') {
      return this.defaultCategories.map((category) => ({ ...category }));
    }

    const raw = localStorage.getItem(this.categoryStorageKey);

    if (!raw) {
      return this.defaultCategories.map((category) => ({ ...category }));
    }

    try {
      const parsed = JSON.parse(raw);

      if (!Array.isArray(parsed)) {
        return this.defaultCategories.map((category) => ({ ...category }));
      }

      const parsedCategories = parsed
        .map((item, index): CategoryItem | null => {
          if (typeof item !== 'object' || item === null) {
            return null;
          }

          const id =
            typeof (item as { id?: unknown }).id === 'string' ? (item as { id: string }).id : '';
          const name =
            typeof (item as { name?: unknown }).name === 'string'
              ? (item as { name: string }).name.trim()
              : '';
          const colorClass =
            typeof (item as { colorClass?: unknown }).colorClass === 'string'
              ? (item as { colorClass: string }).colorClass
              : this.pickCategoryColorClass(index);

          if (!id || !name) {
            return null;
          }

          const normalizedColorClass = this.categoryColorClasses.includes(
            colorClass as (typeof this.categoryColorClasses)[number],
          )
            ? colorClass
            : this.pickCategoryColorClass(index);

          return {
            id,
            name,
            colorClass: normalizedColorClass,
          };
        })
        .filter((item): item is CategoryItem => item !== null);

      if (parsedCategories.length === 0) {
        return this.defaultCategories.map((category) => ({ ...category }));
      }

      return parsedCategories;
    } catch {
      return this.defaultCategories.map((category) => ({ ...category }));
    }
  }

  private readProductCategoryMapFromStorage(): Record<string, string[]> {
    if (!this.isBrowser || typeof localStorage === 'undefined') {
      return {};
    }

    const raw = localStorage.getItem(this.productCategoryStorageKey);

    if (!raw) {
      return {};
    }

    try {
      const parsed = JSON.parse(raw);

      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return {};
      }

      const next: Record<string, string[]> = {};

      for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
        if (typeof key !== 'string' || !Array.isArray(value)) {
          continue;
        }

        const normalizedSku = this.normalizeSku(key);
        const categoryIds = value.filter(
          (item): item is string => typeof item === 'string' && item.length > 0,
        );

        if (categoryIds.length > 0) {
          next[normalizedSku] = categoryIds;
        }
      }

      return next;
    } catch {
      return {};
    }
  }

  private persistCategories(categories: CategoryItem[]): void {
    if (!this.isBrowser || typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(this.categoryStorageKey, JSON.stringify(categories));
  }

  private persistProductCategoryMap(): void {
    if (!this.isBrowser || typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(
      this.productCategoryStorageKey,
      JSON.stringify(this.productCategoryMapSignal()),
    );
  }
}
