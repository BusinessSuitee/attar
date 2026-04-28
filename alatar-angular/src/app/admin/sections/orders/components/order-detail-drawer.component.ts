import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { RouterLink } from '@angular/router';
import {
  OrderRequestListItem,
  OrderRequestService,
  OrderRequestStatus,
} from '../../../../core/orders/order-request.service';
import {
  AdminStatusPillComponent,
  AdminStatusTone,
} from '../../../layout/admin-status-pill/admin-status-pill.component';
import { AdminConfirmDialogComponent } from '../../../shared/ui/confirm-dialog.component';
import { AdminOrdersStore } from '../orders.store';

const STATUS_SEQUENCE: OrderRequestStatus[] = [
  'new',
  'in_review',
  'contacted',
  'confirmed',
  'closed',
];

function statusTone(status: OrderRequestStatus): AdminStatusTone {
  switch (status) {
    case 'new':
      return 'danger';
    case 'in_review':
      return 'warning';
    case 'contacted':
      return 'info';
    case 'confirmed':
      return 'success';
    default:
      return 'neutral';
  }
}

function statusIcon(status: OrderRequestStatus): string {
  switch (status) {
    case 'new':
      return 'fiber_new';
    case 'in_review':
      return 'pending';
    case 'contacted':
      return 'call_made';
    case 'confirmed':
      return 'check_circle';
    default:
      return 'check';
  }
}

function formatAbsoluteDate(isoDate: string): string {
  return new Date(isoDate).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelativeDate(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

@Component({
  selector: 'app-order-detail-drawer',
  standalone: true,
  imports: [TranslocoPipe, RouterLink, AdminStatusPillComponent, AdminConfirmDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Side drawer via native <dialog> -->
    <dialog
      #drawerRef
      class="order-drawer"
      (click)="onBackdropClick($event)"
      (cancel)="onCancel($event)"
      (close)="closed.emit()"
    >
      @if (order) {
        <div class="order-drawer__inner" role="document">
          <!-- Header -->
          <div class="order-drawer__header">
            <admin-status-pill
              [label]="'admin.orders.status.' + currentStatus | transloco"
              [tone]="tone"
              [icon]="icon"
            ></admin-status-pill>
            <div class="order-drawer__header-actions">
              <button
                type="button"
                class="order-drawer__icon-btn order-drawer__icon-btn--danger"
                (click)="openDeleteConfirm()"
                [attr.aria-label]="'admin.orders.detail.delete' | transloco"
                [title]="'admin.orders.detail.delete' | transloco"
              >
                <span class="material-symbols-outlined">delete</span>
              </button>
              <button
                type="button"
                class="order-drawer__icon-btn"
                (click)="close()"
                [attr.aria-label]="'common.aria.dismiss' | transloco"
              >
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>

          <div class="order-drawer__body">
            <!-- Status workflow -->
            <section class="order-drawer__section">
              <h3 class="order-drawer__section-title">
                {{ 'admin.orders.detail.workflow_title' | transloco }}
              </h3>
              <div class="order-drawer__workflow">
                @for (s of statusSequence; track s) {
                  <button
                    type="button"
                    class="order-drawer__workflow-btn"
                    [class.is-current]="currentStatus === s"
                    [class.is-past]="isPastStatus(s)"
                    [disabled]="currentStatus === s"
                    (click)="changeStatus(s)"
                  >
                    <span class="material-symbols-outlined order-drawer__workflow-icon">{{
                      isPastStatus(s) ? 'undo' : getIcon(s)
                    }}</span>
                    <span>{{ 'admin.orders.status.' + s | transloco }}</span>
                  </button>
                }
              </div>
            </section>

            <!-- Customer -->
            <section class="order-drawer__section">
              <h3 class="order-drawer__section-title">
                {{ 'admin.orders.detail.customer_title' | transloco }}
              </h3>
              <div class="order-drawer__customer">
                <p class="order-drawer__customer-name">{{ order.requesterName }}</p>
                <div class="order-drawer__customer-phone-row">
                  <a
                    [href]="'tel:' + order.phoneNumber"
                    class="order-drawer__phone-link"
                    [attr.aria-label]="'admin.orders.detail.call_phone' | transloco"
                  >
                    <span class="material-symbols-outlined" style="font-size:1rem">call</span>
                    {{ order.phoneNumber }}
                  </a>
                  <button
                    type="button"
                    class="order-drawer__copy-btn"
                    (click)="copyPhone()"
                    [attr.aria-label]="'admin.orders.detail.copy_phone' | transloco"
                    [title]="'admin.orders.detail.copy_phone' | transloco"
                  >
                    <span class="material-symbols-outlined" style="font-size:0.9rem">{{
                      phoneCopied ? 'check' : 'content_copy'
                    }}</span>
                  </button>
                </div>
                @if (returningCount > 1) {
                  <button
                    type="button"
                    class="order-drawer__returning-line"
                    (click)="filterByPhone.emit(order.phoneNumber)"
                  >
                    <span class="material-symbols-outlined" style="font-size:0.875rem">repeat</span>
                    {{
                      'admin.orders.detail.returning_customer'
                        | transloco: { count: returningCount }
                    }}
                  </button>
                }
              </div>
            </section>

            <!-- Product -->
            <section class="order-drawer__section">
              <h3 class="order-drawer__section-title">
                {{ 'admin.orders.detail.product_title' | transloco }}
              </h3>
              <a
                [routerLink]="['/admin/products', order.productId, 'edit']"
                class="order-drawer__product-name order-drawer__product-link"
              >
                {{ order.productNameSnapshot }}
                <span
                  class="material-symbols-outlined"
                  style="font-size:1rem; vertical-align: middle;"
                  >open_in_new</span
                >
              </a>
            </section>

            <!-- Specifications -->
            <section class="order-drawer__section">
              <h3 class="order-drawer__section-title">
                {{ 'admin.orders.detail.specs_title' | transloco }}
              </h3>

              <!-- Quantity hero -->
              <div class="order-drawer__qty-hero">
                <span class="order-drawer__qty-number">{{ formatQty(order.quantityTons) }}</span>
                <span class="order-drawer__qty-unit">{{
                  'admin.orders.list.unit_tons' | transloco
                }}</span>
              </div>

              <!-- Selection chip groups -->
              @if (order.selectedVarieties.length) {
                <div class="order-drawer__spec-group">
                  <span class="order-drawer__spec-label">{{
                    'admin.orders.detail.spec_varieties' | transloco
                  }}</span>
                  <div class="order-drawer__chips">
                    @for (v of order.selectedVarieties; track v) {
                      <span class="order-drawer__chip">{{ v }}</span>
                    }
                  </div>
                </div>
              }
              @if (order.selectedPackagingOptions.length) {
                <div class="order-drawer__spec-group">
                  <span class="order-drawer__spec-label">{{
                    'admin.orders.detail.spec_packaging' | transloco
                  }}</span>
                  <div class="order-drawer__chips">
                    @for (v of order.selectedPackagingOptions; track v) {
                      <span class="order-drawer__chip">{{ v }}</span>
                    }
                  </div>
                </div>
              }
              @if (order.selectedWeightOptions.length) {
                <div class="order-drawer__spec-group">
                  <span class="order-drawer__spec-label">{{
                    'admin.orders.detail.spec_weight' | transloco
                  }}</span>
                  <div class="order-drawer__chips">
                    @for (v of order.selectedWeightOptions; track v) {
                      <span class="order-drawer__chip">{{ v }}</span>
                    }
                  </div>
                </div>
              }
              @if (order.selectedSizeOptions.length) {
                <div class="order-drawer__spec-group">
                  <span class="order-drawer__spec-label">{{
                    'admin.orders.detail.spec_size' | transloco
                  }}</span>
                  <div class="order-drawer__chips">
                    @for (v of order.selectedSizeOptions; track v) {
                      <span class="order-drawer__chip">{{ v }}</span>
                    }
                  </div>
                </div>
              }
              @if (order.selectedGradeOptions.length) {
                <div class="order-drawer__spec-group">
                  <span class="order-drawer__spec-label">{{
                    'admin.orders.detail.spec_grade' | transloco
                  }}</span>
                  <div class="order-drawer__chips">
                    @for (v of order.selectedGradeOptions; track v) {
                      <span class="order-drawer__chip">{{ v }}</span>
                    }
                  </div>
                </div>
              }
              @if (order.specialSpecification) {
                <div class="order-drawer__spec-group">
                  <span class="order-drawer__spec-label">{{
                    'admin.orders.detail.spec_special' | transloco
                  }}</span>
                  <p class="order-drawer__spec-note">{{ order.specialSpecification }}</p>
                </div>
              }
            </section>

            <!-- Metadata -->
            <section class="order-drawer__section order-drawer__section--meta">
              <span
                class="material-symbols-outlined"
                style="font-size:1rem;color:var(--color-text-secondary,#64748b)"
                >schedule</span
              >
              <span class="order-drawer__meta-text" [title]="absoluteDate"
                >{{ relativeDate }} · {{ absoluteDate }}</span
              >
            </section>
          </div>
        </div>
      }
    </dialog>

    <!-- Delete confirm dialog -->
    <admin-confirm-dialog
      [open]="showDeleteConfirm"
      [title]="'admin.orders.detail.delete_title' | transloco"
      [description]="'admin.orders.detail.delete_body' | transloco"
      [confirmLabel]="'admin.orders.detail.delete_confirm_action' | transloco"
      [cancelLabel]="'common.actions.cancel' | transloco"
      tone="danger"
      (confirm)="confirmDelete()"
      (cancel)="showDeleteConfirm = false"
    ></admin-confirm-dialog>
  `,
  styles: [
    `
      :host {
        display: contents;
      }

      /* ── Drawer dialog ─────────────────────── */
      .order-drawer {
        position: fixed;
        inset-block: 0;
        inset-inline-end: 0;
        inset-inline-start: auto;
        margin: 0;
        padding: 0;
        border: none;
        width: min(480px, 100vw);
        max-height: 100vh;
        height: 100vh;
        background: var(--color-surface-card, #ffffff);
        box-shadow: -4px 0 24px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        border-radius: 0;
        overflow: hidden;
      }
      .order-drawer:not([open]) {
        display: none;
      }
      .order-drawer::backdrop {
        background: rgba(15, 23, 42, 0.45);
      }
      /* Open animation (LTR slides from right) */
      .order-drawer[open] {
        animation: drawer-slide-in 0.22s ease-out;
      }
      .order-drawer[open]::backdrop {
        animation: drawer-backdrop-in 0.22s ease-out;
      }
      .order-drawer.is-closing {
        animation: drawer-slide-out 0.2s ease-in forwards;
      }
      .order-drawer.is-closing::backdrop {
        animation: drawer-backdrop-out 0.2s ease-in forwards;
      }
      @keyframes drawer-slide-in {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
      }
      @keyframes drawer-slide-out {
        from { transform: translateX(0); }
        to { transform: translateX(100%); }
      }
      @keyframes drawer-backdrop-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes drawer-backdrop-out {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      /* RTL: drawer is on the left visually, slide from left */
      :host-context([dir='rtl']) .order-drawer[open] {
        animation: drawer-slide-in-rtl 0.22s ease-out;
      }
      :host-context([dir='rtl']) .order-drawer.is-closing {
        animation: drawer-slide-out-rtl 0.2s ease-in forwards;
      }
      @keyframes drawer-slide-in-rtl {
        from { transform: translateX(-100%); }
        to { transform: translateX(0); }
      }
      @keyframes drawer-slide-out-rtl {
        from { transform: translateX(0); }
        to { transform: translateX(-100%); }
      }
      @media (max-width: 767px) {
        .order-drawer {
          inset: auto 0 0 0;
          width: 100vw;
          max-width: 100vw;
          height: auto;
          max-height: 92vh;
          border-radius: 1.25rem 1.25rem 0 0;
          box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.12);
          box-sizing: border-box;
          padding-bottom: env(safe-area-inset-bottom);
        }
        /* Mobile: bottom-sheet, slide up */
        .order-drawer[open],
        :host-context([dir='rtl']) .order-drawer[open] {
          animation: drawer-slide-up 0.22s ease-out;
        }
        .order-drawer.is-closing,
        :host-context([dir='rtl']) .order-drawer.is-closing {
          animation: drawer-slide-down 0.2s ease-in forwards;
        }
        @keyframes drawer-slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes drawer-slide-down {
          from { transform: translateY(0); }
          to { transform: translateY(100%); }
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .order-drawer[open],
        .order-drawer.is-closing,
        .order-drawer[open]::backdrop,
        .order-drawer.is-closing::backdrop {
          animation: none !important;
        }
      }

      .order-drawer__inner {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
      }

      /* ── Header ──────────────────────────────── */
      .order-drawer__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem 1.25rem;
        border-bottom: 1px solid var(--color-border, #e2e8f0);
        flex-shrink: 0;
        gap: 0.75rem;
      }
      .order-drawer__header-actions {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        margin-inline-start: auto;
      }
      .order-drawer__icon-btn {
        background: transparent;
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: 0.5rem;
        color: var(--color-text-secondary, #64748b);
        cursor: pointer;
        min-height: 44px;
        min-width: 44px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition:
          background 0.15s ease,
          color 0.15s ease;
      }
      .order-drawer__icon-btn:hover {
        background: var(--color-surface-subtle, #f1f5f9);
        color: var(--color-text-primary, #0f172a);
      }
      .order-drawer__icon-btn--danger:hover {
        background: #fee2e2;
        color: #b91c1c;
        border-color: #fecaca;
      }
      .order-drawer__icon-btn .material-symbols-outlined {
        font-size: 1.125rem;
      }

      /* ── Body ────────────────────────────────── */
      .order-drawer__body {
        overflow-y: auto;
        flex: 1;
        padding: 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        padding-bottom: max(1.25rem, env(safe-area-inset-bottom));
      }

      /* ── Section ─────────────────────────────── */
      .order-drawer__section {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding-bottom: 1.5rem;
        border-bottom: 1px solid var(--color-border, #e2e8f0);
      }
      .order-drawer__section:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }
      .order-drawer__section-title {
        margin: 0;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--color-text-secondary, #64748b);
      }

      /* ── Workflow ────────────────────────────── */
      .order-drawer__workflow {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .order-drawer__workflow-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.5rem 0.875rem;
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: 0.5rem;
        background: transparent;
        color: var(--color-text-primary, #0f172a);
        font-size: 0.8125rem;
        font-weight: 500;
        cursor: pointer;
        min-height: 44px;
        transition:
          background 0.15s ease,
          border-color 0.15s ease;
      }
      .order-drawer__workflow-btn:hover:not(:disabled):not(.is-current) {
        background: var(--color-surface-subtle, #f1f5f9);
        border-color: #0fbd66;
      }
      .order-drawer__workflow-btn.is-current {
        background: #0fbd66;
        border-color: #0fbd66;
        color: #ffffff;
        cursor: default;
        font-weight: 700;
      }
      .order-drawer__workflow-btn.is-past {
        color: var(--color-text-secondary, #64748b);
        border-style: dashed;
      }
      .order-drawer__workflow-btn:disabled:not(.is-current) {
        opacity: 0.5;
      }
      .order-drawer__workflow-icon {
        font-size: 1rem;
      }

      /* ── Customer ────────────────────────────── */
      .order-drawer__customer {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .order-drawer__customer-name {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 700;
        color: var(--color-text-primary, #0f172a);
      }
      .order-drawer__customer-phone-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .order-drawer__phone-link {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        color: #1d4ed8;
        font-size: 0.9375rem;
        font-weight: 600;
        text-decoration: none;
        min-height: 44px;
        padding: 0.5rem 0;
      }
      .order-drawer__phone-link:hover {
        text-decoration: underline;
      }
      .order-drawer__copy-btn {
        background: transparent;
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: 0.5rem;
        color: var(--color-text-secondary, #64748b);
        cursor: pointer;
        min-height: 36px;
        min-width: 36px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: background 0.15s ease;
      }
      .order-drawer__copy-btn:hover {
        background: var(--color-surface-subtle, #f1f5f9);
      }
      .order-drawer__returning-line {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        font-size: 0.8125rem;
        font-weight: 600;
        color: #1d4ed8;
        background: #dbeafe;
        border: none;
        border-radius: 0.5rem;
        padding: 0.375rem 0.75rem;
        cursor: pointer;
        min-height: 44px;
        text-align: start;
      }
      .order-drawer__returning-line:hover {
        background: #bfdbfe;
      }

      /* ── Product ─────────────────────────────── */
      .order-drawer__product-name {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--color-text-primary, #0f172a);
      }
      .order-drawer__product-link {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        color: #1d4ed8;
        text-decoration: none;
      }
      .order-drawer__product-link:hover {
        text-decoration: underline;
      }

      /* ── Quantity hero ────────────────────────── */
      .order-drawer__qty-hero {
        display: flex;
        align-items: baseline;
        gap: 0.5rem;
      }
      .order-drawer__qty-number {
        font-size: 2.25rem;
        font-weight: 800;
        line-height: 1;
        color: var(--color-text-primary, #0f172a);
        letter-spacing: -0.02em;
        font-variant-numeric: tabular-nums;
      }
      .order-drawer__qty-unit {
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--color-text-secondary, #64748b);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      /* ── Spec groups ─────────────────────────── */
      .order-drawer__spec-group {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
      }
      .order-drawer__spec-label {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--color-text-secondary, #64748b);
      }
      .order-drawer__chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.375rem;
      }
      .order-drawer__chip {
        display: inline-flex;
        padding: 0.25rem 0.625rem;
        border-radius: 9999px;
        font-size: 0.8125rem;
        font-weight: 500;
        background: var(--color-surface-subtle, #f1f5f9);
        color: var(--color-text-primary, #0f172a);
        border: 1px solid var(--color-border, #e2e8f0);
      }
      .order-drawer__spec-note {
        margin: 0;
        font-size: 0.875rem;
        line-height: 1.6;
        color: var(--color-text-primary, #0f172a);
        background: var(--color-surface-subtle, #f8fafc);
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: 0.5rem;
        padding: 0.75rem;
        white-space: pre-wrap;
      }

      /* ── Metadata ────────────────────────────── */
      .order-drawer__section--meta {
        flex-direction: row;
        align-items: center;
        gap: 0.5rem;
        padding-bottom: 0.75rem;
      }
      .order-drawer__meta-text {
        font-size: 0.8125rem;
        color: var(--color-text-secondary, #64748b);
      }
    `,
  ],
})
export class OrderDetailDrawerComponent implements OnChanges {
  @ViewChild('drawerRef', { static: true }) private drawerRef!: ElementRef<HTMLDialogElement>;

  @Input() order: OrderRequestListItem | null = null;
  @Input() open = false;
  @Input() customerRequestCounts: Map<string, number> = new Map();

  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly filterByPhone = new EventEmitter<string>();

  showDeleteConfirm = false;
  phoneCopied = false;

  readonly statusSequence = STATUS_SEQUENCE;

  private readonly store = inject(AdminOrdersStore);
  private readonly orderService = inject(OrderRequestService);

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['open']) return;
    const dialog = this.drawerRef?.nativeElement;
    if (!dialog) return;
    if (this.open && !dialog.open) {
      dialog.showModal();
    } else if (!this.open && dialog.open) {
      dialog.close();
    }
  }

  close(): void {
    const dialog = this.drawerRef.nativeElement;
    if (!dialog.open) return;
    // animate out, then close natively
    dialog.classList.add('is-closing');
    setTimeout(() => {
      dialog.classList.remove('is-closing');
      dialog.close();
    }, 200);
  }

  onCancel(_event: Event): void {
    // Let native ESC trigger close + (close) event naturally;
    // we don't preventDefault so the dialog actually closes.
  }

  onBackdropClick(event: MouseEvent): void {
    // Native <dialog> receives clicks on its own element only when the user
    // clicks the backdrop (outside the inner content).
    if (event.target === this.drawerRef.nativeElement) {
      this.close();
    }
  }

  get currentStatus(): OrderRequestStatus {
    return this.order ? this.orderService.normalizeStatus(this.order.status) : 'new';
  }

  get tone(): AdminStatusTone {
    return statusTone(this.currentStatus);
  }
  get icon(): string {
    return statusIcon(this.currentStatus);
  }

  get returningCount(): number {
    if (!this.order) return 0;
    return this.customerRequestCounts.get((this.order.phoneNumber ?? '').trim()) ?? 0;
  }

  get absoluteDate(): string {
    return this.order ? formatAbsoluteDate(this.order.createdAtUtc) : '';
  }
  get relativeDate(): string {
    return this.order ? formatRelativeDate(this.order.createdAtUtc) : '';
  }

  getIcon(status: OrderRequestStatus): string {
    return statusIcon(status);
  }

  isPastStatus(status: OrderRequestStatus): boolean {
    const currentIdx = STATUS_SEQUENCE.indexOf(this.currentStatus);
    const targetIdx = STATUS_SEQUENCE.indexOf(status);
    return targetIdx < currentIdx;
  }

  changeStatus(newStatus: OrderRequestStatus): void {
    if (!this.order || this.currentStatus === newStatus) return;
    this.store.updateStatus(this.order.id, newStatus);
  }

  openDeleteConfirm(): void {
    this.showDeleteConfirm = true;
  }

  confirmDelete(): void {
    if (!this.order) return;
    this.showDeleteConfirm = false;
    this.store.deleteOrder(this.order.id, () => this.close());
  }

  copyPhone(): void {
    if (!this.order) return;
    navigator.clipboard.writeText(this.order.phoneNumber).then(() => {
      this.phoneCopied = true;
      setTimeout(() => (this.phoneCopied = false), 2000);
    });
  }

  formatQty(qty: number): string {
    return Number.isInteger(qty) ? qty.toString() : qty.toFixed(2).replace(/\.?0+$/, '');
  }
}
