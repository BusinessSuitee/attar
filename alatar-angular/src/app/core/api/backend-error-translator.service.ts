import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

/**
 * Maps backend error codes (from `ProblemDetails.title` in Result<T> failures)
 * to translation keys. Codes that aren't in this map fall through to HTTP-status
 * translation. Free-form error messages (`{ message: "..." }` from controllers
 * that bypass Result<T>) are pattern-matched on a small allowlist before falling
 * back to the HTTP-status translation.
 */
const CODE_TO_KEY: Record<string, string> = {
  'Products.NotFound': 'common.errors.codes.products_not_found',
  'Products.SkuAlreadyExists': 'common.errors.codes.products_sku_already_exists',
  'Categories.NotFound': 'common.errors.codes.categories_not_found',
  'Categories.InvalidType': 'common.errors.codes.categories_invalid_type',
  'Categories.InvalidSeason': 'common.errors.codes.categories_invalid_season',
  'Categories.NameAlreadyExists': 'common.errors.codes.categories_name_already_exists',
};

/**
 * Free-form messages from controllers that don't use Result<T>. Matched
 * case-insensitively, longest-first, against the response's `message` field.
 */
const MESSAGE_PATTERNS: ReadonlyArray<{ pattern: RegExp; key: string }> = [
  { pattern: /at least one image is required/i, key: 'common.errors.codes.image_required' },
  { pattern: /no valid images were uploaded/i, key: 'common.errors.codes.no_valid_images' },
  { pattern: /image not found/i, key: 'common.errors.codes.image_not_found' },
  { pattern: /product not found/i, key: 'common.errors.codes.products_not_found' },
  { pattern: /email and password are required/i, key: 'common.errors.codes.auth_credentials_required' },
];

@Injectable({ providedIn: 'root' })
export class BackendErrorTranslator {
  private readonly transloco = inject(TranslocoService);

  /**
   * Resolve a localized error message for any error from the backend or HTTP layer.
   * Order of resolution:
   *   1. Map known `ProblemDetails.title` codes to specific translation keys.
   *   2. Match controller `message` strings against an allowlist of patterns.
   *   3. Fall back to a generic message based on HTTP status code.
   *   4. Last resort: a generic "unexpected" string.
   */
  translate(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return this.fromHttpResponse(error);
    }

    if (error instanceof Error) {
      return error.message || this.transloco.translate('common.errors.unexpected');
    }

    if (typeof error === 'string' && error.trim()) {
      return error.trim();
    }

    return this.transloco.translate('common.errors.unexpected');
  }

  private fromHttpResponse(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return this.transloco.translate('common.errors.network');
    }

    const body = error.error;

    // ProblemDetails shape: { title: "Products.NotFound", detail: "..." }
    if (body && typeof body === 'object') {
      const title = (body as { title?: unknown }).title;
      if (typeof title === 'string' && CODE_TO_KEY[title]) {
        return this.transloco.translate(CODE_TO_KEY[title]);
      }

      // Free-form: { message: "..." } from controllers
      const message = (body as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim()) {
        for (const { pattern, key } of MESSAGE_PATTERNS) {
          if (pattern.test(message)) {
            return this.transloco.translate(key);
          }
        }
      }

      // ProblemDetails detail (server-supplied English) is shown only as a last
      // resort if no code/pattern matched and status mapping returns a generic.
      // We prefer the code-based translation; falling through to status.
    }

    return this.fromStatus(error.status);
  }

  private fromStatus(status: number): string {
    switch (status) {
      case 400:
        return this.transloco.translate('common.errors.http.bad_request');
      case 401:
        return this.transloco.translate('common.errors.http.unauthorized');
      case 403:
        return this.transloco.translate('common.errors.http.forbidden');
      case 404:
        return this.transloco.translate('common.errors.http.not_found');
      case 409:
        return this.transloco.translate('common.errors.http.conflict');
      default:
        if (status >= 500) {
          return this.transloco.translate('common.errors.http.server_error');
        }
        return this.transloco.translate('common.errors.unexpected');
    }
  }
}
