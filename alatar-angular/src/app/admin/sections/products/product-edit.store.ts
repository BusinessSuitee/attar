import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';

import {
  CreateProductPayload,
  ProductImageInfo,
  ProductListItem,
  ProductService,
  ProductStatus,
  UpdateProductPayload,
} from '../../../core/products/product.service';
import { BackendErrorTranslator } from '../../../core/api/backend-error-translator.service';
import { AdminCatalogStore } from './admin-catalog.store';

@Injectable()
export class ProductEditStore {
  private readonly productService = inject(ProductService);
  private readonly catalog = inject(AdminCatalogStore);
  private readonly errors = inject(BackendErrorTranslator);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _product = signal<ProductListItem | null>(null);
  private readonly _isLoading = signal(false);
  private readonly _isSaving = signal(false);
  private readonly _isDeleting = signal(false);
  private readonly _isUploading = signal(false);
  private readonly _hasError = signal(false);
  private readonly _errorMessage = signal<string | null>(null);

  readonly product = this._product.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isSaving = this._isSaving.asReadonly();
  readonly isDeleting = this._isDeleting.asReadonly();
  readonly isUploading = this._isUploading.asReadonly();
  readonly hasError = this._hasError.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();

  reset(): void {
    this._product.set(null);
    this._hasError.set(false);
    this._errorMessage.set(null);
  }

  async load(productId: string): Promise<ProductListItem> {
    this._hasError.set(false);
    this._errorMessage.set(null);

    const cached = this.catalog.all().find((p) => p.id === productId);
    if (cached) {
      this._product.set(cached);
      return cached;
    }

    this._isLoading.set(true);
    try {
      const products = await firstValueFrom(
        this.productService.getProducts().pipe(takeUntilDestroyed(this.destroyRef)),
      );
      const found = products.find((p) => p.id === productId);
      if (!found) {
        const message = this.errors.translate({
          status: 404,
          error: { title: 'Products.NotFound' },
        } as never);
        this._hasError.set(true);
        this._errorMessage.set(message);
        throw new Error(message);
      }
      this._product.set(found);
      return found;
    } catch (error) {
      this._hasError.set(true);
      const message = this.errors.translate(error);
      this._errorMessage.set(message);
      throw new Error(message);
    } finally {
      this._isLoading.set(false);
    }
  }

  async create(payload: CreateProductPayload): Promise<string> {
    this._isSaving.set(true);
    try {
      const response = await firstValueFrom(
        this.productService.createProduct(payload).pipe(takeUntilDestroyed(this.destroyRef)),
      );
      return response.productId;
    } catch (error) {
      throw new Error(this.errors.translate(error));
    } finally {
      this._isSaving.set(false);
    }
  }

  async update(productId: string, payload: UpdateProductPayload): Promise<void> {
    this._isSaving.set(true);
    try {
      await firstValueFrom(
        this.productService
          .updateProduct(productId, payload)
          .pipe(takeUntilDestroyed(this.destroyRef)),
      );
      this._product.update((current) =>
        current
          ? {
              ...current,
              name: payload.name,
              nameAr: payload.nameAr,
              price: payload.price,
              stockQuantity: payload.stockQuantity,
              descriptionEn: payload.descriptionEn,
              descriptionAr: payload.descriptionAr,
              productType: payload.productType,
              productState: payload.productState,
              season: payload.season,
              varieties: payload.varieties,
              varietiesLocalized: payload.varietiesLocalized ?? current.varietiesLocalized,
              packagingOptions: payload.packagingOptions,
              packagingOptionsLocalized:
                payload.packagingOptionsLocalized ?? current.packagingOptionsLocalized,
              weightOptions: payload.weightOptions,
              weightOptionsLocalized:
                payload.weightOptionsLocalized ?? current.weightOptionsLocalized,
              sizeOptions: payload.sizeOptions,
              sizeOptionsLocalized: payload.sizeOptionsLocalized ?? current.sizeOptionsLocalized,
              gradeOptions: payload.gradeOptions,
              gradeOptionsLocalized:
                payload.gradeOptionsLocalized ?? current.gradeOptionsLocalized,
            }
          : current,
      );

      const next = this._product();
      if (next) this.catalog.upsertProduct(next);
    } catch (error) {
      throw new Error(this.errors.translate(error));
    } finally {
      this._isSaving.set(false);
    }
  }

  async changeStatus(productId: string, status: ProductStatus): Promise<void> {
    try {
      await firstValueFrom(
        this.productService
          .changeProductStatus(productId, status)
          .pipe(takeUntilDestroyed(this.destroyRef)),
      );
      this._product.update((current) => (current ? { ...current, status } : current));
      this.catalog.patchStatus(productId, status);
    } catch (error) {
      throw new Error(this.errors.translate(error));
    }
  }

  async uploadImages(productId: string, files: File[]): Promise<ProductImageInfo[]> {
    this._isUploading.set(true);
    try {
      const uploaded = await firstValueFrom(
        this.productService
          .uploadProductImages(productId, files)
          .pipe(takeUntilDestroyed(this.destroyRef)),
      );
      const newImages: ProductImageInfo[] = uploaded.map((u) => ({
        id: u.id,
        url: u.relativePath,
      }));
      this._product.update((current) => {
        if (!current) return current;
        const images = [...(current.images ?? []), ...newImages];
        const imageUrls = images.map((img) => img.url);
        return { ...current, images, imageUrls };
      });
      const next = this._product();
      if (next) this.catalog.upsertProduct(next);
      return newImages;
    } catch (error) {
      throw new Error(this.errors.translate(error));
    } finally {
      this._isUploading.set(false);
    }
  }

  async deleteImage(productId: string, imageId: string): Promise<void> {
    try {
      await firstValueFrom(
        this.productService
          .deleteProductImage(productId, imageId)
          .pipe(takeUntilDestroyed(this.destroyRef)),
      );
      this._product.update((current) => {
        if (!current) return current;
        const images = (current.images ?? []).filter((img) => img.id !== imageId);
        const imageUrls = images.map((img) => img.url);
        return { ...current, images, imageUrls };
      });
      const next = this._product();
      if (next) this.catalog.upsertProduct(next);
    } catch (error) {
      throw new Error(this.errors.translate(error));
    }
  }

  async deleteProduct(productId: string): Promise<void> {
    this._isDeleting.set(true);
    try {
      await firstValueFrom(
        this.productService.deleteProduct(productId).pipe(takeUntilDestroyed(this.destroyRef)),
      );
      this.catalog.removeProduct(productId);
    } catch (error) {
      throw new Error(this.errors.translate(error));
    } finally {
      this._isDeleting.set(false);
    }
  }

  setCachedProduct(product: ProductListItem): void {
    this._product.set(product);
    this.catalog.upsertProduct(product);
  }
}
