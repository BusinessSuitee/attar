import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  PLATFORM_ID,
  ViewChild,
  effect,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import { PublicProductCard } from '../../products/public-catalog.store';

export interface SeasonCellSelection {
  product: PublicProductCard;
  monthIndex: number;
  anchorRect: DOMRect;
}

@Component({
  selector: 'app-season-cell-popover',
  standalone: true,
  imports: [RouterLink, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog
      #dialog
      class="popover"
      (close)="onDialogClose()"
      (click)="onBackdropClick($event)"
    >
      @if (cell) {
        <div class="popover__body" (click)="$event.stopPropagation()">
          <div class="popover__head">
            @if (cell.product.thumbnailUrl) {
              <img
                class="popover__thumb"
                [src]="resolveUrl(cell.product.thumbnailUrl)"
                [alt]="primaryName(cell.product)"
              />
            } @else {
              <div class="popover__thumb popover__thumb--empty" aria-hidden="true">
                <span class="material-symbols-outlined">image</span>
              </div>
            }
            <div class="popover__names">
              <p class="popover__name-primary">{{ primaryName(cell.product) }}</p>
              @if (secondaryName(cell.product); as secondary) {
                <p class="popover__name-secondary">{{ secondary }}</p>
              }
            </div>
            <button
              type="button"
              class="popover__close"
              [attr.aria-label]="'common.actions.cancel' | transloco"
              (click)="close()"
            >
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          <a
            class="popover__cta"
            [routerLink]="['/products', cell.product.id]"
            (click)="close()"
          >
            {{ 'products_v2.seasons.view_product' | transloco }}
          </a>
        </div>
      }
    </dialog>
  `,
  styles: [
    `
      :host {
        display: contents;
      }
      .popover {
        position: fixed;
        margin: 0;
        max-width: 92vw;
        width: 320px;
        padding: 0;
        border: 1px solid rgba(15, 23, 42, 0.08);
        border-radius: 1rem;
        box-shadow: 0 12px 32px rgba(15, 23, 42, 0.18);
        background: #ffffff;
      }
      .popover::backdrop {
        background-color: rgba(15, 23, 42, 0.32);
      }
      .popover__body {
        padding: 1rem;
      }
      .popover__head {
        display: flex;
        align-items: center;
        gap: 0.875rem;
        margin-bottom: 1rem;
      }
      .popover__thumb {
        width: 56px;
        height: 56px;
        border-radius: 0.625rem;
        object-fit: cover;
        background-color: #f1f5f9;
        flex-shrink: 0;
      }
      .popover__thumb--empty {
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(100, 116, 139, 0.5);
      }
      .popover__names {
        flex: 1 1 auto;
        min-width: 0;
      }
      .popover__name-primary {
        margin: 0;
        font-size: 0.9375rem;
        font-weight: 700;
        color: #0f172a;
      }
      .popover__name-secondary {
        margin: 0.125rem 0 0;
        font-size: 0.8125rem;
        color: rgba(15, 23, 42, 0.65);
      }
      .popover__close {
        flex-shrink: 0;
        width: 36px;
        height: 36px;
        background: transparent;
        border: none;
        border-radius: 9999px;
        color: rgba(15, 23, 42, 0.6);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .popover__close:hover {
        background-color: rgba(15, 23, 42, 0.06);
      }
      .popover__close:focus-visible {
        outline: 2px solid #0fbd66;
        outline-offset: 2px;
      }
      .popover__cta {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        min-height: 44px;
        padding: 0 1rem;
        background-color: #0fbd66;
        color: #ffffff;
        border-radius: 9999px;
        font-weight: 700;
        text-decoration: none;
      }
      .popover__cta:hover {
        background-color: #0a8f4d;
      }
      .popover__cta:focus-visible {
        outline: 2px solid #0fbd66;
        outline-offset: 2px;
      }
    `,
  ],
})
export class SeasonCellPopoverComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly transloco = inject(TranslocoService);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  @ViewChild('dialog', { static: true }) dialogRef!: ElementRef<HTMLDialogElement>;

  @Input() cell: SeasonCellSelection | null = null;
  @Output() readonly closed = new EventEmitter<void>();

  constructor() {
    effect(() => {
      const current = this.cell;
      if (!isPlatformBrowser(this.platformId)) return;
      const dialog = this.dialogRef?.nativeElement;
      if (!dialog) return;

      if (current) {
        if (typeof dialog.showModal === 'function' && !dialog.open) {
          dialog.showModal();
        }
        this.positionDialog(dialog, current.anchorRect);
      } else if (dialog.open) {
        dialog.close();
      }
    });
  }

  close(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.dialogRef?.nativeElement.close();
    }
    this.closed.emit();
  }

  onDialogClose(): void {
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === this.dialogRef?.nativeElement) {
      this.close();
    }
  }

  primaryName(product: PublicProductCard): string {
    return this.isArabic() ? product.nameAr || product.name : product.name || product.nameAr;
  }

  secondaryName(product: PublicProductCard): string | null {
    if (this.isArabic()) {
      return product.name && product.name !== product.nameAr ? product.name : null;
    }
    return product.nameAr && product.nameAr !== product.name ? product.nameAr : null;
  }

  resolveUrl(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${this.apiBaseUrl}/${url.replace(/^\//, '')}`;
  }

  private isArabic(): boolean {
    return (this.transloco.getActiveLang() || 'ar').toLowerCase().startsWith('ar');
  }

  private positionDialog(dialog: HTMLDialogElement, anchor: DOMRect): void {
    const margin = 8;
    const dialogRect = dialog.getBoundingClientRect();
    const viewportH = window.innerHeight;
    const viewportW = window.innerWidth;

    let top = anchor.bottom + margin;
    if (top + dialogRect.height > viewportH - margin) {
      top = Math.max(margin, anchor.top - dialogRect.height - margin);
    }

    let left = anchor.left;
    if (left + dialogRect.width > viewportW - margin) {
      left = Math.max(margin, viewportW - dialogRect.width - margin);
    }

    dialog.style.top = `${top}px`;
    dialog.style.left = `${left}px`;
    dialog.style.transform = 'none';
  }
}
