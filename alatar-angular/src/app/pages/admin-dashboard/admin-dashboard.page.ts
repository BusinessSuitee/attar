import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, finalize } from 'rxjs';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { AuthService, AuthenticatedAdmin } from '../../core/auth/auth.service';
import { ContactListItem, ContactService, ContactStatus } from '../../core/contacts/contact.service';
import { CreateProductPayload, ProductListItem, ProductService } from '../../core/products/product.service';

type DashboardSectionKey = 'overview' | 'orders' | 'products' | 'contacts' | 'settings';

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

type ProductFormState = {
  name: string;
  sku: string;
  price: string;
  openingStock: string;
};

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
  styleUrl: './admin-dashboard.page.css'
})
export class AdminDashboardPageComponent {
  private readonly authService = inject(AuthService);
  private readonly contactService = inject(ContactService);
  private readonly productService = inject(ProductService);
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
    settings: '/admin/settings'
  };

  private readonly categoryColorClasses = [
    'category-pill--green',
    'category-pill--orange',
    'category-pill--blue',
    'category-pill--purple'
  ] as const;
  private readonly priceFormatter = new Intl.NumberFormat('ar-EG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  private readonly defaultCategories: CategoryItem[] = [
    { id: 'citrus', name: 'موالح', colorClass: 'category-pill--green' },
    { id: 'grapes', name: 'عنب', colorClass: 'category-pill--purple' },
    { id: 'potatoes', name: 'بطاطس', colorClass: 'category-pill--orange' }
  ];

  private contactsLoadedOnce = false;
  private productsLoadedOnce = false;

  private readonly profileSignal = signal<AuthenticatedAdmin | null>(null);
  private readonly contactsSignal = signal<ContactListItem[]>([]);
  private readonly productsSignal = signal<ProductListItem[]>([]);
  private readonly productFormSignal = signal<ProductFormState>({
    name: '',
    sku: '',
    price: '',
    openingStock: ''
  });
  private readonly categoriesSignal = signal<CategoryItem[]>(this.readCategoriesFromStorage());
  private readonly selectedCategoryIdsSignal = signal<ReadonlySet<string>>(new Set<string>());
  private readonly productCategoryMapSignal = signal<Record<string, string[]>>(
    this.readProductCategoryMapFromStorage()
  );
  private readonly newCategoryNameSignal = signal('');
  private readonly isLoadingSignal = signal(false);
  private readonly isContactsLoadingSignal = signal(false);
  private readonly isProductsLoadingSignal = signal(false);
  private readonly isCreatingProductSignal = signal(false);
  private readonly loadErrorSignal = signal('');
  private readonly contactsLoadErrorSignal = signal('');
  private readonly productsLoadErrorSignal = signal('');
  private readonly productSubmitErrorSignal = signal('');
  private readonly productSubmitSuccessSignal = signal('');
  private readonly isSidebarOpenSignal = signal(
    this.isBrowser ? window.innerWidth >= this.desktopBreakpoint : false
  );
  private readonly contactsViewSignal = signal<ContactsView>('rows');
  private readonly currentPageSignal = signal(1);
  private readonly totalPagesSignal = signal(0);
  private readonly totalCountSignal = signal(0);
  private readonly activeSectionSignal = signal<DashboardSectionKey>('overview');
  private readonly updatingStatusIdsSignal = signal<ReadonlySet<string>>(new Set<string>());
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
    { value: 'sale_confirmed', label: 'تم تأكيد البيع' }
  ];

  readonly sections: DashboardSection[] = [
    { key: 'overview', label: 'لوحة التحكم', icon: 'dashboard' },
    { key: 'orders', label: 'الطلبات', icon: 'shopping_cart' },
    { key: 'products', label: 'إضافة منتج', icon: 'add_box' },
    { key: 'contacts', label: 'التواصل', icon: 'contact_phone' },
    { key: 'settings', label: 'الإعدادات', icon: 'settings' }
  ];

  get profile(): AuthenticatedAdmin | null {
    return this.profileSignal();
  }

  get contacts(): ContactListItem[] {
    return this.contactsSignal();
  }

  get productsWithCategories(): ProductWithCategories[] {
    return this.productsWithCategoriesSignal();
  }

  get productForm(): ProductFormState {
    return this.productFormSignal();
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

  get isProductsLoading(): boolean {
    return this.isProductsLoadingSignal();
  }

  get isCreatingProduct(): boolean {
    return this.isCreatingProductSignal();
  }

  get loadError(): string {
    return this.loadErrorSignal();
  }

  get contactsLoadError(): string {
    return this.contactsLoadErrorSignal();
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

  get activeSection(): DashboardSectionKey {
    return this.activeSectionSignal();
  }

  get hasContacts(): boolean {
    return this.contacts.length > 0;
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

  get canGoPrevious(): boolean {
    return this.currentPage > 1;
  }

  get canGoNext(): boolean {
    return this.totalPages > 0 && this.currentPage < this.totalPages;
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
        takeUntilDestroyed(this.destroyRef)
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
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (profile) => {
          this.profileSignal.set(profile);
        },
        error: () => {
          this.profileSignal.set(null);
          this.loadErrorSignal.set('تعذر تحميل بيانات الجلسة. حاول تسجيل الدخول مرة أخرى.');
        }
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
        takeUntilDestroyed(this.destroyRef)
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
        }
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
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (products) => {
          this.productsSignal.set(products);
          this.productsLoadedOnce = true;
        },
        error: () => {
          this.productsSignal.set([]);
          this.productsLoadedOnce = false;
          this.productsLoadErrorSignal.set('تعذر تحميل المنتجات.');
        }
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

  refreshProducts(): void {
    this.loadProducts(true);
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/admin/login');
  }

  selectSection(sectionKey: DashboardSectionKey): void {
    this.activeSectionSignal.set(sectionKey);

    if (sectionKey === 'contacts') {
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

    if (!this.isBrowser) {
      return;
    }

    requestAnimationFrame(() => {
      const formElement = document.getElementById('add-product-form');
      formElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  onProductFieldInput(field: keyof ProductFormState, value: string): void {
    let nextValue = value;

    if (field === 'sku') {
      nextValue = value.toUpperCase().replace(/\s+/g, '-');
    }

    this.productFormSignal.update((current) => ({ ...current, [field]: nextValue }));
    this.productSubmitErrorSignal.set('');
    this.productSubmitSuccessSignal.set('');
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
      (category) => category.name.trim().toLowerCase() === candidateName.toLowerCase()
    );

    if (exists) {
      this.productSubmitErrorSignal.set('هذه الفئة موجودة بالفعل.');
      return;
    }

    const nextCategory: CategoryItem = {
      id: this.createLocalId(),
      name: candidateName,
      colorClass: this.pickCategoryColorClass(this.categoriesSignal().length)
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

  onCreateProduct(event: Event): void {
    event.preventDefault();
    this.createProduct();
  }

  onContactStatusChange(contact: ContactListItem, rawValue: string): void {
    const nextStatus = rawValue as ContactStatus;
    const currentStatus = this.statusValue(contact);

    if (nextStatus === currentStatus || this.isStatusUpdating(contact.id) || this.isContactDeleting(contact.id)) {
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
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          const backendStatus = this.toBackendStatus(nextStatus);
          this.contactsSignal.update((items) =>
            items.map((item) => (item.id === contact.id ? { ...item, status: backendStatus } : item))
          );
        },
        error: () => {
          this.contactsLoadErrorSignal.set('تعذر تحديث حالة التواصل.');
        }
      });
  }

  isStatusUpdating(contactId: string): boolean {
    return this.updatingStatusIdsSignal().has(contactId);
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
        takeUntilDestroyed(this.destroyRef)
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
        }
      });
  }

  isContactDeleting(contactId: string): boolean {
    return this.deletingContactIdsSignal().has(contactId);
  }

  statusValue(contact: ContactListItem): ContactStatus {
    return this.contactService.normalizeStatus(contact.status);
  }

  statusLabel(contact: ContactListItem): string {
    return this.statusOptions.find((x) => x.value === this.statusValue(contact))?.label ?? 'جاري التواصل';
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

  formatPrice(price: number): string {
    return this.priceFormatter.format(price);
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

    const selectedCategoryIds = this.normalizeSelectedCategoryIds();

    this.isCreatingProductSignal.set(true);
    this.productSubmitErrorSignal.set('');
    this.productSubmitSuccessSignal.set('');

    this.productService
      .createProduct(payload)
      .pipe(
        finalize(() => {
          this.isCreatingProductSignal.set(false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          if (selectedCategoryIds.length > 0) {
            this.productCategoryMapSignal.update((current) => ({
              ...current,
              [this.normalizeSku(payload.sku)]: selectedCategoryIds
            }));
            this.persistProductCategoryMap();
          }

          this.productFormSignal.set({
            name: '',
            sku: '',
            price: '',
            openingStock: ''
          });
          this.selectedCategoryIdsSignal.set(new Set<string>());
          this.productSubmitSuccessSignal.set('تمت إضافة المنتج بنجاح.');
          this.loadProducts(true);
        },
        error: () => {
          this.productSubmitErrorSignal.set('تعذر إضافة المنتج. تأكد من صحة البيانات أو تكرار SKU.');
        }
      });
  }

  private buildProductPayload(draft: ProductFormState): CreateProductPayload | null {
    const name = draft.name.trim();
    const sku = this.normalizeSku(draft.sku);
    const price = Number(draft.price);
    const openingStock = Number(draft.openingStock);

    if (!name) {
      this.productSubmitErrorSignal.set('اسم المنتج مطلوب.');
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
      sku,
      price,
      openingStock
    };
  }

  private normalizeSelectedCategoryIds(): string[] {
    const allowedCategoryIds = new Set(this.categoriesSignal().map((category) => category.id));
    return Array.from(this.selectedCategoryIdsSignal()).filter((categoryId) =>
      allowedCategoryIds.has(categoryId)
    );
  }

  private syncSectionWithRoute(): void {
    const routePath = this.normalizeRoutePath(this.router.url);
    const nextSection = this.resolveSectionByRoute(routePath);

    if (this.activeSectionSignal() !== nextSection) {
      this.activeSectionSignal.set(nextSection);
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
      case '/admin/orders':
        return 'orders';
      case '/admin/products':
        return 'products';
      case '/admin/contacts':
        return 'contacts';
      case '/admin/settings':
        return 'settings';
      default:
        return 'overview';
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

          const id = typeof (item as { id?: unknown }).id === 'string' ? (item as { id: string }).id : '';
          const name =
            typeof (item as { name?: unknown }).name === 'string' ? (item as { name: string }).name.trim() : '';
          const colorClass =
            typeof (item as { colorClass?: unknown }).colorClass === 'string'
              ? (item as { colorClass: string }).colorClass
              : this.pickCategoryColorClass(index);

          if (!id || !name) {
            return null;
          }

          const normalizedColorClass = this.categoryColorClasses.includes(
            colorClass as (typeof this.categoryColorClasses)[number]
          )
            ? colorClass
            : this.pickCategoryColorClass(index);

          return {
            id,
            name,
            colorClass: normalizedColorClass
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
        const categoryIds = value.filter((item): item is string => typeof item === 'string' && item.length > 0);

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

    localStorage.setItem(this.productCategoryStorageKey, JSON.stringify(this.productCategoryMapSignal()));
  }
}
