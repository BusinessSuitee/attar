import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';

import { LocalizedProductOption } from '../../../../core/products/product.service';

@Component({
  selector: 'app-options-list-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <fieldset class="options-editor">
      <div class="options-editor__header">
        <legend class="options-editor__legend">{{ label }}</legend>
        <span class="options-editor__count">
          {{ 'admin.products.form.option_count' | transloco: { count: items.length } }}
        </span>
      </div>

      <p class="options-editor__hint">
        {{ 'admin.products.form.option_helper' | transloco }}
      </p>

      <div class="options-editor__composer">
        <label class="options-editor__field">
          <span class="options-editor__label">
            {{ 'admin.products.form.field_name_en' | transloco }}
          </span>
          <input
            type="text"
            class="options-editor__input"
            [(ngModel)]="draftEn"
            (ngModelChange)="clearFeedback()"
            (keydown.enter)="add($event)"
            [placeholder]="'admin.products.form.field_name_en' | transloco"
            [attr.aria-label]="'admin.products.form.field_name_en' | transloco"
          />
        </label>

        <label class="options-editor__field">
          <span class="options-editor__label">
            {{ 'admin.products.form.field_name_ar' | transloco }}
          </span>
          <input
            type="text"
            class="options-editor__input"
            [(ngModel)]="draftAr"
            dir="rtl"
            (ngModelChange)="clearFeedback()"
            (keydown.enter)="add($event)"
            [placeholder]="'admin.products.form.field_name_ar' | transloco"
            [attr.aria-label]="'admin.products.form.field_name_ar' | transloco"
          />
        </label>

        <button
          type="button"
          class="options-editor__add-btn"
          (click)="add()"
          [disabled]="!canAdd()"
        >
          {{ 'admin.products.form.add_option' | transloco }}
        </button>
      </div>

      @if (feedbackKey()) {
        <p class="options-editor__feedback" role="alert">
          {{ feedbackKey()! | transloco }}
        </p>
      }

      @if (items.length > 0) {
        <div class="options-editor__tokens" role="list">
          @for (item of items; track item.key; let i = $index) {
            <article class="options-editor__token" role="listitem">
              <div class="options-editor__token-copy">
                <strong class="options-editor__token-en">
                  {{ item.labelEn || ('admin.products.form.option_en_missing' | transloco) }}
                </strong>
                <span class="options-editor__token-ar" dir="rtl">
                  {{ item.labelAr || ('admin.products.form.option_ar_missing' | transloco) }}
                </span>
              </div>

              <button
                type="button"
                class="options-editor__remove"
                (click)="remove(i)"
                [attr.aria-label]="'admin.products.form.image_delete' | transloco"
              >
                <span class="material-symbols-outlined">close</span>
              </button>
            </article>
          }
        </div>
      } @else {
        <p class="options-editor__empty">
          {{ 'admin.products.form.option_placeholder' | transloco }}
        </p>
      }
    </fieldset>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .options-editor {
        display: flex;
        flex-direction: column;
        gap: 0.9rem;
        min-height: 100%;
        border: 1px solid rgba(15, 23, 42, 0.08);
        border-radius: 1.2rem;
        padding: 1rem;
        background:
          radial-gradient(circle at top right, rgba(19, 194, 122, 0.12), transparent 24%), #ffffff;
        margin: 0;
      }
      .options-editor__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        flex-wrap: wrap;
      }
      .options-editor__legend {
        font-size: 0.92rem;
        font-weight: 800;
        color: #0f172a;
        padding: 0;
      }
      .options-editor__count {
        display: inline-flex;
        align-items: center;
        min-height: 30px;
        padding: 0 0.75rem;
        border-radius: 999px;
        background: rgba(15, 157, 88, 0.12);
        color: #0b7a45;
        font-size: 0.76rem;
        font-weight: 700;
      }
      .options-editor__hint {
        margin: 0;
        font-size: 0.82rem;
        line-height: 1.6;
        color: #64748b;
      }
      .options-editor__composer {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr)) auto;
        gap: 0.65rem;
        align-items: end;
      }
      .options-editor__field {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
      }
      .options-editor__label {
        font-size: 0.78rem;
        font-weight: 700;
        color: #475569;
      }
      .options-editor__input {
        min-height: 46px;
        padding: 0 0.85rem;
        border: 1px solid var(--color-border, #d8e2ec);
        border-radius: 0.95rem;
        font-size: 0.875rem;
        background: #ffffff;
        color: #0f172a;
      }
      .options-editor__input:focus {
        outline: none;
        border-color: #13c27a;
        box-shadow: 0 0 0 4px rgba(19, 194, 122, 0.16);
      }
      .options-editor__add-btn {
        min-height: 46px;
        padding: 0 1.15rem;
        border: none;
        border-radius: 0.95rem;
        background: linear-gradient(135deg, #0f9d58 0%, #13c27a 100%);
        color: #ffffff;
        font-weight: 700;
        font-size: 0.875rem;
        cursor: pointer;
        white-space: nowrap;
      }
      .options-editor__add-btn:hover:not(:disabled) {
        background: linear-gradient(135deg, #0a8a4a 0%, #0fad69 100%);
      }
      .options-editor__add-btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }
      .options-editor__feedback {
        margin: 0;
        padding: 0.7rem 0.85rem;
        border-radius: 0.9rem;
        background: #fff7ed;
        color: #9a3412;
        font-size: 0.8rem;
      }
      .options-editor__tokens {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 0.65rem;
      }
      .options-editor__token {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 0.6rem;
        padding: 0.85rem;
        border-radius: 1rem;
        border: 1px solid rgba(15, 23, 42, 0.08);
        background: #f8fbff;
      }
      .options-editor__token-copy {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        min-width: 0;
      }
      .options-editor__token-en,
      .options-editor__token-ar {
        overflow-wrap: anywhere;
      }
      .options-editor__token-en {
        color: #0f172a;
        font-size: 0.86rem;
      }
      .options-editor__token-ar {
        color: #64748b;
        font-size: 0.82rem;
      }
      .options-editor__remove {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        flex-shrink: 0;
        border-radius: 999px;
        background: #ffffff;
        border: 1px solid rgba(15, 23, 42, 0.1);
        color: #64748b;
        cursor: pointer;
      }
      .options-editor__remove:hover {
        background: #fee2e2;
        color: #b3142f;
        border-color: #fecaca;
      }
      .options-editor__remove .material-symbols-outlined {
        font-size: 1rem;
      }
      .options-editor__empty {
        margin: 0;
        padding: 1rem;
        border-radius: 1rem;
        border: 1px dashed rgba(148, 163, 184, 0.55);
        color: #94a3b8;
        font-size: 0.82rem;
        text-align: center;
        background: #f8fafc;
      }
      @media (max-width: 719px) {
        .options-editor__composer {
          grid-template-columns: 1fr;
        }
        .options-editor__add-btn {
          width: 100%;
        }
      }
    `,
  ],
})
export class OptionsListEditorComponent {
  @Input({ required: true }) label!: string;
  @Input() items: LocalizedProductOption[] = [];

  @Output() readonly itemsChange = new EventEmitter<LocalizedProductOption[]>();

  readonly draftEn = signal<string>('');
  readonly draftAr = signal<string>('');
  readonly feedbackKey = signal<string | null>(null);

  canAdd(): boolean {
    return this.draftEn().trim().length > 0 || this.draftAr().trim().length > 0;
  }

  clearFeedback(): void {
    this.feedbackKey.set(null);
  }

  add(event?: Event): void {
    if (event) {
      event.preventDefault();
    }

    const en = this.draftEn().trim();
    const ar = this.draftAr().trim();
    if (!en && !ar) {
      return;
    }

    const duplicate = this.items.some((item) => {
      const sameEn = !!en && (item.labelEn || '').trim().toLowerCase() === en.toLowerCase();
      const sameAr = !!ar && (item.labelAr || '').trim() === ar;
      const sameFallback =
        (item.labelEn || item.labelAr || '').trim().toLowerCase() === (en || ar).toLowerCase();

      return sameEn || sameAr || sameFallback;
    });

    if (duplicate) {
      this.feedbackKey.set('admin.products.form.option_duplicate');
      return;
    }

    const baseKey = this.slugify(en || ar);
    let key = baseKey;
    let n = 2;
    const used = new Set(this.items.map((i) => i.key));
    while (used.has(key)) {
      key = `${baseKey}-${n++}`;
    }

    const next = [...this.items, { key, labelEn: en, labelAr: ar }];
    this.itemsChange.emit(next);
    this.draftEn.set('');
    this.draftAr.set('');
    this.feedbackKey.set(null);
  }

  remove(index: number): void {
    const next = this.items.filter((_, i) => i !== index);
    this.itemsChange.emit(next);
  }

  private slugify(value: string): string {
    return (
      value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\u0600-\u06ff]+/gi, '-')
        .replace(/^-+|-+$/g, '') || 'option'
    );
  }
}
