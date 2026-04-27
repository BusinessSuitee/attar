import { ChangeDetectionStrategy, Component, Input, forwardRef, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let nextId = 0;

@Component({
  selector: 'ui-input',
  standalone: true,
  template: `
    <label class="block">
      @if (label) {
        <span class="mb-1.5 block text-[13px] font-semibold text-slate-700">{{ label }}</span>
      }
      <input
        [id]="inputId"
        [type]="type"
        [placeholder]="placeholder"
        [disabled]="isDisabled()"
        [value]="value()"
        [attr.inputmode]="inputmode || null"
        [attr.aria-invalid]="errorMessage ? 'true' : null"
        [attr.aria-describedby]="describedBy()"
        class="block w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-[15px] text-slate-800 placeholder-slate-400 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 disabled:bg-slate-50 disabled:text-slate-400"
        [class.border-red-300]="!!errorMessage"
        [class.focus-visible:border-red-500]="!!errorMessage"
        [class.focus-visible:ring-red-200]="!!errorMessage"
        (input)="onInput($event)"
        (blur)="onTouchedFn()"
      />
      @if (hint && !errorMessage) {
        <span [id]="inputId + '-hint'" class="mt-1 block text-[12px] text-slate-500">{{ hint }}</span>
      }
      @if (errorMessage) {
        <span [id]="inputId + '-error'" class="mt-1 block text-[12px] text-red-600">{{ errorMessage }}</span>
      }
    </label>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'data-slot': 'input' },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
})
export class InputComponent implements ControlValueAccessor {
  readonly inputId = `ui-input-${++nextId}`;

  @Input() label = '';
  @Input() placeholder = '';
  @Input() type: 'text' | 'email' | 'tel' | 'number' | 'search' = 'text';
  @Input() inputmode: string | null = null;
  @Input() hint = '';
  @Input() errorMessage = '';

  readonly value = signal<string>('');
  private readonly disabled = signal<boolean>(false);

  isDisabled(): boolean {
    return this.disabled();
  }

  describedBy(): string | null {
    if (this.errorMessage) return `${this.inputId}-error`;
    if (this.hint) return `${this.inputId}-hint`;
    return null;
  }

  onInput(event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    this.value.set(v);
    this.onChangeFn(v);
  }

  // ControlValueAccessor
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
