import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'lg';

@Component({
  selector: 'ui-button',
  standalone: true,
  imports: [NgClass],
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      [attr.aria-busy]="loading || null"
      [ngClass]="classes()"
      (click)="onClick($event)"
    >
      @if (loading) {
        <span
          class="me-2 inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        ></span>
      }
      <ng-content />
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'data-slot': 'button' },
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() loading = false;
  @Output() readonly clicked = new EventEmitter<MouseEvent>();

  classes(): string[] {
    return [
      'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-colors',
      'min-h-11 min-w-11',
      this.size === 'lg' ? 'px-6 text-[16px]' : 'px-4 text-[14px]',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary',
      'disabled:opacity-60 disabled:cursor-not-allowed',
      this.variantClass(),
    ];
  }

  private variantClass(): string {
    switch (this.variant) {
      case 'secondary':
        return 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-50';
      case 'ghost':
        return 'bg-transparent text-slate-700 hover:bg-slate-100';
      case 'danger':
        return 'bg-red-600 text-white hover:bg-red-700';
      default:
        return 'bg-primary text-white hover:bg-primary-dark';
    }
  }

  onClick(event: MouseEvent): void {
    if (this.disabled || this.loading) return;
    this.clicked.emit(event);
  }
}
