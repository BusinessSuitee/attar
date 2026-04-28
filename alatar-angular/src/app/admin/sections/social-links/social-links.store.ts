import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoService } from '@jsverse/transloco';

import {
  CreateSocialLinkPayload,
  SocialLinkDto,
  SocialLinkService,
  UpdateSocialLinkPayload,
} from '../../../core/social-links/social-link.service';
import { BackendErrorTranslator } from '../../../core/api/backend-error-translator.service';
import { ToastService } from '../../shared/toasts/toast.service';

@Injectable({ providedIn: 'root' })
export class AdminSocialLinksStore {
  private readonly socialLinkService = inject(SocialLinkService);
  private readonly toast = inject(ToastService);
  private readonly errors = inject(BackendErrorTranslator);
  private readonly transloco = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _items = signal<SocialLinkDto[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _hasLoaded = signal(false);
  private readonly _hasError = signal(false);
  private readonly _errorMessage = signal<string | null>(null);

  readonly items = this._items.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly hasError = this._hasError.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();
  readonly count = computed(() => this._items().length);

  ensureLoaded(): void {
    if (this._hasLoaded() || this._isLoading()) return;
    this.load();
  }

  reload(): void {
    if (this._isLoading()) return;
    this.load();
  }

  create(payload: CreateSocialLinkPayload, onSuccess?: () => void): void {
    this.socialLinkService
      .create(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success(this.transloco.translate('admin.social_links.toast.created'));
          this.load();
          onSuccess?.();
        },
        error: (error: unknown) => {
          this.toast.error(
            this.errors.translate(error) ||
              this.transloco.translate('admin.social_links.toast.create_failed'),
          );
        },
      });
  }

  update(id: string, payload: UpdateSocialLinkPayload, onSuccess?: () => void): void {
    this.socialLinkService
      .update(id, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success(this.transloco.translate('admin.social_links.toast.updated'));
          this.load();
          onSuccess?.();
        },
        error: (error: unknown) => {
          this.toast.error(
            this.errors.translate(error) ||
              this.transloco.translate('admin.social_links.toast.update_failed'),
          );
        },
      });
  }

  delete(id: string, onSuccess?: () => void): void {
    this.socialLinkService
      .delete(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this._items.update((items) => items.filter((i) => i.id !== id));
          this.toast.success(this.transloco.translate('admin.social_links.toast.deleted'));
          onSuccess?.();
        },
        error: () => {
          this.toast.error(this.transloco.translate('admin.social_links.toast.delete_failed'));
        },
      });
  }

  toggle(id: string, isEnabled: boolean): void {
    const previous = this._items().find((i) => i.id === id)?.isEnabled;
    if (previous === undefined) return;

    this._items.update((items) =>
      items.map((i) => (i.id === id ? { ...i, isEnabled } : i)),
    );

    this.socialLinkService
      .toggle(id, isEnabled)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: () => {
          this._items.update((items) =>
            items.map((i) => (i.id === id ? { ...i, isEnabled: previous } : i)),
          );
          this.toast.error(this.transloco.translate('admin.social_links.toast.toggle_failed'));
        },
      });
  }

  private load(): void {
    this._isLoading.set(true);
    this._hasError.set(false);
    this._errorMessage.set(null);

    this.socialLinkService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this._items.set(
            [...items].sort((a, b) => a.displayOrder - b.displayOrder),
          );
          this._hasLoaded.set(true);
          this._isLoading.set(false);
        },
        error: (error: unknown) => {
          this._hasError.set(true);
          this._errorMessage.set(this.errors.translate(error));
          this._isLoading.set(false);
        },
      });
  }
}
