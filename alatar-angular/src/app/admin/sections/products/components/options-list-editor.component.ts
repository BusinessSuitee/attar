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
      <legend class="options-editor__legend">{{ label }}</legend>

      <div class="options-editor__add-row">
        <input
          type="text"
          class="options-editor__input"
          [(ngModel)]="draftEn"
          (keydown.enter)="add($event)"
          [placeholder]="('admin.products.form.field_name_en' | transloco)"
          [attr.aria-label]="('admin.products.form.field_name_en' | transloco)"
        />
        <input
          type="text"
          class="options-editor__input"
          [(ngModel)]="draftAr"
          dir="rtl"
          (keydown.enter)="add($event)"
          [placeholder]="('admin.products.form.field_name_ar' | transloco)"
          [attr.aria-label]="('admin.products.form.field_name_ar' | transloco)"
        />
        <button
          type="button"
          class="options-editor__add-btn"
          (click)="add()"
          [disabled]="!canAdd()"
        >
          {{ 'admin.products.form.add_option' | transloco }}
        </button>
      </div>

      @if (items.length > 0) {
        <ul class="options-editor__list" role="list">
          @for (item of items; track item.key; let i = $index) {
            <li class="options-editor__item">
              <span class="options-editor__chip">
                <span class="options-editor__chip-en">{{ item.labelEn || '—' }}</span>
                @if (item.labelAr) {
                  <span class="options-editor__chip-ar" dir="rtl">{{ item.labelAr }}</span>
                }
              </span>
              <button
                type="button"
                class="options-editor__remove"
                (click)="remove(i)"
                [attr.aria-label]="('admin.products.form.image_delete' | transloco)"
              >
                <span class="material-symbols-outlined">close</span>
              </button>
            </li>
          }
        </ul>
      } @else {
        <p class="options-editor__empty">{{ 'admin.products.form.option_placeholder' | transloco }}</p>
      }
    </fieldset>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .options-editor {
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: 0.75rem;
        padding: 0.875rem 1rem 1rem;
        background: var(--color-surface-card, #ffffff);
        margin: 0;
      }
      .options-editor__legend {
        font-size: 0.8125rem;
        font-weight: 700;
        color: var(--color-text-primary, #0f172a);
        padding: 0 0.375rem;
      }
      .options-editor__add-row {
        display: grid;
        grid-template-columns: 1fr 1fr auto;
        gap: 0.5rem;
        margin-top: 0.5rem;
      }
      @media (max-width: 559px) {
        .options-editor__add-row {
          grid-template-columns: 1fr;
        }
      }
      .options-editor__input {
        height: 44px;
        padding: 0 0.75rem;
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: 0.5rem;
        font-size: 0.875rem;
        background: #ffffff;
        color: var(--color-text-primary, #0f172a);
      }
      .options-editor__input:focus {
        outline: none;
        border-color: #0fbd66;
        box-shadow: 0 0 0 3px rgba(15, 189, 102, 0.18);
      }
      .options-editor__add-btn {
        min-height: 44px;
        padding: 0 1.25rem;
        background: #0fbd66;
        color: #ffffff;
        border: none;
        border-radius: 0.5rem;
        font-weight: 600;
        font-size: 0.875rem;
        cursor: pointer;
      }
      .options-editor__add-btn:hover:not(:disabled) {
        background: #0a8a4a;
      }
      .options-editor__add-btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }
      .options-editor__list {
        list-style: none;
        padding: 0;
        margin: 0.875rem 0 0;
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .options-editor__item {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
      }
      .options-editor__chip {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.375rem 0.75rem;
        background: var(--color-surface-subtle, #f1f5f9);
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: 9999px;
        font-size: 0.8125rem;
      }
      .options-editor__chip-en {
        font-weight: 600;
        color: var(--color-text-primary, #0f172a);
      }
      .options-editor__chip-ar {
        color: var(--color-text-secondary, #64748b);
        border-inline-start: 1px solid var(--color-border, #e2e8f0);
        padding-inline-start: 0.5rem;
      }
      .options-editor__remove {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border-radius: 9999px;
        background: transparent;
        border: 1px solid var(--color-border, #e2e8f0);
        color: var(--color-text-secondary, #64748b);
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
        margin: 0.875rem 0 0;
        font-size: 0.8125rem;
        color: var(--color-text-tertiary, #94a3b8);
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

  canAdd(): boolean {
    return this.draftEn().trim().length > 0 || this.draftAr().trim().length > 0;
  }

  add(event?: Event): void {
    if (event) event.preventDefault();
    const en = this.draftEn().trim();
    const ar = this.draftAr().trim();
    if (!en && !ar) return;

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
        .replace(/[^a-z0-9؀-ۿ]+/gi, '-')
        .replace(/^-+|-+$/g, '') || 'option'
    );
  }
}
