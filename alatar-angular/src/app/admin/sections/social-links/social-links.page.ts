import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { AdminPageComponent } from '../../layout/admin-page/admin-page.component';
import { AdminPageHeaderComponent } from '../../layout/admin-page-header/admin-page-header.component';
import { AdminSectionCardComponent } from '../../layout/admin-section-card/admin-section-card.component';
import { AdminConfirmDialogComponent } from '../../shared/ui/confirm-dialog.component';

import {
  CreateSocialLinkPayload,
  SocialLinkDto,
  SocialPlatform,
} from '../../../core/social-links/social-link.service';
import { AdminSocialLinksStore } from './social-links.store';

interface FormState {
  platform: SocialPlatform;
  url: string;
  label: string;
  iconKey: string;
  colorHex: string;
  opensInNewTab: boolean;
}

const DEFAULT_FORM: FormState = {
  platform: 'Facebook',
  url: '',
  label: '',
  iconKey: '',
  colorHex: '',
  opensInNewTab: true,
};

const PLATFORMS: SocialPlatform[] = [
  'Facebook',
  'WhatsApp',
  'LinkedIn',
  'Instagram',
  'YouTube',
  'X',
  'TikTok',
  'Telegram',
  'Snapchat',
  'Pinterest',
  'Threads',
  'Reddit',
  'Discord',
  'Skype',
  'Viber',
  'WeChat',
  'Line',
  'Messenger',
  'Email',
  'Phone',
  'Website',
  'Location',
  'Custom',
];

@Component({
  selector: 'app-admin-social-links-page',
  standalone: true,
  imports: [
    FormsModule,
    TranslocoPipe,
    AdminPageComponent,
    AdminPageHeaderComponent,
    AdminSectionCardComponent,
    AdminConfirmDialogComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <admin-page>
      <admin-page-header
        [title]="'admin.social_links.title' | transloco"
        [subtitle]="'admin.social_links.subtitle' | transloco"
      >
        <button
          slot="actions"
          type="button"
          class="social-links__add-btn"
          (click)="openCreate()"
        >
          <span class="material-symbols-outlined">add</span>
          {{ 'admin.social_links.add' | transloco }}
        </button>
      </admin-page-header>

      <admin-section-card>
        @if (store.isLoading() && store.count() === 0) {
          <div class="social-links__skeleton">
            @for (i of [0, 1, 2]; track i) {
              <div class="social-links__skeleton-row"></div>
            }
          </div>
        } @else if (store.hasError()) {
          <div class="social-links__error">
            <span>{{ store.errorMessage() }}</span>
            <button type="button" class="social-links__retry-btn" (click)="store.reload()">
              {{ 'common.retry' | transloco }}
            </button>
          </div>
        } @else if (store.count() === 0) {
          <div class="social-links__empty">
            <span class="material-symbols-outlined" style="font-size:2.5rem;color:var(--color-text-tertiary,#94a3b8)">share</span>
            <p>{{ 'admin.social_links.empty' | transloco }}</p>
            <button type="button" class="social-links__add-btn" (click)="openCreate()">
              <span class="material-symbols-outlined">add</span>
              {{ 'admin.social_links.add' | transloco }}
            </button>
          </div>
        } @else {
          <div class="social-links__list">
            @for (link of store.items(); track link.id) {
              <article class="social-links__row">
                <div
                  class="social-links__icon"
                  [style.background]="link.colorHex || 'var(--color-surface-subtle, #f1f5f9)'"
                  [style.color]="link.colorHex ? '#fff' : 'var(--color-text-secondary, #64748b)'"
                >
                  <span class="material-symbols-outlined">{{ platformIcon(link.platform) }}</span>
                </div>

                <div class="social-links__main">
                  <div class="social-links__top">
                    <span class="social-links__label">{{ link.label || link.platform }}</span>
                    <span class="social-links__platform-tag">{{ link.platform }}</span>
                  </div>
                  <a
                    class="social-links__url"
                    [href]="link.url"
                    target="_blank"
                    rel="noopener"
                    [title]="link.url"
                  >
                    {{ link.url }}
                  </a>
                </div>

                <div class="social-links__actions">
                  <label class="social-links__toggle" [title]="'admin.social_links.enabled' | transloco">
                    <input
                      type="checkbox"
                      [checked]="link.isEnabled"
                      (change)="onToggle(link, $any($event.target).checked)"
                    />
                    <span class="social-links__toggle-track">
                      <span class="social-links__toggle-thumb"></span>
                    </span>
                  </label>

                  <button
                    type="button"
                    class="social-links__icon-btn"
                    (click)="openEdit(link)"
                    [attr.aria-label]="'admin.social_links.edit' | transloco"
                    [title]="'admin.social_links.edit' | transloco"
                  >
                    <span class="material-symbols-outlined">edit</span>
                  </button>

                  <button
                    type="button"
                    class="social-links__icon-btn social-links__icon-btn--danger"
                    (click)="askDelete(link)"
                    [attr.aria-label]="'admin.social_links.delete' | transloco"
                    [title]="'admin.social_links.delete' | transloco"
                  >
                    <span class="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </article>
            }
          </div>
        }
      </admin-section-card>
    </admin-page>

    <!-- Add / Edit dialog -->
    <admin-confirm-dialog
      [open]="showFormDialog()"
      [title]="
        editingId()
          ? ('admin.social_links.edit_title' | transloco)
          : ('admin.social_links.create_title' | transloco)
      "
      [confirmLabel]="
        editingId()
          ? ('admin.social_links.save' | transloco)
          : ('admin.social_links.create' | transloco)
      "
      [cancelLabel]="'common.actions.cancel' | transloco"
      [confirmDisabled]="!isFormValid()"
      tone="neutral"
      (confirm)="submit()"
      (cancel)="closeForm()"
    >
      <form class="social-links__form" (submit)="$event.preventDefault()">
        <label class="social-links__field">
          <span class="social-links__field-label">{{
            'admin.social_links.field_platform' | transloco
          }}</span>
          <select
            class="social-links__input"
            [ngModel]="form().platform"
            (ngModelChange)="updateForm({ platform: $event })"
            name="platform"
          >
            @for (p of platforms; track p) {
              <option [value]="p">{{ p }}</option>
            }
          </select>
        </label>

        <label class="social-links__field">
          <span class="social-links__field-label">{{
            'admin.social_links.field_label' | transloco
          }}</span>
          <input
            class="social-links__input"
            type="text"
            [ngModel]="form().label"
            (ngModelChange)="updateForm({ label: $event })"
            [placeholder]="'admin.social_links.field_label_placeholder' | transloco"
            name="label"
            maxlength="120"
          />
        </label>

        <label class="social-links__field">
          <span class="social-links__field-label">{{
            'admin.social_links.field_url' | transloco
          }}</span>
          <input
            class="social-links__input"
            type="url"
            [ngModel]="form().url"
            (ngModelChange)="updateForm({ url: $event })"
            placeholder="https://…"
            name="url"
            required
          />
        </label>

        <label class="social-links__field">
          <span class="social-links__field-label">{{
            'admin.social_links.field_color' | transloco
          }}</span>
          <div class="social-links__color-row">
            <input
              type="color"
              class="social-links__color-picker"
              [ngModel]="form().colorHex || '#0fbd66'"
              (ngModelChange)="updateForm({ colorHex: $event })"
              name="colorHex"
            />
            <input
              type="text"
              class="social-links__input"
              [ngModel]="form().colorHex"
              (ngModelChange)="updateForm({ colorHex: $event })"
              placeholder="#0fbd66"
              name="colorHexText"
              maxlength="9"
            />
          </div>
        </label>

        <label class="social-links__checkbox">
          <input
            type="checkbox"
            [ngModel]="form().opensInNewTab"
            (ngModelChange)="updateForm({ opensInNewTab: $event })"
            name="opensInNewTab"
          />
          <span>{{ 'admin.social_links.field_new_tab' | transloco }}</span>
        </label>
      </form>
    </admin-confirm-dialog>

    <!-- Delete confirm dialog -->
    <admin-confirm-dialog
      [open]="showDeleteConfirm()"
      [title]="'admin.social_links.delete_title' | transloco"
      [description]="'admin.social_links.delete_body' | transloco"
      [confirmLabel]="'admin.social_links.delete' | transloco"
      [cancelLabel]="'common.actions.cancel' | transloco"
      tone="danger"
      (confirm)="confirmDelete()"
      (cancel)="cancelDelete()"
    ></admin-confirm-dialog>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      /* ── Header action ─────────────────────── */
      .social-links__add-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        background: #0fbd66;
        color: #ffffff;
        border: none;
        border-radius: 0.625rem;
        padding: 0 1rem;
        height: 44px;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.15s ease;
      }
      .social-links__add-btn:hover {
        background: #0a8a4a;
      }
      .social-links__add-btn .material-symbols-outlined {
        font-size: 1.125rem;
      }

      /* ── List ──────────────────────────────── */
      .social-links__list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .social-links__row {
        display: flex;
        align-items: center;
        gap: 0.875rem;
        padding: 0.75rem 1rem;
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: 0.75rem;
        background: var(--color-surface-card, #ffffff);
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
      }
      .social-links__row:hover {
        border-color: #cbd5e1;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      }

      .social-links__icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        border-radius: 0.625rem;
        flex-shrink: 0;
      }
      .social-links__icon .material-symbols-outlined {
        font-size: 1.5rem;
      }

      .social-links__main {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }
      .social-links__top {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .social-links__label {
        font-size: 0.9375rem;
        font-weight: 600;
        color: var(--color-text-primary, #0f172a);
      }
      .social-links__platform-tag {
        font-size: 0.6875rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--color-text-secondary, #64748b);
        background: var(--color-surface-subtle, #f1f5f9);
        padding: 0.125rem 0.5rem;
        border-radius: 9999px;
      }
      .social-links__url {
        font-size: 0.8125rem;
        color: #1d4ed8;
        text-decoration: none;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        display: block;
      }
      .social-links__url:hover {
        text-decoration: underline;
      }

      .social-links__actions {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        flex-shrink: 0;
      }

      /* ── Toggle switch ─────────────────────── */
      .social-links__toggle {
        position: relative;
        display: inline-flex;
        align-items: center;
        cursor: pointer;
        margin-inline-end: 0.25rem;
      }
      .social-links__toggle input {
        position: absolute;
        opacity: 0;
        width: 0;
        height: 0;
      }
      .social-links__toggle-track {
        position: relative;
        display: inline-block;
        width: 36px;
        height: 20px;
        border-radius: 9999px;
        background: #cbd5e1;
        transition: background 0.15s ease;
      }
      .social-links__toggle-thumb {
        position: absolute;
        top: 2px;
        inset-inline-start: 2px;
        width: 16px;
        height: 16px;
        border-radius: 9999px;
        background: #ffffff;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        transition: transform 0.15s ease;
      }
      .social-links__toggle input:checked + .social-links__toggle-track {
        background: #0fbd66;
      }
      .social-links__toggle input:checked + .social-links__toggle-track .social-links__toggle-thumb {
        transform: translateX(16px);
      }
      :host-context([dir='rtl']) .social-links__toggle input:checked + .social-links__toggle-track .social-links__toggle-thumb {
        transform: translateX(-16px);
      }

      .social-links__icon-btn {
        background: transparent;
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: 0.5rem;
        color: var(--color-text-secondary, #64748b);
        cursor: pointer;
        min-height: 40px;
        min-width: 40px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: background 0.15s ease, color 0.15s ease;
      }
      .social-links__icon-btn:hover {
        background: var(--color-surface-subtle, #f1f5f9);
        color: var(--color-text-primary, #0f172a);
      }
      .social-links__icon-btn--danger:hover {
        background: #fee2e2;
        color: #b91c1c;
        border-color: #fecaca;
      }
      .social-links__icon-btn .material-symbols-outlined {
        font-size: 1.125rem;
      }

      /* ── Empty / loading / error ─────────── */
      .social-links__empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.875rem;
        padding: 3rem 1.5rem;
        text-align: center;
        color: var(--color-text-secondary, #64748b);
      }
      .social-links__empty p {
        margin: 0;
        font-size: 0.9375rem;
      }
      .social-links__skeleton {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .social-links__skeleton-row {
        height: 4rem;
        border-radius: 0.75rem;
        background: var(--color-surface-subtle, #f1f5f9);
      }
      @media (prefers-reduced-motion: no-preference) {
        .social-links__skeleton-row {
          animation: social-links-pulse 1.5s ease-in-out infinite;
        }
      }
      @keyframes social-links-pulse {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }
      .social-links__error {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 1rem 1.5rem;
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 0.75rem;
        color: #7f1d1d;
        font-size: 0.875rem;
      }
      .social-links__retry-btn {
        background: transparent;
        border: 1px solid currentColor;
        color: inherit;
        padding: 0.5rem 0.875rem;
        border-radius: 0.5rem;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.8125rem;
        min-height: 44px;
      }

      /* ── Form ──────────────────────────────── */
      .social-links__form {
        display: flex;
        flex-direction: column;
        gap: 0.875rem;
        min-width: min(420px, 80vw);
      }
      .social-links__field {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
      }
      .social-links__field-label {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--color-text-secondary, #64748b);
      }
      .social-links__input {
        height: 44px;
        padding: 0 0.875rem;
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: 0.5rem;
        font-size: 0.875rem;
        background: #ffffff;
        color: var(--color-text-primary, #0f172a);
      }
      .social-links__input:focus {
        outline: none;
        border-color: #0fbd66;
        box-shadow: 0 0 0 3px rgba(15, 189, 102, 0.2);
      }
      select.social-links__input {
        cursor: pointer;
      }
      .social-links__color-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .social-links__color-picker {
        width: 44px;
        height: 44px;
        padding: 0;
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: 0.5rem;
        cursor: pointer;
        background: transparent;
        flex-shrink: 0;
      }
      .social-links__color-row .social-links__input {
        flex: 1;
      }
      .social-links__checkbox {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: var(--color-text-primary, #0f172a);
        cursor: pointer;
        min-height: 44px;
      }
      .social-links__checkbox input {
        width: 1.125rem;
        height: 1.125rem;
        cursor: pointer;
      }
    `,
  ],
})
export class AdminSocialLinksPageComponent implements OnInit {
  protected readonly store = inject(AdminSocialLinksStore);
  private readonly transloco = inject(TranslocoService);

  readonly platforms = PLATFORMS;

  readonly form = signal<FormState>({ ...DEFAULT_FORM });
  readonly editingId = signal<string | null>(null);
  readonly showFormDialog = signal(false);
  readonly showDeleteConfirm = signal(false);
  readonly pendingDelete = signal<SocialLinkDto | null>(null);

  readonly isFormValid = computed(() => {
    const f = this.form();
    return f.url.trim() !== '' && /^https?:|^mailto:|^tel:|^geo:/i.test(f.url.trim());
  });

  ngOnInit(): void {
    this.store.ensureLoaded();
  }

  updateForm(patch: Partial<FormState>): void {
    this.form.update((f) => ({ ...f, ...patch }));
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.set({ ...DEFAULT_FORM });
    this.showFormDialog.set(true);
  }

  openEdit(link: SocialLinkDto): void {
    this.editingId.set(link.id);
    this.form.set({
      platform: link.platform,
      url: link.url,
      label: link.label,
      iconKey: link.iconKey ?? '',
      colorHex: link.colorHex ?? '',
      opensInNewTab: link.opensInNewTab,
    });
    this.showFormDialog.set(true);
  }

  closeForm(): void {
    this.showFormDialog.set(false);
    this.editingId.set(null);
  }

  submit(): void {
    if (!this.isFormValid()) return;
    const f = this.form();
    const payload: CreateSocialLinkPayload = {
      platform: f.platform,
      url: f.url.trim(),
      label: f.label.trim(),
      iconKey: f.iconKey.trim() === '' ? null : f.iconKey.trim(),
      colorHex: f.colorHex.trim() === '' ? null : f.colorHex.trim(),
      opensInNewTab: f.opensInNewTab,
    };

    const id = this.editingId();
    if (id) {
      this.store.update(id, payload, () => this.closeForm());
    } else {
      this.store.create(payload, () => this.closeForm());
    }
  }

  askDelete(link: SocialLinkDto): void {
    this.pendingDelete.set(link);
    this.showDeleteConfirm.set(true);
  }

  cancelDelete(): void {
    this.showDeleteConfirm.set(false);
    this.pendingDelete.set(null);
  }

  confirmDelete(): void {
    const link = this.pendingDelete();
    if (!link) return;
    this.store.delete(link.id, () => this.cancelDelete());
  }

  onToggle(link: SocialLinkDto, isEnabled: boolean): void {
    this.store.toggle(link.id, isEnabled);
  }

  platformIcon(platform: SocialPlatform): string {
    switch (platform) {
      case 'Email':
        return 'mail';
      case 'Phone':
        return 'call';
      case 'Website':
        return 'public';
      case 'Location':
        return 'location_on';
      case 'WhatsApp':
      case 'Telegram':
      case 'Messenger':
      case 'Discord':
      case 'WeChat':
      case 'Line':
      case 'Viber':
      case 'Skype':
        return 'chat';
      case 'YouTube':
      case 'TikTok':
        return 'play_circle';
      case 'Pinterest':
        return 'push_pin';
      default:
        return 'share';
    }
  }
}
