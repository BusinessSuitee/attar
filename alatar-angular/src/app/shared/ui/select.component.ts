import { ChangeDetectionStrategy, Component, Input, forwardRef, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let nextId = 0;

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'ui-select',
  standalone: true,
  template: `
    <label class="block">
      @if (label) {
        <span class="mb-1.5 block text-[13px] font-semibold text-slate-700">{{ label }}</span>
      }
      <select
        [id]="selectId"
        [disabled]="isDisabled()"
        [attr.aria-invalid]="errorMessage ? 'true' : null"
        [attr.aria-describedby]="describedBy()"
        class="block w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-[15px] text-slate-800 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 disabled:bg-slate-50 disabled:text-slate-400"
        [class.border-red-300]="!!errorMessage"
        (change)="onChange($event)"
        (blur)="onTouchedFn()"
      >
        @if (placeholder) {
          <option value="" [selected]="!value()">{{ placeholder }}</option>
        }
        @for (option of options; track option.value) {
          <option [value]="option.value" [selected]="value() === option.value" [disabled]="option.disabled || null">
            {{ option.label }}
          </option>
        }
      </select>
      @if (hint && !errorMessage) {
        <span [id]="selectId + '-hint'" class="mt-1 block text-[12px] text-slate-500">{{ hint }}</span>
      }
      @if (errorMessage) {
        <span [id]="selectId + '-error'" class="mt-1 block text-[12px] text-red-600">{{ errorMessage }}</span>
      }
    </label>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'data-slot': 'select' },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
})
export class SelectComponent implements ControlValueAccessor {
  readonly selectId = `ui-select-${++nextId}`;

  @Input() label = '';
  @Input() placeholder = '';
  @Input() options: SelectOption[] = [];
  @Input() hint = '';
  @Input() errorMessage = '';

  readonly value = signal<string>('');
  private readonly disabled = signal<boolean>(false);

  isDisabled(): boolean {
    return this.disabled();
  }

  describedBy(): string | null {
    if (this.errorMessage) return `${this.selectId}-error`;
    if (this.hint) return `${this.selectId}-hint`;
    return null;
  }

  onChange(event: Event): void {
    const v = (event.target as HTMLSelectElement).value;
    this.value.set(v);
    this.onChangeFn(v);
  }

  private onChangeFn: (v: string) => void = () => {};
  onTouchedFn: () => void = () => {};

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (v: string) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
