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
import {
  ContactListItem,
  ContactService,
  ContactStatus,
} from '../../../../core/contacts/contact.service';
import {
  AdminStatusPillComponent,
  AdminStatusTone,
} from '../../../layout/admin-status-pill/admin-status-pill.component';
import { AdminConfirmDialogComponent } from '../../../shared/ui/confirm-dialog.component';
import { AdminContactsStore, isExportContact } from '../contacts.store';

const STATUS_SEQUENCE: ContactStatus[] = ['in_progress', 'contacted', 'sale_confirmed'];

function statusTone(status: ContactStatus): AdminStatusTone {
  switch (status) {
    case 'in_progress':
      return 'warning';
    case 'contacted':
      return 'info';
    case 'sale_confirmed':
      return 'success';
    default:
      return 'neutral';
  }
}

function statusIcon(status: ContactStatus): string {
  switch (status) {
    case 'in_progress':
      return 'pending';
    case 'contacted':
      return 'call_made';
    case 'sale_confirmed':
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
  selector: 'app-contact-detail-drawer',
  standalone: true,
  imports: [TranslocoPipe, AdminStatusPillComponent, AdminConfirmDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog
      #drawerRef
      class="contact-drawer"
      (click)="onBackdropClick($event)"
      (cancel)="onCancel($event)"
      (close)="closed.emit()"
    >
      @if (contact) {
        <div class="contact-drawer__inner" role="document">
          <!-- Header -->
          <div class="contact-drawer__header">
            <admin-status-pill
              [label]="'admin.contacts.status.' + currentStatus | transloco"
              [tone]="tone"
              [icon]="icon"
            ></admin-status-pill>
            <div class="contact-drawer__header-actions">
              <button
                type="button"
                class="contact-drawer__icon-btn contact-drawer__icon-btn--danger"
                (click)="openDeleteConfirm()"
                [attr.aria-label]="'admin.contacts.detail.delete' | transloco"
                [title]="'admin.contacts.detail.delete' | transloco"
              >
                <span class="material-symbols-outlined">delete</span>
              </button>
              <button
                type="button"
                class="contact-drawer__icon-btn"
                (click)="close()"
                [attr.aria-label]="'common.aria.dismiss' | transloco"
              >
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>

          <div class="contact-drawer__body">
            <!-- Status workflow -->
            <section class="contact-drawer__section">
              <h3 class="contact-drawer__section-title">
                {{ 'admin.contacts.detail.workflow_title' | transloco }}
              </h3>
              <div class="contact-drawer__workflow">
                @for (s of statusSequence; track s) {
                  <button
                    type="button"
                    class="contact-drawer__workflow-btn"
                    [class.is-current]="currentStatus === s"
                    [class.is-past]="isPastStatus(s)"
                    [disabled]="currentStatus === s"
                    (click)="changeStatus(s)"
                  >
                    <span class="material-symbols-outlined contact-drawer__workflow-icon">{{
                      isPastStatus(s) ? 'undo' : getIcon(s)
                    }}</span>
                    <span>{{ 'admin.contacts.status.' + s | transloco }}</span>
                  </button>
                }
              </div>
            </section>

            <!-- Customer -->
            <section class="contact-drawer__section">
              <h3 class="contact-drawer__section-title">
                {{ 'admin.contacts.detail.customer_title' | transloco }}
              </h3>
              <div class="contact-drawer__customer">
                <p class="contact-drawer__customer-name">{{ contact.fullName }}</p>
                <div class="contact-drawer__customer-phone-row">
                  <a
                    [href]="'tel:' + contact.phoneNumber"
                    class="contact-drawer__phone-link"
                    [attr.aria-label]="'admin.contacts.detail.call_phone' | transloco"
                  >
                    <span class="material-symbols-outlined" style="font-size:1rem">call</span>
                    {{ contact.phoneNumber }}
                  </a>
                  <a
                    [href]="whatsappLink"
                    target="_blank"
                    rel="noopener"
                    class="contact-drawer__wa-link"
                    [attr.aria-label]="'admin.contacts.detail.whatsapp' | transloco"
                    [title]="'admin.contacts.detail.whatsapp' | transloco"
                  >
                    <span class="material-symbols-outlined" style="font-size:0.95rem">chat</span>
                    WhatsApp
                  </a>
                  <button
                    type="button"
                    class="contact-drawer__copy-btn"
                    (click)="copyPhone()"
                    [attr.aria-label]="'admin.contacts.detail.copy_phone' | transloco"
                    [title]="'admin.contacts.detail.copy_phone' | transloco"
                  >
                    <span class="material-symbols-outlined" style="font-size:0.9rem">{{
                      phoneCopied ? 'check' : 'content_copy'
                    }}</span>
                  </button>
                </div>
                @if (returningCount > 1) {
                  <button
                    type="button"
                    class="contact-drawer__returning-line"
                    (click)="filterByPhone.emit(contact.phoneNumber)"
                  >
                    <span class="material-symbols-outlined" style="font-size:0.875rem">repeat</span>
                    {{
                      'admin.contacts.detail.returning_customer'
                        | transloco: { count: returningCount }
                    }}
                  </button>
                }
              </div>
            </section>

            <!-- Service type & request summary -->
            <section class="contact-drawer__section">
              <h3 class="contact-drawer__section-title">
                {{ 'admin.contacts.detail.request_title' | transloco }}
              </h3>

              <div class="contact-drawer__service-row">
                <span
                  class="contact-drawer__service"
                  [attr.data-type]="serviceTypeKey"
                >
                  <span class="material-symbols-outlined" style="font-size:1rem">
                    {{ isExport ? 'public' : 'storefront' }}
                  </span>
                  {{ 'admin.contacts.service_type.' + serviceTypeKey | transloco }}
                </span>
              </div>

              @if (contact.quantityTons) {
                <div class="contact-drawer__qty-hero">
                  <span class="contact-drawer__qty-number">{{ formatQty(contact.quantityTons) }}</span>
                  <span class="contact-drawer__qty-unit">{{
                    'admin.contacts.list.unit_tons' | transloco
                  }}</span>
                </div>
              }

              <div class="contact-drawer__field-grid">
                @if (contact.companyName) {
                  <div class="contact-drawer__field">
                    <span class="contact-drawer__field-label">{{
                      'admin.contacts.detail.field_company' | transloco
                    }}</span>
                    <span class="contact-drawer__field-value">{{ contact.companyName }}</span>
                  </div>
                }
                @if (contact.country) {
                  <div class="contact-drawer__field">
                    <span class="contact-drawer__field-label">{{
                      'admin.contacts.detail.field_country' | transloco
                    }}</span>
                    <span class="contact-drawer__field-value">{{ contact.country }}</span>
                  </div>
                }
                @if (contact.crop) {
                  <div class="contact-drawer__field">
                    <span class="contact-drawer__field-label">{{
                      'admin.contacts.detail.field_crop' | transloco
                    }}</span>
                    <span class="contact-drawer__field-value">{{ contact.crop }}</span>
                  </div>
                }
                @if (contact.deliveryWindow) {
                  <div class="contact-drawer__field">
                    <span class="contact-drawer__field-label">{{
                      'admin.contacts.detail.field_delivery' | transloco
                    }}</span>
                    <span class="contact-drawer__field-value">{{ contact.deliveryWindow }}</span>
                  </div>
                }
              </div>

              @if (contact.notes) {
                <div class="contact-drawer__field-block">
                  <span class="contact-drawer__field-label">{{
                    'admin.contacts.detail.field_notes' | transloco
                  }}</span>
                  <p class="contact-drawer__notes">{{ contact.notes }}</p>
                </div>
              }
            </section>

            <!-- Metadata -->
            <section class="contact-drawer__section contact-drawer__section--meta">
              <span
                class="material-symbols-outlined"
                style="font-size:1rem;color:var(--color-text-secondary,#64748b)"
                >schedule</span
              >
              <span class="contact-drawer__meta-text" [title]="absoluteDate"
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
      [title]="'admin.contacts.detail.delete_title' | transloco"
      [description]="'admin.contacts.detail.delete_body' | transloco"
      [confirmLabel]="'admin.contacts.detail.delete_confirm_action' | transloco"
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

      .contact-drawer {
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
      .contact-drawer:not([open]) {
        display: none;
      }
      .contact-drawer::backdrop {
        background: rgba(15, 23, 42, 0.45);
      }
      .contact-drawer[open] {
        animation: contact-drawer-slide-in 0.22s ease-out;
      }
      .contact-drawer[open]::backdrop {
        animation: contact-drawer-backdrop-in 0.22s ease-out;
      }
      .contact-drawer.is-closing {
        animation: contact-drawer-slide-out 0.2s ease-in forwards;
      }
      .contact-drawer.is-closing::backdrop {
        animation: contact-drawer-backdrop-out 0.2s ease-in forwards;
      }
      @keyframes contact-drawer-slide-in {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
      }
      @keyframes contact-drawer-slide-out {
        from { transform: translateX(0); }
        to { transform: translateX(100%); }
      }
      @keyframes contact-drawer-backdrop-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes contact-drawer-backdrop-out {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      :host-context([dir='rtl']) .contact-drawer[open] {
        animation: contact-drawer-slide-in-rtl 0.22s ease-out;
      }
      :host-context([dir='rtl']) .contact-drawer.is-closing {
        animation: contact-drawer-slide-out-rtl 0.2s ease-in forwards;
      }
      @keyframes contact-drawer-slide-in-rtl {
        from { transform: translateX(-100%); }
        to { transform: translateX(0); }
      }
      @keyframes contact-drawer-slide-out-rtl {
        from { transform: translateX(0); }
        to { transform: translateX(-100%); }
      }
      @media (max-width: 767px) {
        .contact-drawer {
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
        .contact-drawer[open],
        :host-context([dir='rtl']) .contact-drawer[open] {
          animation: contact-drawer-slide-up 0.22s ease-out;
        }
        .contact-drawer.is-closing,
        :host-context([dir='rtl']) .contact-drawer.is-closing {
          animation: contact-drawer-slide-down 0.2s ease-in forwards;
        }
        @keyframes contact-drawer-slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes contact-drawer-slide-down {
          from { transform: translateY(0); }
          to { transform: translateY(100%); }
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .contact-drawer[open],
        .contact-drawer.is-closing,
        .contact-drawer[open]::backdrop,
        .contact-drawer.is-closing::backdrop {
          animation: none !important;
        }
      }

      .contact-drawer__inner {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
      }

      .contact-drawer__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem 1.25rem;
        border-bottom: 1px solid var(--color-border, #e2e8f0);
        flex-shrink: 0;
        gap: 0.75rem;
      }
      .contact-drawer__header-actions {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        margin-inline-start: auto;
      }
      .contact-drawer__icon-btn {
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
      .contact-drawer__icon-btn:hover {
        background: var(--color-surface-subtle, #f1f5f9);
        color: var(--color-text-primary, #0f172a);
      }
      .contact-drawer__icon-btn--danger:hover {
        background: #fee2e2;
        color: #b91c1c;
        border-color: #fecaca;
      }
      .contact-drawer__icon-btn .material-symbols-outlined {
        font-size: 1.125rem;
      }

      .contact-drawer__body {
        overflow-y: auto;
        flex: 1;
        padding: 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        padding-bottom: max(1.25rem, env(safe-area-inset-bottom));
      }

      .contact-drawer__section {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding-bottom: 1.5rem;
        border-bottom: 1px solid var(--color-border, #e2e8f0);
      }
      .contact-drawer__section:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }
      .contact-drawer__section-title {
        margin: 0;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--color-text-secondary, #64748b);
      }

      .contact-drawer__workflow {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .contact-drawer__workflow-btn {
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
      .contact-drawer__workflow-btn:hover:not(:disabled):not(.is-current) {
        background: var(--color-surface-subtle, #f1f5f9);
        border-color: #0fbd66;
      }
      .contact-drawer__workflow-btn.is-current {
        background: #0fbd66;
        border-color: #0fbd66;
        color: #ffffff;
        cursor: default;
        font-weight: 700;
      }
      .contact-drawer__workflow-btn.is-past {
        color: var(--color-text-secondary, #64748b);
        border-style: dashed;
      }
      .contact-drawer__workflow-btn:disabled:not(.is-current) {
        opacity: 0.5;
      }
      .contact-drawer__workflow-icon {
        font-size: 1rem;
      }

      .contact-drawer__customer {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .contact-drawer__customer-name {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 700;
        color: var(--color-text-primary, #0f172a);
      }
      .contact-drawer__customer-phone-row {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .contact-drawer__phone-link {
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
      .contact-drawer__phone-link:hover {
        text-decoration: underline;
      }
      .contact-drawer__wa-link {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        color: #166534;
        background: #dcfce7;
        border: 1px solid #bbf7d0;
        font-size: 0.8125rem;
        font-weight: 600;
        text-decoration: none;
        padding: 0.375rem 0.625rem;
        border-radius: 0.5rem;
        min-height: 36px;
      }
      .contact-drawer__wa-link:hover {
        background: #bbf7d0;
      }
      .contact-drawer__copy-btn {
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
      .contact-drawer__copy-btn:hover {
        background: var(--color-surface-subtle, #f1f5f9);
      }
      .contact-drawer__returning-line {
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
      .contact-drawer__returning-line:hover {
        background: #bfdbfe;
      }

      .contact-drawer__service-row {
        display: flex;
      }
      .contact-drawer__service {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.375rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.8125rem;
        font-weight: 600;
        background: var(--color-surface-subtle, #f1f5f9);
        color: var(--color-text-primary, #0f172a);
        border: 1px solid var(--color-border, #e2e8f0);
      }
      .contact-drawer__service[data-type='export'] {
        background: #fef3c7;
        color: #b45309;
        border-color: #fde68a;
      }
      .contact-drawer__service[data-type='local'] {
        background: #e0e7ff;
        color: #3730a3;
        border-color: #c7d2fe;
      }

      .contact-drawer__qty-hero {
        display: flex;
        align-items: baseline;
        gap: 0.5rem;
      }
      .contact-drawer__qty-number {
        font-size: 2.25rem;
        font-weight: 800;
        line-height: 1;
        color: var(--color-text-primary, #0f172a);
        letter-spacing: -0.02em;
        font-variant-numeric: tabular-nums;
      }
      .contact-drawer__qty-unit {
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--color-text-secondary, #64748b);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .contact-drawer__field-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 0.75rem 1rem;
      }
      .contact-drawer__field {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .contact-drawer__field-block {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
      }
      .contact-drawer__field-label {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--color-text-secondary, #64748b);
      }
      .contact-drawer__field-value {
        font-size: 0.875rem;
        color: var(--color-text-primary, #0f172a);
        font-weight: 500;
      }
      .contact-drawer__notes {
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

      .contact-drawer__section--meta {
        flex-direction: row;
        align-items: center;
        gap: 0.5rem;
        padding-bottom: 0.75rem;
      }
      .contact-drawer__meta-text {
        font-size: 0.8125rem;
        color: var(--color-text-secondary, #64748b);
      }
    `,
  ],
})
export class ContactDetailDrawerComponent implements OnChanges {
  @ViewChild('drawerRef', { static: true }) private drawerRef!: ElementRef<HTMLDialogElement>;

  @Input() contact: ContactListItem | null = null;
  @Input() open = false;
  @Input() customerRequestCounts: Map<string, number> = new Map();

  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly filterByPhone = new EventEmitter<string>();

  showDeleteConfirm = false;
  phoneCopied = false;

  readonly statusSequence = STATUS_SEQUENCE;

  private readonly store = inject(AdminContactsStore);
  private readonly contactService = inject(ContactService);

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
    dialog.classList.add('is-closing');
    setTimeout(() => {
      dialog.classList.remove('is-closing');
      dialog.close();
    }, 200);
  }

  onCancel(_event: Event): void {
    // let native ESC close + (close) trigger naturally
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === this.drawerRef.nativeElement) {
      this.close();
    }
  }

  get currentStatus(): ContactStatus {
    return this.contact ? this.contactService.normalizeStatus(this.contact.status) : 'in_progress';
  }

  get tone(): AdminStatusTone {
    return statusTone(this.currentStatus);
  }
  get icon(): string {
    return statusIcon(this.currentStatus);
  }

  get isExport(): boolean {
    return this.contact ? isExportContact(this.contact) : false;
  }
  get serviceTypeKey(): 'export' | 'local' {
    return this.isExport ? 'export' : 'local';
  }

  get returningCount(): number {
    if (!this.contact) return 0;
    return this.customerRequestCounts.get((this.contact.phoneNumber ?? '').trim()) ?? 0;
  }

  get absoluteDate(): string {
    return this.contact ? formatAbsoluteDate(this.contact.createdAtUtc) : '';
  }
  get relativeDate(): string {
    return this.contact ? formatRelativeDate(this.contact.createdAtUtc) : '';
  }

  get whatsappLink(): string {
    if (!this.contact) return '#';
    const digits = (this.contact.phoneNumber ?? '').replace(/[^0-9]/g, '');
    return `https://wa.me/${digits}`;
  }

  getIcon(status: ContactStatus): string {
    return statusIcon(status);
  }

  isPastStatus(status: ContactStatus): boolean {
    const currentIdx = STATUS_SEQUENCE.indexOf(this.currentStatus);
    const targetIdx = STATUS_SEQUENCE.indexOf(status);
    return targetIdx < currentIdx;
  }

  changeStatus(newStatus: ContactStatus): void {
    if (!this.contact || this.currentStatus === newStatus) return;
    this.store.updateStatus(this.contact.id, newStatus);
  }

  openDeleteConfirm(): void {
    this.showDeleteConfirm = true;
  }

  confirmDelete(): void {
    if (!this.contact) return;
    this.showDeleteConfirm = false;
    this.store.deleteContact(this.contact.id, () => this.close());
  }

  copyPhone(): void {
    if (!this.contact) return;
    navigator.clipboard.writeText(this.contact.phoneNumber).then(() => {
      this.phoneCopied = true;
      setTimeout(() => (this.phoneCopied = false), 2000);
    });
  }

  formatQty(qty: number | null): string {
    if (qty === null || qty === undefined) return '';
    return Number.isInteger(qty) ? qty.toString() : qty.toFixed(2).replace(/\.?0+$/, '');
  }
}
